import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, UserRole, DoctorProfile
from app.api.deps import get_current_user, require_role
from app.schemas.doctor import DoctorProfile as DoctorProfileSchema, DoctorProfileUpdate, CVKeywords
from app.core.config import settings

router = APIRouter()

@router.get("/me/profile", response_model=DoctorProfileSchema)
def get_my_profile(
    current_user: User = Depends(require_role([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    profile = current_user.doctor_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    return profile

@router.put("/me/profile", response_model=DoctorProfileSchema)
def update_my_profile(
    profile_in: DoctorProfileUpdate,
    current_user: User = Depends(require_role([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    profile = current_user.doctor_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    update_data = profile_in.model_dump(exclude_unset=True)
    
    # Handle cv_keywords dictionary serialization if provided
    if "cv_keywords" in update_data and update_data["cv_keywords"] is not None:
        if hasattr(update_data["cv_keywords"], "model_dump"):
            update_data["cv_keywords"] = update_data["cv_keywords"].model_dump()
        elif isinstance(update_data["cv_keywords"], dict):
            pass # already dict

    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/cv", response_model=CVKeywords)
async def upload_and_process_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(require_role([UserRole.DOCTOR])),
    db: Session = Depends(get_db)
):
    profile = current_user.doctor_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    
    # Extract text using PyMuPDF (fitz)
    try:
        # pyrefly: ignore [missing-import]
        import fitz # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
    except Exception as e:
        print(f"Error parsing PDF: {e}")
        # fallback text
        text = ""

    # Check if text is extracted
    if not text.strip():
        # Fallback empty keyword object with error in summary
        return CVKeywords(summary="Failed to extract text from PDF. Please fill manually.")

    # Call LLM to extract keywords
    extracted = await extract_keywords_from_text(text)
    
    # Save extracted keywords to profile (discard raw text and PDF)
    profile.cv_keywords = extracted.model_dump()
    db.commit()
    db.refresh(profile)
    
    return extracted

async def extract_keywords_from_text(text: str) -> CVKeywords:
    if not settings.GROQ_API_KEY and (not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY in ["dummy", "your_openai_api_key_here"]):
        # Return mock data if no real key
        return CVKeywords(
            specialty="General Practice (Mock)",
            qualifications=["MBBS", "MD"],
            certifications=["BLS"],
            languages=["English"],
            years_experience=5,
            summary="This is a mock summary extracted from the CV because no API key is provided."
        )
    # pyrefly: ignore [missing-import]
    import openai
    # pyrefly: ignore [missing-import]
    from openai import AsyncOpenAI
    
    if settings.GROQ_API_KEY:
        client = AsyncOpenAI(api_key=settings.GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        model_name = "llama-3.1-8b-instant"
    else:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        model_name = "gpt-3.5-turbo"
    
    prompt = """
    You are a medical CV parsing assistant. Extract the following information from the provided CV text.
    Return ONLY a JSON object with the following schema:
    {
      "specialty": "string (the main medical specialty)",
      "qualifications": ["string", "string"],
      "certifications": ["string", "string"],
      "languages": ["string", "string"],
      "years_experience": int (estimate if not explicit),
      "summary": "string (2-3 sentence professional summary)"
    }
    """
    
    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"CV Text:\n\n{text}"}
            ],
            response_format={ "type": "json_object" }
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        return CVKeywords(**data)
    except Exception as e:
        print(f"Error extracting keywords with LLM: {e}")
        return CVKeywords(summary="Error during LLM extraction. Please fill manually.")
