from pydantic import BaseModel, Field
from typing import Dict, Literal, Any, List, Optional
import uuid
from datetime import datetime

class TriageResult(BaseModel):
    risk_level: Literal["low", "medium", "high"] = Field(description="Calculated risk level")
    score_breakdown: Dict[str, Any] = Field(description="Breakdown of factors contributing to the score")
    recommended_specialist: str = Field(description="The recommended specialist based on symptom categories")
    emergency_flag: bool = Field(default=False, description="Whether this constitutes an emergency (always False here, caught in Phase 9)")
    response_text: Optional[str] = Field(default=None, description="The LLM generated triage response")
    citations: Optional[List[Dict[str, str]]] = Field(default=None, description="List of citations used in the response")

class TriageMessageBase(BaseModel):
    content: str

class TriageMessageCreate(TriageMessageBase):
    pass

class TriageMessageResponse(TriageMessageBase):
    id: uuid.UUID
    session_id: uuid.UUID
    sender: Literal["user", "assistant"]
    step_type: str
    created_at: datetime

    class Config:
        from_attributes = True

class TriageSessionResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    current_state: str
    is_completed: bool
    created_at: datetime
    updated_at: datetime
    messages: List[TriageMessageResponse] = []
    result: Optional[TriageResult] = None

    class Config:
        from_attributes = True

class IntakeResponse(BaseModel):
    session_id: uuid.UUID
    next_question: str
    is_completed: bool
    result: Optional[TriageResult] = None
