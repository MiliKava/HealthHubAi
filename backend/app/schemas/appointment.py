from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, Dict, Any
from app.db.models import AppointmentRequestStatus

class AppointmentRequestCreate(BaseModel):
    doctor_id: UUID
    triage_session_id: UUID

class AppointmentRequestResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    triage_session_id: UUID
    status: AppointmentRequestStatus
    proposed_slot: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TriageSummary(BaseModel):
    risk_level: str
    symptoms: str # string representation or list
    specialist_recommendation: str

class AppointmentRequestWithSummary(AppointmentRequestResponse):
    triage_summary: Optional[Dict[str, Any]] = None
    doctor_details: Optional[Dict[str, Any]] = None
    patient_details: Optional[Dict[str, Any]] = None

class AppointmentRequestAccept(BaseModel):
    proposed_slot: datetime
