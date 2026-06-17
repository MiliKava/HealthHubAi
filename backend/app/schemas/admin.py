from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.db.models import ApprovalStatus
from app.schemas.user import UserResponse
from app.schemas.doctor import CVKeywords

class AdminDoctorProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    specialty: str
    license_number: str
    bio: Optional[str]
    years_experience: int
    approval_status: ApprovalStatus
    cv_keywords: Optional[dict] = None # Assuming it's JSON, can be arbitrary dict or CVKeywords model. Let's use dict for flexibility.
    approved_by: Optional[UUID] = None
    approved_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AdminUserDoctorResponse(UserResponse):
    doctor_profile: Optional[AdminDoctorProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)
