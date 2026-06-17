from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "CareBridge AI"
    DATABASE_URL: str
    SECRET_KEY: str
    OPENAI_API_KEY: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None
    DAILY_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
