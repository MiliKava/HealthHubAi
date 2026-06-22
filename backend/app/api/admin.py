from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
from typing import List
from app.db.database import get_db
from app.db.models import User, UserRole, DoctorProfile, ApprovalStatus
from app.api.deps import require_role
from app.schemas.admin import AdminUserDoctorResponse
from datetime import datetime

router = APIRouter()

@router.get("/doctors/pending", response_model=List[AdminUserDoctorResponse])
def get_pending_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users = db.query(User).join(User.doctor_profile).filter(
        User.role == UserRole.DOCTOR,
        DoctorProfile.approval_status == ApprovalStatus.PENDING
    ).options(joinedload(User.doctor_profile)).all()
    return users

@router.get("/doctors", response_model=List[AdminUserDoctorResponse])
def get_all_doctors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    users = db.query(User).join(User.doctor_profile).filter(
        User.role == UserRole.DOCTOR
    ).options(joinedload(User.doctor_profile)).all()
    return users

@router.post("/doctors/{user_id}/approve")
def approve_doctor(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.DOCTOR).first()
    if not user or not user.doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    user.doctor_profile.approval_status = ApprovalStatus.APPROVED
    user.doctor_profile.approved_by = current_user.id
    user.doctor_profile.approved_at = datetime.utcnow()
    
    db.commit()
    
    # TODO: Send email
    return {"message": "Doctor approved successfully"}

@router.post("/doctors/{user_id}/reject")
def reject_doctor(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.DOCTOR).first()
    if not user or not user.doctor_profile:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    user.doctor_profile.approval_status = ApprovalStatus.REJECTED
    user.is_active = False
    
    db.commit()
    
    # TODO: Send email
    return {"message": "Doctor rejected and deactivated successfully"}

@router.post("/doctors/{user_id}/deactivate")
def deactivate_doctor(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.DOCTOR).first()
    if not user:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    user.is_active = False
    db.commit()
    
    return {"message": "Doctor deactivated successfully"}

@router.post("/doctors/{user_id}/activate")
def activate_doctor(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id, User.role == UserRole.DOCTOR).first()
    if not user:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    user.is_active = True
    if user.doctor_profile and user.doctor_profile.approval_status == ApprovalStatus.REJECTED:
        user.doctor_profile.approval_status = ApprovalStatus.PENDING
        
    db.commit()
    
    return {"message": "Doctor activated successfully"}
