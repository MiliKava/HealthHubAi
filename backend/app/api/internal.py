from fastapi import APIRouter, Depends, HTTPException, Security, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.retrieval import RetrievalRequest, RetrievedChunk
from app.services.retrieval import retrieve_chunks
from typing import List
import os

router = APIRouter()

INTERNAL_API_KEY = os.environ.get("INTERNAL_API_KEY", "default-internal-key-for-dev")

def verify_internal_api_key(x_internal_key: str = Header(None)):
    if x_internal_key != INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid internal API key")
    return x_internal_key

@router.post("/retrieve", response_model=List[RetrievedChunk])
def retrieve(request: RetrievalRequest, db: Session = Depends(get_db), _: str = Depends(verify_internal_api_key)):
    chunks = retrieve_chunks(
        db=db, 
        query=request.query, 
        top_k=request.top_k, 
        specialty_filter=request.specialty_filter
    )
    return chunks
