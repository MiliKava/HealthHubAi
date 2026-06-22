from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
import logging

from app.db.database import get_db
from app.db.models import User, UserRole, AppointmentRequest, AppointmentRequestStatus, TriageSession, TriageResultModel, ExtractedSymptomModel, DoctorProfile
from app.api.deps import get_current_user, require_role
from app.schemas.appointment import AppointmentRequestCreate, AppointmentRequestResponse, AppointmentRequestWithSummary, AppointmentRequestAccept

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

    # Note: Trigger patient notification logic here

    return req
