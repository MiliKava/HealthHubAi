import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status
from uuid import uuid4, UUID

from app.main import app
from app.db.database import get_db
from app.db.models import User, UserRole, Appointment
from app.api.deps import get_current_user

# Setup mock database session
mock_db = MagicMock()

def get_mock_db():
    yield mock_db

@pytest.fixture(autouse=True)
def override_db():
    app.dependency_overrides[get_db] = get_mock_db
    yield
    app.dependency_overrides.clear()

@pytest.fixture
def client():
    return TestClient(app)

# 1. Test Endpoints
def test_create_appointment(client):
    mock_patient = User(id=uuid4(), email="patient@test.com", role=UserRole.PATIENT, full_name="Patient Jane")
    app.dependency_overrides[get_current_user] = lambda: mock_patient
    
    mock_doctor = User(id=uuid4(), email="doctor@test.com", role=UserRole.DOCTOR, full_name="Dr. Smith")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_doctor
    
    response = client.post("/api/appointments", json={
        "doctor_id": str(mock_doctor.id),
        "confirmed_slot": "2026-06-20T12:00:00"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "pending"

def test_confirm_appointment_success(client):
    mock_doctor = User(id=uuid4(), email="doctor@test.com", role=UserRole.DOCTOR, full_name="Dr. Smith")
    app.dependency_overrides[get_current_user] = lambda: mock_doctor
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=uuid4(),
        doctor_id=mock_doctor.id,
        status="pending",
        confirmed_slot=datetime.utcnow()
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.post(f"/api/appointments/{appointment_id}/confirm")
    
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"

def test_join_window_within_window(client):
    mock_patient = User(id=uuid4(), email="patient@test.com", role=UserRole.PATIENT, full_name="Patient Jane")
    app.dependency_overrides[get_current_user] = lambda: mock_patient
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=mock_patient.id,
        doctor_id=uuid4(),
        status="confirmed",
        confirmed_slot=datetime.utcnow()
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.get(f"/api/appointments/{appointment_id}/join-window")
    
    assert response.status_code == 200
    assert response.json()["status"] == "allowed"

def test_join_window_outside_window(client):
    mock_patient = User(id=uuid4(), email="patient@test.com", role=UserRole.PATIENT, full_name="Patient Jane")
    app.dependency_overrides[get_current_user] = lambda: mock_patient
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=mock_patient.id,
        doctor_id=uuid4(),
        status="confirmed",
        confirmed_slot=datetime.utcnow() - timedelta(minutes=30)
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.get(f"/api/appointments/{appointment_id}/join-window")
    
    assert response.status_code == 403
    assert "blocked" in response.json()["detail"]

def test_reject_appointment(client):
    mock_doctor = User(id=uuid4(), email="doctor@test.com", role=UserRole.DOCTOR, full_name="Dr. Smith")
    app.dependency_overrides[get_current_user] = lambda: mock_doctor
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=uuid4(),
        doctor_id=mock_doctor.id,
        status="pending",
        confirmed_slot=datetime.utcnow()
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.post(f"/api/appointments/{appointment_id}/reject")
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"

def test_propose_appointment_time(client):
    mock_doctor = User(id=uuid4(), email="doctor@test.com", role=UserRole.DOCTOR, full_name="Dr. Smith")
    app.dependency_overrides[get_current_user] = lambda: mock_doctor
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=uuid4(),
        doctor_id=mock_doctor.id,
        status="pending",
        confirmed_slot=datetime.utcnow()
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.post(f"/api/appointments/{appointment_id}/propose", json={
        "proposed_slot": "2026-06-25T14:00:00"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "proposed"

def test_accept_proposed_time(client):
    mock_patient = User(id=uuid4(), email="patient@test.com", role=UserRole.PATIENT, full_name="Patient Jane")
    app.dependency_overrides[get_current_user] = lambda: mock_patient
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=mock_patient.id,
        doctor_id=uuid4(),
        status="proposed",
        confirmed_slot=datetime.utcnow()
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.post(f"/api/appointments/{appointment_id}/accept-proposal")
    assert response.status_code == 200
    assert response.json()["status"] == "confirmed"

def test_reject_proposed_time(client):
    mock_patient = User(id=uuid4(), email="patient@test.com", role=UserRole.PATIENT, full_name="Patient Jane")
    app.dependency_overrides[get_current_user] = lambda: mock_patient
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=mock_patient.id,
        doctor_id=uuid4(),
        status="proposed",
        confirmed_slot=datetime.utcnow()
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.post(f"/api/appointments/{appointment_id}/reject-proposal")
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"

def test_reschedule_appointment(client):
    mock_patient = User(id=uuid4(), email="patient@test.com", role=UserRole.PATIENT, full_name="Patient Jane")
    app.dependency_overrides[get_current_user] = lambda: mock_patient
    
    appointment_id = uuid4()
    mock_appointment = Appointment(
        id=appointment_id,
        patient_id=mock_patient.id,
        doctor_id=uuid4(),
        status="rejected",
        confirmed_slot=datetime.utcnow()
    )
    mock_db.query.return_value.filter.return_value.first.return_value = mock_appointment
    
    response = client.post(f"/api/appointments/{appointment_id}/reschedule", json={
        "confirmed_slot": "2026-06-26T15:30:00"
    })
    assert response.status_code == 200
    assert response.json()["status"] == "pending"

