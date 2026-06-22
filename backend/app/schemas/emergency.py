from typing import Optional
from pydantic import BaseModel

class EmergencyResult(BaseModel):
    emergency: bool
    rule_id: Optional[str] = None
    message: Optional[str] = None
    disclaimer: str = "This is not a diagnosis. This tool cannot replace emergency medical services."
