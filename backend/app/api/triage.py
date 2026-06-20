import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, UserRole, TriageSession, TriageMessage, TriageResultModel
from app.api.deps import get_current_user, require_role, get_current_user_optional
from app.schemas.triage import IntakeResponse, TriageMessageCreate, TriageSessionResponse, TriageMessageResponse, TriageResult, TriageSessionSummary
from app.services.intake_state_machine import create_session, process_message

router = APIRouter()

@router.post("/sessions", response_model=IntakeResponse)
def start_triage_session(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    patient_id = current_user.id if current_user else None
    return create_session(db, patient_id)

@router.get("/sessions", response_model=List[TriageSessionSummary])
def get_triage_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    sessions = db.query(TriageSession).filter(TriageSession.patient_id == current_user.id).order_by(TriageSession.created_at.desc()).all()
    res = []
    for s in sessions:
        summary = TriageSessionSummary(
            id=s.id,
            created_at=s.created_at,
            is_completed=s.is_completed
        )
        if s.is_completed and s.result:
            summary.risk_level = s.result.risk_level
            summary.recommended_specialist = s.result.recommended_specialist
        res.append(summary)
    return res

@router.post("/sessions/{session_id}/message", response_model=IntakeResponse)
def submit_triage_message(
    session_id: uuid.UUID,
    message: TriageMessageCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    try:
        session = db.query(TriageSession).filter(TriageSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        if session.patient_id is not None:
            if not current_user or session.patient_id != current_user.id:
                raise HTTPException(status_code=403, detail="Not authorized to access this session")
                
        return process_message(db, session_id, message.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}", response_model=TriageSessionResponse)
def get_triage_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    session = db.query(TriageSession).filter(TriageSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if session.patient_id is not None:
        if not current_user or session.patient_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
            
    messages = db.query(TriageMessage).filter(TriageMessage.session_id == session.id).order_by(TriageMessage.created_at).all()
    
    t_result = None
    if session.is_completed and session.result:
        t_result = TriageResult(
            risk_level=session.result.risk_level,
            score_breakdown=session.result.score_breakdown,
            recommended_specialist=session.result.recommended_specialist,
            emergency_flag=session.result.emergency_flag,
            response_text=session.result.response_text,
            citations=session.result.citations
        )
            
    return TriageSessionResponse(
        id=session.id,
        patient_id=session.patient_id,
        current_state=session.current_state,
        is_completed=session.is_completed,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[TriageMessageResponse.from_orm(m) for m in messages],
        result=t_result
    )
