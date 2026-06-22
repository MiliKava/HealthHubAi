from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime, timezone, timedelta
from typing import List

from app.db.database import get_db
from app.db.models import User, UserRole, Appointment
from app.api.deps import get_current_user, require_role
from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentPropose, AppointmentReschedule

router = APIRouter()

# Connection Manager for WebRTC Signaling WebSockets
class ConnectionManager:
    def __init__(self):
        # Maps appointment_id (str) to list of active WebSockets
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, appointment_id: str) -> bool:
        await websocket.accept()
        if appointment_id not in self.active_connections:
            self.active_connections[appointment_id] = []
        
        # Max 2 participants in a call
        if len(self.active_connections[appointment_id]) >= 2:
            await websocket.send_json({"type": "error", "message": "Call room is full."})
            await websocket.close()
            return False
            
        self.active_connections[appointment_id].append(websocket)
        
        # Notify existing participant that peer joined
        if len(self.active_connections[appointment_id]) > 1:
            await self.broadcast(
                {"type": "peer-joined"},
                appointment_id,
                exclude_websocket=websocket
            )
        return True

    def disconnect(self, websocket: WebSocket, appointment_id: str):
        if appointment_id in self.active_connections:
            if websocket in self.active_connections[appointment_id]:
                self.active_connections[appointment_id].remove(websocket)
            if not self.active_connections[appointment_id]:
                del self.active_connections[appointment_id]

    async def broadcast(self, message: dict, appointment_id: str, exclude_websocket: WebSocket = None):
        if appointment_id in self.active_connections:
            for connection in self.active_connections[appointment_id]:
                if connection != exclude_websocket:
                    try:
                        await connection.send_json(message)
                    except Exception:
                        pass

manager = ConnectionManager()

@router.post("", response_model=AppointmentResponse)
def create_appointment(
    appointment_in: AppointmentCreate,
    current_user: User = Depends(require_role([UserRole.PATIENT])),
    db: Session = Depends(get_db)
):
    # Verify doctor exists and has role doctor
    doctor = db.query(User).filter(User.id == appointment_in.doctor_id, User.role == UserRole.DOCTOR).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
        
    import uuid
    appointment = Appointment(
        id=uuid.uuid4(),
        patient_id=current_user.id,
        doctor_id=appointment_in.doctor_id,
        status="pending",
        confirmed_slot=appointment_in.confirmed_slot
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment

def cleanup_expired_appointments(db: Session):
    try:
        now = datetime.utcnow()
        # Only delete unconfirmed (pending/proposed) appointments where confirmed_slot is older than 15 minutes
        db.query(Appointment).filter(
            Appointment.status.in_(["pending", "proposed"]),
            Appointment.confirmed_slot < now - timedelta(minutes=15)
        ).delete(synchronize_session=False)
        db.commit()
    except Exception as e:
        db.rollback()

@router.get("", response_model=List[AppointmentResponse])
def list_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleanup_expired_appointments(db)
    if current_user.role == UserRole.PATIENT:
        return db.query(Appointment).filter(Appointment.patient_id == current_user.id).all()
    elif current_user.role == UserRole.DOCTOR:
        return db.query(Appointment).filter(Appointment.doctor_id == current_user.id).all()
    elif current_user.role == UserRole.ADMIN:
        return db.query(Appointment).all()
    return []

@router.get("/{id}", response_model=AppointmentResponse)
def get_appointment(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cleanup_expired_appointments(db)
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role != UserRole.ADMIN and current_user.id not in [appointment.patient_id, appointment.doctor_id]:
        raise HTTPException(status_code=403, detail="Not authorized to view this appointment")
        
    return appointment

@router.post("/{id}/confirm", response_model=AppointmentResponse)
async def confirm_appointment(
    id: UUID,
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == UserRole.DOCTOR and appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to confirm this appointment")
        
    appointment.status = "confirmed"
    db.commit()
    db.refresh(appointment)
    return appointment

@router.post("/{id}/reject", response_model=AppointmentResponse)
def reject_appointment(
    id: UUID,
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == UserRole.DOCTOR and appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this appointment")
        
    appointment.status = "rejected"
    db.commit()
    db.refresh(appointment)
    return appointment

@router.post("/{id}/propose", response_model=AppointmentResponse)
def propose_appointment_time(
    id: UUID,
    propose_in: AppointmentPropose,
    current_user: User = Depends(require_role([UserRole.DOCTOR, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == UserRole.DOCTOR and appointment.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to propose time for this appointment")
        
    appointment.confirmed_slot = propose_in.proposed_slot
    appointment.status = "proposed"
    db.commit()
    db.refresh(appointment)
    return appointment

@router.post("/{id}/accept-proposal", response_model=AppointmentResponse)
def accept_proposed_time(
    id: UUID,
    current_user: User = Depends(require_role([UserRole.PATIENT, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == UserRole.PATIENT and appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to accept proposal for this appointment")
        
    if appointment.status != "proposed":
        raise HTTPException(status_code=400, detail="Appointment slot is not in proposed state")
        
    appointment.status = "confirmed"
    db.commit()
    db.refresh(appointment)
    return appointment

@router.post("/{id}/reject-proposal", response_model=AppointmentResponse)
def reject_proposed_time(
    id: UUID,
    current_user: User = Depends(require_role([UserRole.PATIENT, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == UserRole.PATIENT and appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reject proposal for this appointment")
        
    if appointment.status != "proposed":
        raise HTTPException(status_code=400, detail="Appointment slot is not in proposed state")
        
    appointment.status = "rejected"
    db.commit()
    db.refresh(appointment)
    return appointment

@router.post("/{id}/reschedule", response_model=AppointmentResponse)
def reschedule_appointment(
    id: UUID,
    reschedule_in: AppointmentReschedule,
    current_user: User = Depends(require_role([UserRole.PATIENT, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    if current_user.role == UserRole.PATIENT and appointment.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to reschedule this appointment")
        
    if appointment.status != "rejected":
        raise HTTPException(status_code=400, detail="Only rejected appointments can be rescheduled")
        
    appointment.confirmed_slot = reschedule_in.confirmed_slot
    appointment.status = "pending"
    db.commit()
    db.refresh(appointment)
    return appointment

@router.get("/{id}/join-window")
def check_join_window(
    id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
        
    # 1. Validate participant
    if current_user.id not in [appointment.patient_id, appointment.doctor_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a participant of this appointment."
        )
        
    # 2. Validate status is confirmed
    if appointment.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join a non-confirmed appointment."
        )
        
    # 3. Validate ±15-minute window
    now = datetime.utcnow()
    diff = abs(now - appointment.confirmed_slot)
    if diff > timedelta(minutes=15):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Joining is blocked outside the ±15-minute window."
        )
        
    return {"status": "allowed", "appointment_id": str(appointment.id)}

@router.websocket("/{id}/ws")
async def websocket_endpoint(websocket: WebSocket, id: UUID, db: Session = Depends(get_db)):
    appointment_id_str = str(id)
    
    # 1. Fetch appointment from DB
    appointment = db.query(Appointment).filter(Appointment.id == id).first()
    if not appointment:
        await websocket.accept()
        await websocket.send_json({"type": "error", "message": "Appointment not found."})
        await websocket.close()
        return
        
    connected = await manager.connect(websocket, appointment_id_str)
    if not connected:
        return

    try:
        while True:
            # Relay JSON message exactly to the other participant
            data = await websocket.receive_json()
            await manager.broadcast(data, appointment_id_str, exclude_websocket=websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, appointment_id_str)
        # Notify the remaining peer that their partner left
        await manager.broadcast(
            {"type": "peer-left"},
            appointment_id_str
        )
    except Exception:
        manager.disconnect(websocket, appointment_id_str)
