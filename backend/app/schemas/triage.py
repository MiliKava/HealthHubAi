from pydantic import BaseModel, Field
from typing import Dict, Literal, Any

class TriageResult(BaseModel):
    risk_level: Literal["low", "medium", "high"] = Field(description="Calculated risk level")
    score_breakdown: Dict[str, Any] = Field(description="Breakdown of factors contributing to the score")
    recommended_specialist: str = Field(description="The recommended specialist based on symptom categories")
    emergency_flag: bool = Field(default=False, description="Whether this constitutes an emergency (always False here, caught in Phase 9)")
