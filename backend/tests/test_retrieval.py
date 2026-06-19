import pytest
from unittest.mock import MagicMock, patch
from app.services.retrieval import retrieve_chunks
from app.db.models import KBDocument
from app.schemas.retrieval import RetrievedChunk

class MockDoc:
    def __init__(self, content_chunk, source, title, url):
        self.content_chunk = content_chunk
        self.source = source
        self.title = title
        self.url = url

def test_retrieve_chunks_empty_db():
    mock_db = MagicMock()
    # Mocking db.query().order_by().limit().all() to return []
    mock_db.query.return_value.order_by.return_value.limit.return_value.all.return_value = []
    
    with patch("app.services.retrieval.EmbeddingModel.get_instance") as mock_model:
        mock_model.return_value.encode.return_value.tolist.return_value = [0.1] * 384
        
        results = retrieve_chunks(mock_db, query="test query", top_k=5)
        
        assert isinstance(results, list)
        assert len(results) == 0

def test_retrieve_chunks_returns_correctly():
    mock_db = MagicMock()
    mock_results = [
        (MockDoc("Fever is high", "MedlinePlus", "Fever in Adults", "http://example.com/1"), 0.1),
        (MockDoc("Headache persistent", "MayoClinic", "Headache", "http://example.com/2"), 0.2),
    ]
    mock_db.query.return_value.order_by.return_value.limit.return_value.all.return_value = mock_results
    
    with patch("app.services.retrieval.EmbeddingModel.get_instance") as mock_model:
        mock_model.return_value.encode.return_value.tolist.return_value = [0.1] * 384
        
        results = retrieve_chunks(mock_db, query="persistent fever and headache", top_k=5)
        
        assert len(results) == 2
        
        assert results[0].content == "Fever is high"
        assert results[0].source == "MedlinePlus"
        assert results[0].title == "Fever in Adults"
        assert results[0].url == "http://example.com/1"
        assert results[0].similarity_score == 0.9  # 1 - 0.1
        
        assert results[1].content == "Headache persistent"
        assert results[1].similarity_score == 0.8  # 1 - 0.2
