from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from app.db.models import KBDocument
from app.schemas.retrieval import RetrievedChunk
from typing import List, Optional
import os
import logging

logger = logging.getLogger(__name__)

class EmbeddingModel:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            model_name = os.environ.get("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
            logger.info(f"Loading embedding model: {model_name}")
            cls._instance = SentenceTransformer(model_name)
            logger.info("Embedding model loaded successfully.")
        return cls._instance

def retrieve_chunks(db: Session, query: str, top_k: int = 5, specialty_filter: Optional[str] = None) -> List[RetrievedChunk]:
    model = EmbeddingModel.get_instance()
    query_embedding = model.encode(query).tolist()

    # pgvector cosine_distance returns (1 - cosine_similarity).
    # order by smallest distance -> largest similarity
    db_query = db.query(KBDocument, KBDocument.embedding.cosine_distance(query_embedding).label("distance"))
    
    if specialty_filter:
        db_query = db_query.filter(KBDocument.chunk_metadata["specialty"].as_string() == specialty_filter)

    results = db_query.order_by(KBDocument.embedding.cosine_distance(query_embedding)) \
                      .limit(top_k) \
                      .all()

    retrieved_chunks = []
    for doc, distance in results:
        # Avoid any unexpected negative distances or above 2 depending on how pgvector behaves
        similarity_score = 1.0 - float(distance)
        retrieved_chunks.append(RetrievedChunk(
            content=doc.content_chunk,
            source=doc.source,
            title=doc.title,
            url=doc.url,
            similarity_score=similarity_score
        ))

    return retrieved_chunks
