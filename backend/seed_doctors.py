import sys
import os
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.core.config import settings
from app.db.models import User, UserRole, DoctorProfile, ApprovalStatus
from app.core.security import get_password_hash

engine = create_engine(settings.DATABASE_URL)
with Session(engine) as db:
    # Check if doctors exist
    doctor = db.query(User).filter(User.role == UserRole.DOCTOR).first()
    if not doctor:
        print("Creating doctors...")
        docs = [
            {
                "email": "dr.smith@example.com",
                "full_name": "Dr. Sarah Smith",
                "specialty": "Cardiologist",
                "bio": "Experienced cardiologist specializing in preventive heart care.",
                "years_experience": 15
            },
            {
                "email": "dr.jones@example.com",
                "full_name": "Dr. Mark Jones",
                "specialty": "Neurologist",
                "bio": "Neurologist with a focus on cognitive disorders and migraines.",
                "years_experience": 10
            },
            {
                "email": "dr.lee@example.com",
                "full_name": "Dr. Emily Lee",
                "specialty": "General Practitioner",
                "bio": "Family doctor dedicated to holistic and continuous care.",
                "years_experience": 8
            }
        ]
        
        for d in docs:
            user = User(
                email=d["email"],
                full_name=d["full_name"],
                hashed_password=get_password_hash("password123"),
                role=UserRole.DOCTOR
            )
            db.add(user)
            db.flush()
            
            profile = DoctorProfile(
                user_id=user.id,
                specialty=d["specialty"],
                license_number=f"MD-{user.id}",
                years_experience=d["years_experience"],
                bio=d["bio"],
                cv_s3_url="fake_url.pdf",
                approval_status=ApprovalStatus.APPROVED
            )
            db.add(profile)
        
        db.commit()
        print("Doctors created successfully.")
    else:
        print("Doctors already exist.")
