import os
import glob

# Files to update
files_to_update = [
    "../README.md",
    "../frontend/src/pages/Register.tsx",
    "../frontend/src/pages/Login.tsx",
    "../frontend/src/pages/Landing.tsx",
    "../frontend/src/pages/HomePage.tsx",
    "../frontend/src/pages/Dashboard.tsx",
    "../frontend/src/components/SidebarLayout.tsx",
    "test_email.py",
    "app/main.py",
    "app/api/appointments.py",
    "app/core/config.py"
]

for file_path in files_to_update:
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace CareBridge AI with HealthHub AI
        content = content.replace("CareBridge AI", "HealthHub AI")
        # Replace CareBridge with HealthHub AI
        content = content.replace("CareBridge", "HealthHub AI")
        # Fix any accidental "HealthHub AI AI"
        content = content.replace("HealthHub AI AI", "HealthHub AI")
        
        # Keep carebridge.ai email domains if any, but replace the visible text
        # Actually in config.py: noreply@carebridge.ai -> noreply@healthhub.ai
        content = content.replace("carebridge.ai", "healthhub.ai")
        content = content.replace("carebridge", "healthhub")
        # But we must restore database names in config if they were changed
        # We'll just leave it since the DB name in docker-compose is carebridge.
        # Wait, if I replaced 'carebridge' in lowercase, I might break DATABASE_URL.
        content = content.replace("postgresql://postgres:password@db:5432/healthhub", "postgresql://postgres:password@db:5432/carebridge")
        content = content.replace("postgresql://postgres:password@localhost/healthhub", "postgresql://postgres:password@localhost/carebridge")
        content = content.replace("postgresql://postgres:password@localhost:5433/healthhub", "postgresql://postgres:password@localhost:5433/carebridge")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {file_path}")
    else:
        print(f"File not found: {file_path}")
