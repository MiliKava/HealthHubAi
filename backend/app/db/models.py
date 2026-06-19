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

    user = relationship("User", back_populates="doctor_profile", foreign_keys=[user_id])
    approved_by_user = relationship("User", foreign_keys=[approved_by])

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
