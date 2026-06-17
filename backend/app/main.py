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

from sqlalchemy import text

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    # Test DB connection
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
