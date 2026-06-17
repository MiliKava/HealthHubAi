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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.auth import router as auth_router
from app.api.patient import router as patient_router
from app.api.deps import get_current_user, require_role, require_approved_doctor
from app.db.models import User, UserRole

app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(patient_router, prefix="/api/patients", tags=["patients"])

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
