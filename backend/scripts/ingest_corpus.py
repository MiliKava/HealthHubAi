import os
import sys
from typing import List
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from datasets import load_dataset
from sqlalchemy.orm import Session
from sqlalchemy import text

# Add the backend directory to sys.path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, engine
from app.db.models import KBDocument, Base

# Configuration
CHUNK_SIZE_WORDS = 350
OVERLAP_WORDS = 50
TARGET_ROWS = 5000  # Target number of chunks to generate
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"

def clean_text(html_text: str) -> str:
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "lxml")
    text = soup.get_text(separator=" ")
    # Normalize whitespace
    text = " ".join(text.split())
    return text

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE_WORDS, overlap: int = OVERLAP_WORDS) -> List[str]:
    words = text.split()
    chunks = []
    if not words:
        return chunks
    
    i = 0
    while i < len(words):
        chunk_words = words[i:i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += chunk_size - overlap
    return chunks

def init_db():
    print("Ensuring pgvector extension is enabled...")
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    print("Creating tables if not exist...")
    Base.metadata.create_all(bind=engine)

def ingest_data():
    init_db()

    print(f"Loading embedding model: {EMBEDDING_MODEL_NAME}...")
    model = SentenceTransformer(EMBEDDING_MODEL_NAME)

    print("Loading MedQuAD dataset from HuggingFace...")
    # Using a popular medical Q&A dataset
    dataset = load_dataset("keivalya/MedQuad-MedicalQnADataset", split="train")
    
    db: Session = SessionLocal()
    
    try:
        # Check if we already have data
        existing_count = db.query(KBDocument).count()
        if existing_count > 0:
            print(f"Found {existing_count} existing documents in kb_documents.")
            if existing_count >= TARGET_ROWS:
                print(f"Already reached target of {TARGET_ROWS} rows. Exiting.")
                return

        processed_chunks = 0
        batch_size = 100
        batch_records = []
        
        print("Processing and inserting records...")
        
        # Keep track of unique questions to avoid duplicates in this run
        seen_qna = set()

        for row in dataset:
            if processed_chunks >= TARGET_ROWS:
                break
                
            qtype = row.get("qtype", "unknown")
            question = row.get("Question", "")
            answer = row.get("Answer", "")
            
            if not question or not answer:
                continue
                
            qna_pair = f"Q: {question} A: {answer}"
            
            if qna_pair in seen_qna:
                continue
            seen_qna.add(qna_pair)
            
            # Clean
            clean_qna = clean_text(qna_pair)
            
            # Chunk
            chunks = chunk_text(clean_qna)
            
            for chunk in chunks:
                if processed_chunks >= TARGET_ROWS:
                    break
                    
                # Embed
                embedding = model.encode(chunk).tolist()
                
                doc = KBDocument(
                    source="MedQuAD",
                    title=f"{qtype} - {question[:50]}...",
                    url="https://huggingface.co/datasets/keivalya/MedQuad-MedicalQnADataset",
                    content_chunk=chunk,
                    embedding=embedding,
                    chunk_metadata={"qtype": qtype, "original_question": question}
                )
                
                batch_records.append(doc)
                processed_chunks += 1
                
                if len(batch_records) >= batch_size:
                    db.add_all(batch_records)
                    db.commit()
                    print(f"Inserted {processed_chunks} chunks...")
                    batch_records = []
                    
        # Insert remaining
        if batch_records:
            db.add_all(batch_records)
            db.commit()
            print(f"Inserted {processed_chunks} chunks...")

        print(f"Successfully ingested {processed_chunks} chunks into the knowledge base.")

    except Exception as e:
        print(f"Error during ingestion: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    ingest_data()
