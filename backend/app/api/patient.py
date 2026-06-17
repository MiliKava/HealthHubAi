from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.database import get_db
from app.db.models import User, UserRole, PatientProfile
from app.schemas.patient import PatientProfileResponse, PatientProfileUpdate
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/me/profile", response_model=PatientProfileResponse | dict)
def get_patient_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this endpoint"
        )
    
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        return {}
    return profile

@router.put("/me/profile", response_model=PatientProfileResponse)
def update_patient_profile(
    profile_in: PatientProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this endpoint"
        )
    
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    
    if profile:
        # Update
        for field, value in profile_in.model_dump(exclude_unset=True).items():
            setattr(profile, field, value)
    else:
        # Create
        profile = PatientProfile(
            user_id=current_user.id,
            **profile_in.model_dump(exclude_unset=True)
        )
        db.add(profile)
        
    try:
        db.commit()
        db.refresh(profile)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to update profile"
        )
        
    return profile
