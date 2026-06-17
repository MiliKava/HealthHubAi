from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime

class PatientProfileBase(BaseModel):
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    chronic_conditions: Optional[str] = None
    pregnancy_status: Optional[str] = None

class PatientProfileUpdate(PatientProfileBase):
    pass

class PatientProfileResponse(PatientProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
