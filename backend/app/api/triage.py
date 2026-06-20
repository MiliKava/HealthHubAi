import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, UserRole, TriageSession, TriageMessage, TriageResultModel
from app.api.deps import get_current_user, require_role
from app.schemas.triage import IntakeResponse, TriageMessageCreate, TriageSessionResponse, TriageMessageResponse, TriageResult
from app.services.intake_state_machine import create_session, process_message

router = APIRouter()

@router.post("/sessions", response_model=IntakeResponse)
def start_triage_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    return create_session(db, current_user.id)

@router.post("/sessions/{session_id}/message", response_model=IntakeResponse)
def submit_triage_message(
    session_id: uuid.UUID,
    message: TriageMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    try:
        # Validate session belongs to user
        session = db.query(TriageSession).filter(TriageSession.id == session_id, TriageSession.patient_id == current_user.id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        return process_message(db, session_id, message.content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{session_id}", response_model=TriageSessionResponse)
def get_triage_session(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.PATIENT]))
):
    session = db.query(TriageSession).filter(TriageSession.id == session_id, TriageSession.patient_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = db.query(TriageMessage).filter(TriageMessage.session_id == session.id).order_by(TriageMessage.created_at).all()
    
    t_result = None
    if session.is_completed:
        result_model = db.query(TriageResultModel).filter(TriageResultModel.session_id == session.id).first()
        if result_model:
            t_result = TriageResult(
                risk_level=result_model.risk_level,
                score_breakdown=result_model.score_breakdown,
                recommended_specialist=result_model.recommended_specialist,
                emergency_flag=result_model.emergency_flag
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
