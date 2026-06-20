from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class CVKeywords(BaseModel):
    specialty: str = Field(default="")
    qualifications: List[str] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    years_experience: int = Field(default=0)
    summary: str = Field(default="")

class DoctorProfileBase(BaseModel):
    specialty: str
    license_number: str
    bio: Optional[str] = None
    years_experience: int
    cv_keywords: Optional[CVKeywords] = None

class DoctorProfileUpdate(BaseModel):
    specialty: Optional[str] = None
    license_number: Optional[str] = None
    bio: Optional[str] = None
    years_experience: Optional[int] = None
    cv_keywords: Optional[CVKeywords] = None

from uuid import UUID

class DoctorProfile(DoctorProfileBase):
    id: UUID
    user_id: UUID
    approval_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DoctorPublic(BaseModel):
    id: UUID
    full_name: str
    specialty: str
    bio: Optional[str] = None
    years_experience: int
    cv_summary: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
