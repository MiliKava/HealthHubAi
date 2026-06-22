from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime, timezone
from typing import Optional
from app.schemas.user import UserResponse, UserDoctorResponse

class AppointmentBase(BaseModel):
    doctor_id: UUID
    confirmed_slot: datetime

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    confirmed_slot: Optional[datetime] = None

class AppointmentPropose(BaseModel):
    proposed_slot: datetime

    @field_validator('proposed_slot', mode='before')
    @classmethod
    def make_tz_aware(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class AppointmentReschedule(BaseModel):
    confirmed_slot: datetime

    @field_validator('confirmed_slot', mode='before')
    @classmethod
    def make_tz_aware(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

class AppointmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    status: str
    confirmed_slot: datetime
    call_room_id: Optional[str] = None
    call_provider: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    patient: Optional[UserResponse] = None
    doctor: Optional[UserDoctorResponse] = None

    @field_validator('confirmed_slot', 'created_at', 'updated_at', mode='before')
    @classmethod
    def make_tz_aware(cls, v):
        if isinstance(v, datetime) and v.tzinfo is None:
            return v.replace(tzinfo=timezone.utc)
        return v

    class Config:
        from_attributes = True



