import sys
import os
from sqlalchemy import create_engine, text
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer

# Setup database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5433/carebridge")
engine = create_engine(DATABASE_URL)

def search_knowledge_base(query_text: str, top_k: int = 3):
    print(f"Loading embedding model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print(f"Generating embedding for query: '{query_text}'")
    embedding = model.encode(query_text).tolist()
    
    print("Executing pgvector similarity search...")
    
    # We use the <=> operator which calculates cosine distance
    sql = text("""
        SELECT title, content_chunk, embedding <=> :query_embedding AS distance
        FROM kb_documents
        ORDER BY distance ASC
        LIMIT :top_k
    """)
    
    with engine.connect() as conn:
        results = conn.execute(sql, {"query_embedding": str(embedding), "top_k": top_k})
        
        print("\n" + "="*50)
        print("TOP MATCHING CHUNKS:")
        print("="*50)
        
        for idx, row in enumerate(results, 1):
            title = row[0]
            chunk = row[1]
            distance = row[2]
            
            print(f"\n[{idx}] Distance: {distance:.4f} | Source: {title}")
            print("-" * 50)
            print(chunk)
            print("-" * 50)

if __name__ == "__main__":
    test_query = "What is a clinical trial and how does it help?"
    if len(sys.argv) > 1:
        test_query = " ".join(sys.argv[1:])
        
    search_knowledge_base(test_query)
