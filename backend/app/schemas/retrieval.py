from pydantic import BaseModel
from typing import List, Optional

class RetrievalRequest(BaseModel):
    query: str
    top_k: int = 5
    specialty_filter: Optional[str] = None

class RetrievedChunk(BaseModel):
    content: str
    source: str
    title: Optional[str] = None
    url: Optional[str] = None
    similarity_score: float
