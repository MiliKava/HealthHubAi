import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.db.models import User, UserRole, TriageSession, AppointmentRequest, AppointmentRequestStatus

def seed_appointment_request():
    db = SessionLocal()
    try:
        # Get doctor "juliya vaghani"
        doctor = db.query(User).filter(User.email == "juliya@gmail.com", User.role == UserRole.DOCTOR).first()
        if not doctor:
            print("Doctor Juliya not found")
            return
            
        # Get a recent patient
        patient = db.query(User).filter(User.role == UserRole.PATIENT).order_by(User.created_at.desc()).first()
        if not patient:
            print("No patients found")
            return
            
        # Get or create a triage session for this patient
        session = db.query(TriageSession).filter(TriageSession.patient_id == patient.id).order_by(TriageSession.created_at.desc()).first()
        if not session:
            session = TriageSession(patient_id=patient.id, is_completed=True)
            db.add(session)
            db.commit()
            db.refresh(session)
            
        # Check if request already exists
        existing = db.query(AppointmentRequest).filter(
            AppointmentRequest.doctor_id == doctor.id,
            AppointmentRequest.patient_id == patient.id,
            AppointmentRequest.triage_session_id == session.id
        ).first()
        
        if existing:
            print(f"Request already exists: {existing.id}")
            return
            
        # Create request
        req = AppointmentRequest(
            patient_id=patient.id,
            doctor_id=doctor.id,
            triage_session_id=session.id,
            status=AppointmentRequestStatus.REQUESTED
        )
        db.add(req)
        db.commit()
        print(f"Successfully created appointment request {req.id} for doctor Juliya Vaghani from patient {patient.full_name}")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_appointment_request()
