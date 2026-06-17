import os
from pydantic_settings import BaseSettings
from typing import Optional

# Get the path to the root directory
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "CareBridge AI"
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    OPENAI_API_KEY: Optional[str] = None
    RESEND_API_KEY: Optional[str] = None
    DAILY_API_KEY: Optional[str] = None
    
    class Config:
        env_file = os.path.join(ROOT_DIR, ".env")
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()
