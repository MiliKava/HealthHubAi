import os
import sys

# Ensure we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.db.models import User, UserRole
from app.core.security import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@gmail.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin_user = User(
                email=admin_email,
                password_hash=get_password_hash("admin123"),
                full_name="System Administrator",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created successfully.")
        else:
            print("Admin user already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
