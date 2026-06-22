from pydantic import BaseModel, Field
from typing import List

class ExtractedSymptom(BaseModel):
    canonical_symptom: str = Field(description="The canonical name of the symptom from the canonical list")
    raw_text: str = Field(description="The exact text or phrase from the user's input that indicates this symptom")
    confidence: float = Field(description="Confidence score between 0.0 and 1.0 of this extraction")

class SymptomExtractionResult(BaseModel):
    symptoms: List[ExtractedSymptom] = Field(description="A list of symptoms extracted from the text")
