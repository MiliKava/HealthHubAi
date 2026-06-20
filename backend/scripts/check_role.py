import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.db.models import User, UserRole

def get_role():
    db = SessionLocal()
    try:
        doctor = db.query(User).filter(User.email == "juliya@gmail.com").first()
        if doctor:
            print(f"Role object: {doctor.role}")
            print(f"Role value: {doctor.role.value}")
            print(f"Role type: {type(doctor.role)}")
            print(f"Role string: {str(doctor.role)}")
    finally:
        db.close()

if __name__ == "__main__":
    get_role()
