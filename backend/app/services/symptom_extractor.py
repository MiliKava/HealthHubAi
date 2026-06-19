import json
import os
import difflib
import re
from typing import List, Dict, Any
from openai import OpenAI
from app.core.config import settings
from app.schemas.symptom import ExtractedSymptom

# Load the canonical symptom list once when the module is imported
DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
SYMPTOMS_FILE = os.path.join(DATA_DIR, "symptoms.json")

def load_symptoms() -> List[Dict[str, Any]]:
    if not os.path.exists(SYMPTOMS_FILE):
        return []
    with open(SYMPTOMS_FILE, "r") as f:
        return json.load(f)

SYMPTOMS_DATA = load_symptoms()
CANONICAL_LIST = [s["canonical"] for s in SYMPTOMS_DATA]
SYMPTOM_MAP = {}
for s in SYMPTOMS_DATA:
    SYMPTOM_MAP[s["canonical"]] = s

def extract_symptoms(text: str) -> List[ExtractedSymptom]:
    """
    Extracts canonical symptoms from free-text patient input.
    Uses LLM structured output if GROQ_API_KEY, GROQ_API_KEY_TWO, GEMINI_API_KEY, or OPENAI_API_KEY is available.
    Falls back to rule-based fuzzy matching otherwise.
    """
    if settings.GROQ_API_KEY or settings.GROQ_API_KEY_TWO or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY:
        try:
            return _extract_symptoms_llm(text)
        except Exception as e:
            # Fallback if LLM fails
            print(f"LLM extraction failed: {e}. Falling back to rule-based.")
            return _extract_symptoms_rule_based(text)
    else:
        return _extract_symptoms_rule_based(text)

def _extract_symptoms_llm(text: str) -> List[ExtractedSymptom]:
    configs = []
    
    if settings.GROQ_API_KEY:
        configs.append({
            "api_key": settings.GROQ_API_KEY,
            "base_url": "https://api.groq.com/openai/v1",
            "model": "llama-3.1-8b-instant"
        })
    if settings.GROQ_API_KEY_TWO:
        configs.append({
            "api_key": settings.GROQ_API_KEY_TWO,
            "base_url": "https://api.groq.com/openai/v1",
            "model": "llama3-8b-8192" # Fallback model supported by Groq
        })
    if settings.GEMINI_API_KEY:
        configs.append({
            "api_key": settings.GEMINI_API_KEY,
            "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
            "model": "gemini-1.5-flash"
        })
    if settings.OPENAI_API_KEY:
        configs.append({
            "api_key": settings.OPENAI_API_KEY,
            "base_url": None,
            "model": "gpt-4o-mini"
        })

    prompt = f"""
    You are a medical symptom extraction assistant.
    Extract the symptoms mentioned in the following text.
    You MUST map each extracted symptom to one of the canonical symptoms in the provided list.
    Return a JSON object containing a list called "symptoms".
    Each item in the list must have:
    - "canonical_symptom": The exact string from the canonical list provided below.
    - "raw_text": The exact phrase from the input text that indicates this symptom.
    - "confidence": A float between 0.0 and 1.0 indicating your confidence.

    Canonical List:
    {json.dumps(CANONICAL_LIST)}

    Text to extract from:
    "{text}"
    """

    last_exception = None
    for config in configs:
        try:
            client_args = {"api_key": config["api_key"]}
            if config["base_url"]:
                client_args["base_url"] = config["base_url"]
                
            client = OpenAI(**client_args)
            
            response = client.chat.completions.create(
                model=config["model"],
                messages=[
                    {"role": "system", "content": "You are a helpful medical symptom extraction tool. Always respond in valid JSON format matching the requested schema."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"},
                temperature=0.0
            )
            
            result_json_str = response.choices[0].message.content
            data = json.loads(result_json_str)
            symptoms_data = data.get("symptoms", [])
            
            extracted = []
            for item in symptoms_data:
                canonical = item.get("canonical_symptom")
                if canonical in CANONICAL_LIST:
                    extracted.append(ExtractedSymptom(
                        canonical_symptom=canonical,
                        raw_text=item.get("raw_text", ""),
                        confidence=float(item.get("confidence", 0.8))
                    ))
            return extracted
        except Exception as e:
            print(f"LLM API Call failed for model {config['model']}: {e}")
            last_exception = e
            continue
            
    # If all configs failed, raise the last exception to fallback to rule-based
    if last_exception:
        raise last_exception
    
    return []


def _extract_symptoms_rule_based(text: str) -> List[ExtractedSymptom]:
    """
    Fallback rule-based extraction using substring and fuzzy matching against synonyms.
    """
    extracted_map = {}
    lower_text = text.lower()
    
    # Simple regex to split text into words for n-gram generation
    words = re.findall(r'\b\w+\b', lower_text)
    
    # Helper to generate n-grams up to length 4
    ngrams = []
    for n in range(1, 5):
        for i in range(len(words) - n + 1):
            ngrams.append(" ".join(words[i:i+n]))
            
    # Include the whole text as well
    ngrams.append(lower_text)

    for entry in SYMPTOMS_DATA:
        canonical = entry["canonical"]
        synonyms = entry.get("synonyms", [])
        
        # All phrases to match against (canonical + synonyms)
        match_phrases = [canonical.lower()] + [s.lower() for s in synonyms]
        
        best_match = None
        best_ratio = 0.0
        best_phrase = ""
        
        for phrase in match_phrases:
            # 1. Exact substring match in text
            if phrase in lower_text:
                if 1.0 > best_ratio:
                    best_ratio = 1.0
                    best_phrase = phrase
                    best_match = phrase
                    break # perfect match
                    
            # 2. Fuzzy match against n-grams
            matches = difflib.get_close_matches(phrase, ngrams, n=1, cutoff=0.85)
            if matches:
                # Calculate exact ratio
                ratio = difflib.SequenceMatcher(None, phrase, matches[0]).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_phrase = matches[0]
                    best_match = phrase

        if best_ratio >= 0.85:
            # Find the actual text in the original string if possible
            # for raw_text, we use best_phrase. We can try to preserve case if it was an exact substring.
            raw_text_val = best_phrase
            # Quick attempt to find exact case
            idx = lower_text.find(best_phrase)
            if idx != -1:
                raw_text_val = text[idx:idx+len(best_phrase)]
                
            extracted_map[canonical] = ExtractedSymptom(
                canonical_symptom=canonical,
                raw_text=raw_text_val,
                confidence=best_ratio * 0.9 # Cap confidence slightly lower for rule-based
            )

    return list(extracted_map.values())
