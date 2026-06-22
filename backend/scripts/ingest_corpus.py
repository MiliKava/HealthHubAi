import os
import glob
import xml.etree.ElementTree as ET
import uuid
from typing import List, Dict, Any
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
from app.db.database import SessionLocal, engine
from app.db.models import KBDocument
from dotenv import load_dotenv

load_dotenv()

# We will use the all-MiniLM-L6-v2 model which produces 384-dimensional embeddings
MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)

DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "MedQuAD", "MedQuAD-master")

def clean_text(html_text: str) -> str:
    if not html_text:
        return ""
    soup = BeautifulSoup(html_text, "lxml")
    text = soup.get_text(separator=" ", strip=True)
    # Simple normalization
    text = " ".join(text.split())
    return text

def chunk_text(text: str, max_tokens: int = 300, overlap: int = 50) -> List[str]:
    # Approximating tokens by words (1 token ~ 1 word for simplicity, though actual tokenizer would be better)
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = " ".join(words[i:i + max_tokens])
        chunks.append(chunk)
        i += max_tokens - overlap
        if i >= len(words) - overlap:
            # Add remaining words if not covered and break
            if i < len(words):
                 chunks.append(" ".join(words[i:]))
            break
    return chunks

def process_file(filepath: str) -> List[Dict[str, Any]]:
    docs = []
    try:
        tree = ET.parse(filepath)
        root = tree.getroot()
        
        source = root.attrib.get('source', 'Unknown')
        url = root.attrib.get('url', '')
        focus_elem = root.find('Focus')
        title = focus_elem.text if focus_elem is not None else "Medical Information"
        
        qapairs = root.find('QAPairs')
        if qapairs is not None:
            for qapair in qapairs.findall('QAPair'):
                question_elem = qapair.find('Question')
                answer_elem = qapair.find('Answer')
                
                if question_elem is not None and answer_elem is not None:
                    q_text = clean_text(question_elem.text)
                    a_text = clean_text(answer_elem.text)
                    q_type = question_elem.attrib.get('qtype', 'unknown')
                    
                    combined_text = f"Question: {q_text}\nAnswer: {a_text}"
                    
                    chunks = chunk_text(combined_text, max_tokens=300, overlap=50)
                    for chunk in chunks:
                        docs.append({
                            "source": source,
                            "title": title,
                            "url": url,
                            "content_chunk": chunk,
                            "metadata": {
                                "question": q_text,
                                "qtype": q_type,
                            }
                        })
    except Exception as e:
        print(f"Error parsing {filepath}: {e}")
    return docs

def main():
    global DATASET_PATH
    print(f"Starting corpus ingestion from {DATASET_PATH}")
    
    # Check if dataset path exists
    if not os.path.exists(DATASET_PATH):
        # We might be in docker with a mounted volume at /app/MedQuAD
        DATASET_PATH = "/app/MedQuAD/MedQuAD-master"
        if not os.path.exists(DATASET_PATH):
            print(f"Dataset path {DATASET_PATH} not found.")
            return

    db: Session = SessionLocal()
    
    # We will process a subset to keep ingestion fast for this demo (e.g. limit to 500 files ~ 5000 chunks)
    xml_files = glob.glob(os.path.join(DATASET_PATH, "*", "*.xml"))
    print(f"Found {len(xml_files)} XML files.")
    
    MAX_CHUNKS = 100000
    chunks_inserted = 0
    batch_size = 100
    batch = []
    
    for filepath in xml_files:
        if chunks_inserted >= MAX_CHUNKS:
            break
            
        file_docs = process_file(filepath)
        for doc in file_docs:
            batch.append(doc)
            
            if len(batch) >= batch_size:
                texts = [b["content_chunk"] for b in batch]
                embeddings = model.encode(texts)
                
                db_docs = []
                for i, b in enumerate(batch):
                    db_docs.append(KBDocument(
                        source=b["source"],
                        title=b["title"],
                        url=b["url"],
                        content_chunk=b["content_chunk"],
                        embedding=embeddings[i].tolist(),
                        chunk_metadata=b["metadata"]
                    ))
                
                try:
                    # Check for duplicates by content chunk? Let's assume table might be empty, or we use unique constraints.
                    # Given acceptance criteria "script is idempotent", we should check if they exist or just rely on a simple check.
                    # A better way is to check the first document's title/chunk in the DB.
                    # For simplicity, we just insert. To be truly idempotent, we can check if source/chunk exists.
                    for d in db_docs:
                        exists = db.query(KBDocument).filter(
                            KBDocument.source == d.source,
                            KBDocument.content_chunk == d.content_chunk
                        ).first()
                        if not exists:
                            db.add(d)
                            chunks_inserted += 1
                    
                    db.commit()
                    print(f"Inserted up to {chunks_inserted} chunks.")
                except Exception as e:
                    print(f"Error inserting batch: {e}")
                    db.rollback()
                
                batch = []
                if chunks_inserted >= MAX_CHUNKS:
                    break

    # Process remaining in batch
    if batch and chunks_inserted < MAX_CHUNKS:
        texts = [b["content_chunk"] for b in batch]
        embeddings = model.encode(texts)
        
        for i, b in enumerate(batch):
            db_doc = KBDocument(
                source=b["source"],
                title=b["title"],
                url=b["url"],
                content_chunk=b["content_chunk"],
                embedding=embeddings[i].tolist(),
                chunk_metadata=b["metadata"]
            )
            exists = db.query(KBDocument).filter(
                KBDocument.source == db_doc.source,
                KBDocument.content_chunk == db_doc.content_chunk
            ).first()
            if not exists:
                db.add(db_doc)
                chunks_inserted += 1
        try:
            db.commit()
            print(f"Inserted remaining, total {chunks_inserted} chunks.")
        except Exception as e:
            db.rollback()

    db.close()
    print("Ingestion complete.")

if __name__ == "__main__":
    main()
