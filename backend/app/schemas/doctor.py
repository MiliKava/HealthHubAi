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

class DoctorProfile(DoctorProfileBase):
    id: str
    user_id: str
    approval_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
