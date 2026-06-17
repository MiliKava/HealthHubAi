from pydantic import BaseModel, EmailStr
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.db.models import UserRole, ApprovalStatus

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class PatientCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class DoctorProfileResponse(BaseModel):
    id: UUID
    specialty: str
    license_number: str
    bio: Optional[str]
    years_experience: int
    approval_status: ApprovalStatus

    class Config:
        from_attributes = True

class UserDoctorResponse(UserResponse):
    doctor_profile: Optional[DoctorProfileResponse] = None

    class Config:
        from_attributes = True
