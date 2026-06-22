import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from app.db.database import Base
import enum
import sqlalchemy
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy import Index
class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.PATIENT)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, foreign_keys="DoctorProfile.user_id")
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False)
    refresh_tokens = relationship("RefreshToken", back_populates="user")

class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), unique=True, nullable=False)
    specialty = Column(String, nullable=False)
    license_number = Column(String, nullable=False)
    bio = Column(String, nullable=True)
    years_experience = Column(sqlalchemy.Integer, nullable=False)
    cv_keywords = Column(sqlalchemy.JSON, nullable=True, default={})
    approval_status = Column(Enum(ApprovalStatus), nullable=False, default=ApprovalStatus.PENDING)
    approved_by = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="doctor_profile", foreign_keys="[DoctorProfile.user_id]")
    approved_by_user = relationship("User", foreign_keys="[DoctorProfile.approved_by]")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), unique=True, nullable=False)
    date_of_birth = Column(sqlalchemy.Date, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    chronic_conditions = Column(String, nullable=True)
    pregnancy_status = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="patient_profile")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")

class KBDocument(Base):
    __tablename__ = "kb_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    source = Column(String, nullable=False)
    title = Column(String, nullable=True)
    url = Column(String, nullable=True)
    content_chunk = Column(String, nullable=False)
    embedding = Column(Vector(384))
    chunk_metadata = Column(sqlalchemy.JSON, nullable=True, default={})
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index('ix_kb_documents_embedding_ivfflat', 'embedding', postgresql_using='ivfflat', postgresql_with={'lists': 100}, postgresql_ops={'embedding': 'vector_cosine_ops'}),
    )

class TriageSession(Base):
    __tablename__ = "triage_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), nullable=True)
    current_state = Column(String, nullable=False, default="initial_complaint")
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    messages = relationship("TriageMessage", back_populates="session", order_by="TriageMessage.created_at")
    extracted_symptoms = relationship("ExtractedSymptomModel", back_populates="session")
    result = relationship("TriageResultModel", back_populates="session", uselist=False)

class TriageMessage(Base):
    __tablename__ = "triage_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("triage_sessions.id"), nullable=False)
    sender = Column(String, nullable=False) # "user" or "assistant"
    content = Column(String, nullable=False)
    step_type = Column(String, nullable=False) 
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("TriageSession", back_populates="messages")

class ExtractedSymptomModel(Base):
    __tablename__ = "extracted_symptoms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("triage_sessions.id"), nullable=False)
    symptom_name = Column(String, nullable=False)
    status = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("TriageSession", back_populates="extracted_symptoms")

class TriageResultModel(Base):
    __tablename__ = "triage_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("triage_sessions.id"), nullable=False, unique=True)
    risk_level = Column(String, nullable=False)
    score_breakdown = Column(sqlalchemy.JSON, nullable=True)
    recommended_specialist = Column(String, nullable=False)
    emergency_flag = Column(Boolean, default=False)
    response_text = Column(String, nullable=True)
    citations = Column(sqlalchemy.JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("TriageSession", back_populates="result")

class AppointmentRequestStatus(str, enum.Enum):
    REQUESTED = "requested"
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"

class AppointmentRequest(Base):
    __tablename__ = "appointment_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    patient_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), nullable=False)
    triage_session_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("triage_sessions.id"), nullable=False)
    status = Column(Enum(AppointmentRequestStatus), nullable=False, default=AppointmentRequestStatus.REQUESTED)
    proposed_slot = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    triage_session = relationship("TriageSession")

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    request_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("appointment_requests.id"), nullable=False, unique=True)
    patient_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), nullable=False)
    doctor_id = Column(UUID(as_uuid=True), sqlalchemy.ForeignKey("users.id"), nullable=False)
    scheduled_time = Column(DateTime, nullable=False)
    status = Column(Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.SCHEDULED)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    request = relationship("AppointmentRequest")
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
