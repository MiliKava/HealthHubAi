import uuid
from sqlalchemy.orm import Session
from app.db.models import TriageSession, TriageMessage, TriageResultModel, ExtractedSymptomModel, PatientProfile, User
from app.schemas.triage import IntakeResponse, TriageResult
from app.services.symptom_extractor import extract_symptoms
from app.services.scoring_engine import score_triage
import re

QUESTIONS = {
    "initial_complaint": "Please describe what you're experiencing.",
    "ask_duration": "How long have you been experiencing this?",
    "ask_severity": "On a scale of 1–10, how severe is it right now?",
    "ask_associated_symptoms": "Are you experiencing any other symptoms alongside this?",
    "ask_relevant_history": "Do you have any relevant medical history or conditions we should know about?",
    "assessment": None
}

STATE_TRANSITIONS = {
    "initial_complaint": "ask_duration",
    "ask_duration": "ask_severity",
    "ask_severity": "ask_associated_symptoms",
    "ask_associated_symptoms": "ask_relevant_history",
    "ask_relevant_history": "assessment"
}

def create_session(db: Session, patient_id: uuid.UUID) -> IntakeResponse:
    session = TriageSession(patient_id=patient_id, current_state="initial_complaint")
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Assistant asks first question
    msg = TriageMessage(
        session_id=session.id,
        sender="assistant",
        content=QUESTIONS["initial_complaint"],
        step_type="initial_complaint"
    )
    db.add(msg)
    db.commit()
    
    return IntakeResponse(
        session_id=session.id,
        next_question=QUESTIONS["initial_complaint"],
        is_completed=False,
        result=None
    )

def process_message(db: Session, session_id: uuid.UUID, user_content: str) -> IntakeResponse:
    session = db.query(TriageSession).filter(TriageSession.id == session_id).first()
    if not session:
        raise ValueError("Session not found")
        
    if session.is_completed:
        # If already completed, just return the result
        result_model = db.query(TriageResultModel).filter(TriageResultModel.session_id == session.id).first()
        t_result = None
        if result_model:
            t_result = TriageResult(
                risk_level=result_model.risk_level,
                score_breakdown=result_model.score_breakdown,
                recommended_specialist=result_model.recommended_specialist,
                emergency_flag=result_model.emergency_flag
            )
        return IntakeResponse(
            session_id=session.id,
            next_question="",
            is_completed=True,
            result=t_result
        )

    current_state = session.current_state
    
    # Save user message
    user_msg = TriageMessage(
        session_id=session.id,
        sender="user",
        content=user_content,
        step_type=current_state
    )
    db.add(user_msg)
    
    # Transition
    next_state = STATE_TRANSITIONS.get(current_state)
    session.current_state = next_state
    db.commit()
    
    if next_state == "assessment":
        session.is_completed = True
        db.commit()
        
        # Run extraction and scoring
        # Get all messages
        messages = db.query(TriageMessage).filter(TriageMessage.session_id == session.id).order_by(TriageMessage.created_at).all()
        
        complaint = ""
        duration = ""
        severity_str = ""
        associated = ""
        history = ""
        
        for m in messages:
            if m.sender == "user":
                if m.step_type == "initial_complaint":
                    complaint = m.content
                elif m.step_type == "ask_duration":
                    duration = m.content
                elif m.step_type == "ask_severity":
                    severity_str = m.content
                elif m.step_type == "ask_associated_symptoms":
                    associated = m.content
                elif m.step_type == "ask_relevant_history":
                    history = m.content
                    
        # Extract symptoms
        combined_text = f"Complaint: {complaint}\nAssociated: {associated}"
        extracted_symptoms = extract_symptoms(combined_text)
        
        # Save extracted symptoms
        for es in extracted_symptoms:
            es_model = ExtractedSymptomModel(
                session_id=session.id,
                symptom_name=es.canonical_symptom,
                status="present" # Extractor currently just returns present
            )
            db.add(es_model)
            
        db.commit()
        
        # Parse severity
        severity = 5
        nums = re.findall(r'\d+', severity_str)
        if nums:
            severity = int(nums[0])
            
        # Get patient profile
        patient = db.query(PatientProfile).filter(PatientProfile.user_id == session.patient_id).first()
        
        # Scoring
        result = score_triage(extracted_symptoms, severity, duration, patient)
        
        # Save result
        res_model = TriageResultModel(
            session_id=session.id,
            risk_level=result.risk_level,
            score_breakdown=result.score_breakdown,
            recommended_specialist=result.recommended_specialist,
            emergency_flag=result.emergency_flag
        )
        db.add(res_model)
        db.commit()
        
        return IntakeResponse(
            session_id=session.id,
            next_question="",
            is_completed=True,
            result=result
        )
    else:
        # Assistant asks next question
        next_q = QUESTIONS[next_state]
        asst_msg = TriageMessage(
            session_id=session.id,
            sender="assistant",
            content=next_q,
            step_type=next_state
        )
        db.add(asst_msg)
        db.commit()
        
        return IntakeResponse(
            session_id=session.id,
            next_question=next_q,
            is_completed=False,
            result=None
        )
