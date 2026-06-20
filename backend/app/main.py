from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import get_db, engine, Base

# Don't create tables here, use alembic, but we can do this for quick tests.
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="CareBridge AI Backend")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.auth import router as auth_router
from app.api.patient import router as patient_router
from app.api.doctor import router as doctor_router
from app.api.admin import router as admin_router
from app.api.internal import router as internal_router
from app.api.triage import router as triage_router
from app.api.appointments import router as appointments_router
from app.api.deps import get_current_user, require_role, require_approved_doctor
from app.db.models import User, UserRole

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(patient_router, prefix="/api/patients", tags=["patients"])
app.include_router(doctor_router, prefix="/api/doctors", tags=["doctors"])
app.include_router(admin_router, prefix="/api/admin", tags=["admin"])
app.include_router(triage_router, prefix="/api/triage", tags=["triage"])
app.include_router(appointments_router, prefix="/api/appointments", tags=["appointments"])
app.include_router(internal_router, prefix="/internal", tags=["internal"])

@app.get("/api/test-patient")
def test_patient(current_user: User = Depends(require_role([UserRole.PATIENT]))):
    return {"message": "Hello Patient", "user_id": current_user.id, "Email": current_user.email}

@app.get("/api/test-doctor")
def test_doctor(current_user: User = Depends(require_approved_doctor)):
    return {"message": "Hello Approved Doctor", "user_id": current_user.id}

@app.get("/api/test-admin")
def test_admin(current_user: User = Depends(require_role([UserRole.ADMIN]))):
    return {"message": "Hello Admin", "user_id": current_user.id}

from sqlalchemy import text

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Test DB connection
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
