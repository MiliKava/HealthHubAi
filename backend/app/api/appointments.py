from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import uuid
from datetime import datetime, timedelta, timezone
import logging

from app.db.database import get_db
from app.db.models import User, UserRole, AppointmentRequest, AppointmentRequestStatus, TriageSession, TriageResultModel, ExtractedSymptomModel, DoctorProfile
from app.api.deps import get_current_user, require_role
from app.schemas.appointment import AppointmentRequestCreate, AppointmentRequestResponse, AppointmentRequestWithSummary, AppointmentRequestAccept
from app.services.notification_service import notification_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/requests", response_model=AppointmentRequestResponse)
def create_appointment_request(
    request_in: AppointmentRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    # Verify doctor exists and is approved
    doctor = db.query(User).join(DoctorProfile, User.id == DoctorProfile.user_id).filter(
        User.id == request_in.doctor_id,
        User.role == UserRole.DOCTOR,
        DoctorProfile.approval_status.in_(["approved", "APPROVED"])
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found or not approved")

    # Verify triage session exists and belongs to the current user
    triage_session = db.query(TriageSession).filter(
        TriageSession.id == request_in.triage_session_id,
        TriageSession.patient_id == current_user.id
    ).first()
    if not triage_session:
        raise HTTPException(status_code=404, detail="Triage session not found or does not belong to you")

    # Check if a request already exists
    existing_request = db.query(AppointmentRequest).filter(
        AppointmentRequest.patient_id == current_user.id,
        AppointmentRequest.doctor_id == request_in.doctor_id,
        AppointmentRequest.triage_session_id == request_in.triage_session_id
    ).first()
    if existing_request:
        raise HTTPException(status_code=400, detail="Appointment request already exists for this triage session and doctor")

    # Create request
    new_request = AppointmentRequest(
        patient_id=current_user.id,
        doctor_id=request_in.doctor_id,
        triage_session_id=request_in.triage_session_id,
        status=AppointmentRequestStatus.REQUESTED
    )
    db.add(new_request)
    db.commit()
    db.refresh(new_request)

    # Log intent for notification email (Phase 20)
    logger.info(f"Notification intent: Send appointment request email to doctor {doctor.email} for request {new_request.id}")
    
    triage_result = db.query(TriageResultModel).filter(TriageResultModel.session_id == request_in.triage_session_id).first()
    symptoms = db.query(ExtractedSymptomModel).filter(ExtractedSymptomModel.session_id == request_in.triage_session_id).all()
    
    triage_summary = ""
    if triage_result:
        symptom_list = [s.symptom_name for s in symptoms]
        triage_summary = f"""
        <p><strong>Risk Level:</strong> {triage_result.risk_level}</p>
        <p><strong>Symptoms:</strong> {", ".join(symptom_list)}</p>
        """

    html_body = f"""
    <p>Hello Dr. {doctor.full_name},</p>
    <p>You have a new appointment request from {current_user.full_name}.</p>
    {triage_summary}
    <p><a href="http://localhost:5173/doctor-dashboard">View Dashboard</a></p>
    <hr>
    <p><small>Medical Disclaimer: HealthHub AI provides preliminary triage and is not a substitute for professional medical advice, diagnosis, or treatment.</small></p>
    """
    notification_service.send_email(
        to=doctor.email,
        subject=f"New appointment request from {current_user.full_name}",
        html_body=html_body
    )

    return new_request

@router.get("/requests", response_model=List[AppointmentRequestWithSummary])
def get_appointment_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    requests = db.query(AppointmentRequest).filter(
        AppointmentRequest.patient_id == current_user.id
    ).order_by(AppointmentRequest.created_at.desc()).all()

    result = []
    for req in requests:
        # Get triage summary
        triage_result = db.query(TriageResultModel).filter(TriageResultModel.session_id == req.triage_session_id).first()
        symptoms = db.query(ExtractedSymptomModel).filter(ExtractedSymptomModel.session_id == req.triage_session_id).all()
        
        doctor_user = db.query(User).filter(User.id == req.doctor_id).first()
        doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == req.doctor_id).first()
        
        triage_summary = None
        if triage_result:
            symptom_list = [s.symptom_name for s in symptoms]
            triage_summary = {
                "risk_level": triage_result.risk_level,
                "symptoms": ", ".join(symptom_list),
                "specialist_recommendation": triage_result.recommended_specialist
            }
            
        doctor_details = None
        if doctor_user and doctor_profile:
            doctor_details = {
                "name": doctor_user.full_name,
                "specialty": doctor_profile.specialty
            }

        req_dict = {
            "id": req.id,
            "patient_id": req.patient_id,
            "doctor_id": req.doctor_id,
            "triage_session_id": req.triage_session_id,
            "status": req.status,
            "proposed_slot": req.proposed_slot,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
            "triage_summary": triage_summary,
            "doctor_details": doctor_details
        }
        result.append(req_dict)

    return result

@router.get("/requests/{request_id}", response_model=AppointmentRequestWithSummary)
def get_appointment_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    req = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Appointment request not found")

    triage_result = db.query(TriageResultModel).filter(TriageResultModel.session_id == req.triage_session_id).first()
    symptoms = db.query(ExtractedSymptomModel).filter(ExtractedSymptomModel.session_id == req.triage_session_id).all()
    
    doctor_user = db.query(User).filter(User.id == req.doctor_id).first()
    doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == req.doctor_id).first()

    triage_summary = None
    if triage_result:
        symptom_list = [s.symptom_name for s in symptoms]
        triage_summary = {
            "risk_level": triage_result.risk_level,
            "symptoms": ", ".join(symptom_list),
            "specialist_recommendation": triage_result.recommended_specialist
        }
        
    doctor_details = None
    if doctor_user and doctor_profile:
        doctor_details = {
            "name": doctor_user.full_name,
            "specialty": doctor_profile.specialty
        }

    return {
        "id": req.id,
        "patient_id": req.patient_id,
        "doctor_id": req.doctor_id,
        "triage_session_id": req.triage_session_id,
        "status": req.status,
        "proposed_slot": req.proposed_slot,
        "created_at": req.created_at,
        "updated_at": req.updated_at,
        "triage_summary": triage_summary,
        "doctor_details": doctor_details
    }

@router.post("/requests/{request_id}/accept", response_model=AppointmentRequestResponse)
def accept_appointment_request(
    request_id: UUID,
    accept_data: AppointmentRequestAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    req = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.doctor_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Appointment request not found")

    if req.status != AppointmentRequestStatus.REQUESTED:
        raise HTTPException(status_code=400, detail="Only 'requested' appointments can be accepted")

    req.status = AppointmentRequestStatus.PROPOSED
    req.proposed_slot = accept_data.proposed_slot
    db.commit()
    db.refresh(req)

    patient = db.query(User).filter(User.id == req.patient_id).first()
    
    html_body = f"""
    <p>Hello {patient.full_name},</p>
    <p>Dr. {current_user.full_name} has proposed a time slot for your appointment:</p>
    <p><strong>Proposed Slot:</strong> {req.proposed_slot}</p>
    <p><a href="http://localhost:5173/appointments">Accept or Reject this slot</a></p>
    <hr>
    <p><small>Medical Disclaimer: HealthHub AI provides preliminary triage and is not a substitute for professional medical advice, diagnosis, or treatment.</small></p>
    """
    notification_service.send_email(
        to=patient.email,
        subject=f"Dr. {current_user.full_name} proposed a time slot",
        html_body=html_body
    )

    return req

@router.post("/requests/{request_id}/decline", response_model=AppointmentRequestResponse)
def decline_appointment_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    req = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.doctor_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Appointment request not found")

    if req.status != AppointmentRequestStatus.REQUESTED:
        raise HTTPException(status_code=400, detail="Only 'requested' appointments can be declined")

    req.status = AppointmentRequestStatus.REJECTED
    db.commit()
    db.refresh(req)

    patient = db.query(User).filter(User.id == req.patient_id).first()
    html_body = f"""
    <p>Hello {patient.full_name},</p>
    <p>Your appointment request with Dr. {current_user.full_name} was declined.</p>
    <p>Please log in to HealthHub AI to find and request an appointment with another doctor.</p>
    <hr>
    <p><small>Medical Disclaimer: HealthHub AI provides preliminary triage and is not a substitute for professional medical advice, diagnosis, or treatment.</small></p>
    """
    notification_service.send_email(
        to=patient.email,
        subject="Your appointment request was declined",
        html_body=html_body
    )

    return req

@router.post("/requests/{request_id}/confirm", response_model=AppointmentRequestResponse)
def confirm_appointment_request(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    req = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Appointment request not found")

    if req.status != AppointmentRequestStatus.PROPOSED:
        raise HTTPException(status_code=400, detail="Only 'proposed' appointments can be confirmed")

    from app.db.models import Appointment, AppointmentStatus

    req.status = AppointmentRequestStatus.CONFIRMED
    
    appointment = Appointment(
        request_id=req.id,
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        scheduled_time=req.proposed_slot,
        status=AppointmentStatus.SCHEDULED,
        meeting_room_id=str(uuid.uuid4())
    )
    db.add(appointment)
    
    db.commit()
    db.refresh(req)

    doctor = db.query(User).filter(User.id == req.doctor_id).first()
    
    # Notify Patient
    patient_body = f"""
    <p>Hello {current_user.full_name},</p>
    <p>Your appointment with Dr. {doctor.full_name} is confirmed.</p>
    <p><strong>Time:</strong> {req.proposed_slot}</p>
    <p>Don't forget to join the call at the scheduled time.</p>
    <hr>
    <p><small>Medical Disclaimer: HealthHub AI provides preliminary triage and is not a substitute for professional medical advice, diagnosis, or treatment.</small></p>
    """
    notification_service.send_email(
        to=current_user.email,
        subject=f"Your appointment is confirmed — {req.proposed_slot}",
        html_body=patient_body
    )

    # Notify Doctor
    doctor_body = f"""
    <p>Hello Dr. {doctor.full_name},</p>
    <p>Your appointment with {current_user.full_name} is confirmed.</p>
    <p><strong>Time:</strong> {req.proposed_slot}</p>
    <p>Don't forget to join the call at the scheduled time.</p>
    <hr>
    <p><small>Medical Disclaimer: HealthHub AI provides preliminary triage and is not a substitute for professional medical advice, diagnosis, or treatment.</small></p>
    """
    notification_service.send_email(
        to=doctor.email,
        subject=f"Your appointment is confirmed — {req.proposed_slot}",
        html_body=doctor_body
    )

    return req

@router.post("/requests/{request_id}/reject-slot", response_model=AppointmentRequestResponse)
def reject_appointment_request_slot(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    req = db.query(AppointmentRequest).filter(
        AppointmentRequest.id == request_id,
        AppointmentRequest.patient_id == current_user.id
    ).first()

    if not req:
        raise HTTPException(status_code=404, detail="Appointment request not found")

    if req.status != AppointmentRequestStatus.PROPOSED:
        raise HTTPException(status_code=400, detail="Only 'proposed' appointments can have their slots rejected")

    req.status = AppointmentRequestStatus.REQUESTED
    req.proposed_slot = None
    db.commit()
    db.refresh(req)

    return req

@router.post("/requests/{request_id}/join-token")
def get_appointment_join_token(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.db.models import Appointment
    appointment = db.query(Appointment).filter(Appointment.request_id == request_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if current_user.id not in [appointment.patient_id, appointment.doctor_id]:
        raise HTTPException(status_code=403, detail="Not a participant in this appointment")

    if not appointment.meeting_link_active:
        raise HTTPException(status_code=403, detail="Meeting link is no longer active")

    # Frontend now sends correct UTC timestamps, so we just use utcnow
    now = datetime.utcnow()
    
    # allow joining 15 minutes before and up to 2 hours after
    time_diff = appointment.scheduled_time - now
    if time_diff > timedelta(minutes=15):
        raise HTTPException(status_code=403, detail=f"Too early to join the meeting. Current time is {now.strftime('%I:%M %p')}, scheduled for {appointment.scheduled_time.strftime('%I:%M %p')}.")
    
    if now - appointment.scheduled_time > timedelta(hours=2):
        raise HTTPException(status_code=403, detail="Meeting time has expired.")

    # Generate a unique session token for this participant
    participant_token = str(uuid.uuid4())
    
    return {
        "room_id": appointment.meeting_room_id,
        "token": participant_token,
        "role": current_user.role
    }

@router.post("/requests/{request_id}/end-call")
def end_appointment_call(
    request_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    from app.db.models import Appointment, AppointmentStatus
    appointment = db.query(Appointment).filter(
        Appointment.request_id == request_id,
        Appointment.doctor_id == current_user.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.meeting_link_active = False
    # Not setting status to completed here, done in complete route
    db.commit()
    db.refresh(appointment)

    return {"detail": "Meeting ended successfully"}

from pydantic import BaseModel
class CompleteAppointmentRequest(BaseModel):
    notes: str | None = None

@router.post("/requests/{request_id}/complete")
def complete_appointment(
    request_id: UUID,
    data: CompleteAppointmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.DOCTOR]))
):
    from app.db.models import Appointment, AppointmentStatus
    appointment = db.query(Appointment).filter(
        Appointment.request_id == request_id,
        Appointment.doctor_id == current_user.id
    ).first()

    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = AppointmentStatus.COMPLETED
    appointment.notes = data.notes
    appointment.completed_at = datetime.utcnow()
    appointment.meeting_link_active = False
    db.commit()
    db.refresh(appointment)
    
    patient = db.query(User).filter(User.id == appointment.patient_id).first()
    
    # Notify Patient
    patient_body = f"""
    <p>Hello {patient.full_name},</p>
    <p>Your appointment with Dr. {current_user.full_name} has been marked as completed.</p>
    <p>Thank you for using HealthHub AI.</p>
    <hr>
    <p><small>Medical Disclaimer: HealthHub AI provides preliminary triage and is not a substitute for professional medical advice, diagnosis, or treatment.</small></p>
    """
    notification_service.send_email(
        to=patient.email,
        subject=f"Appointment Completed — Dr. {current_user.full_name}",
        html_body=patient_body
    )

    # Notify Doctor
    doctor_body = f"""
    <p>Hello Dr. {current_user.full_name},</p>
    <p>You have successfully completed the appointment with {patient.full_name}.</p>
    <p>Your consultation notes have been saved.</p>
    <hr>
    <p><small>Medical Disclaimer: HealthHub AI provides preliminary triage and is not a substitute for professional medical advice, diagnosis, or treatment.</small></p>
    """
    notification_service.send_email(
        to=current_user.email,
        subject=f"Appointment Completed — {patient.full_name}",
        html_body=doctor_body
    )

    return {"detail": "Appointment marked as completed"}
