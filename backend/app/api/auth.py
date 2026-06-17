from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import uuid
import os
import shutil

from app.core.config import settings, ROOT_DIR
from app.core.security import get_password_hash, verify_password, create_access_token
from app.db.database import get_db
from app.db.models import User, UserRole, DoctorProfile, RefreshToken
from app.schemas.user import PatientCreate, UserResponse, UserDoctorResponse
from app.api.deps import get_current_user

router = APIRouter()

def set_tokens_in_cookies(response: Response, access_token: str, refresh_token: str):
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False, # Set to True in prod with HTTPS
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        samesite="lax",
        secure=False,
    )

@router.post("/register/patient", response_model=UserResponse)
def register_patient(patient_in: PatientCreate, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == patient_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    user = User(
        email=patient_in.email,
        password_hash=get_password_hash(patient_in.password),
        full_name=patient_in.full_name,
        role=UserRole.PATIENT,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate tokens
    access_token = create_access_token(user.id, user.role, user.email)
    refresh_token_str = str(uuid.uuid4())
    refresh_token = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_token)
    db.commit()

    set_tokens_in_cookies(response, access_token, refresh_token_str)
    return user

@router.post("/register/doctor")
def register_doctor(
    response: Response,
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    specialty: str = Form(...),
    license_number: str = Form(...),
    bio: str = Form(None),
    years_experience: int = Form(...),
    cv_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system",
        )
    
    # Process CV placeholder
    # Relax content-type check, just check extension if content-type is weird
    if cv_file.content_type != "application/pdf" and not cv_file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="CV must be a PDF file")

    # Save the file to assets folder in main root directory
    assets_dir = os.path.join(ROOT_DIR, "assets")
    os.makedirs(assets_dir, exist_ok=True)
    
    # Generate a safe filename to avoid collisions
    safe_filename = f"{uuid.uuid4()}_{cv_file.filename}"
    file_path = os.path.join(assets_dir, safe_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cv_file.file, buffer)

    user = User(
        email=email,
        password_hash=get_password_hash(password),
        full_name=full_name,
        role=UserRole.DOCTOR,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Extract text using PyMuPDF (fitz)
    try:
        import fitz # PyMuPDF
        with open(file_path, "rb") as f:
            doc = fitz.open(stream=f.read(), filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text()
    except Exception as e:
        print(f"Error parsing PDF during registration: {e}")
        text = ""

    from app.api.doctor import extract_keywords_from_text
    import asyncio
    
    cv_keywords_data = {}
    if text.strip():
        # Because we're in a sync route, we need to run the async function
        try:
            extracted = asyncio.run(extract_keywords_from_text(text))
            cv_keywords_data = extracted.model_dump()
        except Exception as e:
            print(f"Error during async LLM call: {e}")
            cv_keywords_data = {}

    doctor_profile = DoctorProfile(
        user_id=user.id,
        specialty=specialty,
        license_number=license_number,
        bio=bio,
        years_experience=years_experience,
        cv_keywords=cv_keywords_data
    )
    db.add(doctor_profile)
    db.commit()

    # Generate tokens
    access_token = create_access_token(user.id, user.role, user.email)
    refresh_token_str = str(uuid.uuid4())
    refresh_token_db = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_token_db)
    db.commit()

    set_tokens_in_cookies(response, access_token, refresh_token_str)
    
    return {
        "message": "Your application is under review.",
        "user_id": user.id
    }

from fastapi.security import OAuth2PasswordRequestForm

@router.post("/login")
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(user.id, user.role, user.email)
    refresh_token_str = str(uuid.uuid4())
    refresh_token_db = RefreshToken(
        user_id=user.id,
        token=refresh_token_str,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(refresh_token_db)
    db.commit()

    set_tokens_in_cookies(response, access_token, refresh_token_str)
    
    return {"message": "Successfully logged in"}

from fastapi import Cookie

@router.post("/refresh")
def refresh_token(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
        
    db_token = db.query(RefreshToken).filter(RefreshToken.token == refresh_token).first()
    if not db_token or db_token.expires_at < datetime.utcnow():
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user = db_token.user
    access_token = create_access_token(user.id, user.role, user.email)
    
    # We can also rotate the refresh token here if we want, but simple issuance of new access is fine.
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    return {"message": "Token refreshed"}

@router.post("/logout")
def logout(
    response: Response,
    refresh_token: str = Cookie(None),
    db: Session = Depends(get_db)
):
    if refresh_token:
        db.query(RefreshToken).filter(RefreshToken.token == refresh_token).delete()
        db.commit()
        
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserDoctorResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
