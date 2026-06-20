import json
import os
import re
from datetime import date
from typing import List, Dict, Any, Optional
from app.schemas.symptom import ExtractedSymptom
from app.schemas.patient import PatientProfileBase
from app.schemas.triage import TriageResult

# Load symptoms to get categories
DATA_DIR = os.path.join(os.path.dirname(__file__), "../data")
SYMPTOMS_FILE = os.path.join(DATA_DIR, "symptoms.json")

def load_symptoms() -> List[Dict[str, Any]]:
    if not os.path.exists(SYMPTOMS_FILE):
        return []
    with open(SYMPTOMS_FILE, "r") as f:
        return json.load(f)

SYMPTOMS_DATA = load_symptoms()
SYMPTOM_CATEGORY_MAP = {s["canonical"]: s.get("category", "systemic") for s in SYMPTOMS_DATA}

SPECIALIST_MAP = {
    "cardiac": "Cardiologist",
    "neurological": "Neurologist",
    "respiratory": "Pulmonologist",
    "gastrointestinal": "Gastroenterologist",
    "musculoskeletal": "Orthopedist",
    "dermatological": "Dermatologist",
    "psychiatric": "Psychiatrist",
    "systemic": "General Practitioner"
}

def calculate_age(dob: date) -> int:
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

def parse_duration(duration_str: str) -> str:
    """Classifies duration into acute, subacute, or chronic."""
    duration_str = duration_str.lower()
    
    # Hours or < 24h
    if re.search(r'\b(hour|hr|h|minute|min)s?\b', duration_str):
        return "acute"
        
    # Days
    if "day" in duration_str:
        # Check if > 14 days
        nums = re.findall(r'\d+', duration_str)
        if nums and int(nums[0]) > 14:
            return "chronic"
        return "subacute"
        
    # Weeks, Months, Years
    if re.search(r'week|wk|month|mo|year|yr', duration_str):
        return "chronic"
        
    return "subacute" # default

def score_triage(
    symptoms: List[ExtractedSymptom],
    severity: int,
    duration: str,
    patient_profile: Optional[PatientProfileBase] = None
) -> TriageResult:
    score = 0
    breakdown = {}
    
    # 1. Symptom category severity
    highest_cat_score = 0
    highest_cat = "systemic"
    cat_rationale = ""
    
    for sym in symptoms:
        cat = SYMPTOM_CATEGORY_MAP.get(sym.canonical_symptom, "systemic")
        if cat in ["cardiac", "neurological", "respiratory", "psychiatric"]:
            cat_score = 30
        elif cat in ["systemic", "gastrointestinal"]:
            cat_score = 15
        else:
            cat_score = 5
            
        if cat_score > highest_cat_score:
            highest_cat_score = cat_score
            highest_cat = cat
            cat_rationale = f"High-risk category ({cat})" if cat_score == 30 else f"Medium-risk category ({cat})" if cat_score == 15 else f"Low-risk category ({cat})"
    
    if not symptoms:
        cat_rationale = "No symptoms provided"
        highest_cat_score = 0
        
    score += highest_cat_score
    breakdown["category"] = {
        "score": highest_cat_score,
        "rationale": cat_rationale
    }
    
    # 2. Number of concurrent symptoms
    num_sym = len(symptoms)
    if num_sym > 3:
        sym_score = 20
        sym_rationale = f"{num_sym} concurrent symptoms (>3)"
    elif num_sym > 1:
        sym_score = 10
        sym_rationale = f"{num_sym} concurrent symptoms (2-3)"
    else:
        sym_score = 0
        sym_rationale = "Single symptom" if num_sym == 1 else "No symptoms"
        
    score += sym_score
    breakdown["concurrent_symptoms"] = {
        "score": sym_score,
        "rationale": sym_rationale
    }
    
    # 3. Patient-reported severity score
    if severity >= 8:
        sev_score = 25
        sev_rationale = f"High reported severity ({severity}/10)"
    elif severity >= 5:
        sev_score = 15
        sev_rationale = f"Medium reported severity ({severity}/10)"
    else:
        sev_score = 5
        sev_rationale = f"Low reported severity ({severity}/10)"
        
    score += sev_score
    breakdown["severity"] = {
        "score": sev_score,
        "rationale": sev_rationale
    }
    
    # 4. Duration
    dur_class = parse_duration(duration)
    if dur_class == "acute":
        dur_score = 20
        dur_rationale = f"Acute duration (<24h) - '{duration}'"
    elif dur_class == "subacute":
        dur_score = 10
        dur_rationale = f"Subacute duration (days) - '{duration}'"
    else:
        dur_score = 5
        dur_rationale = f"Chronic duration (weeks+) - '{duration}'"
        
    score += dur_score
    breakdown["duration"] = {
        "score": dur_score,
        "rationale": dur_rationale
    }
    
    # 5. Risk modifiers
    mod_score = 0
    mod_rationales = []
    
    if patient_profile:
        if patient_profile.date_of_birth:
            age = calculate_age(patient_profile.date_of_birth)
            if age > 65:
                mod_score += 15
                mod_rationales.append(f"Age > 65 ({age})")
                
        if patient_profile.pregnancy_status and patient_profile.pregnancy_status.lower() in ["yes", "true", "pregnant"]:
            mod_score += 20
            mod_rationales.append("Pregnancy")
            
        if patient_profile.chronic_conditions and patient_profile.chronic_conditions.strip().lower() != "none":
            mod_score += 15
            mod_rationales.append(f"Chronic conditions ({patient_profile.chronic_conditions})")
            
    if not mod_rationales:
        mod_rationales = ["No high-risk modifiers"]
        
    score += mod_score
    breakdown["risk_modifiers"] = {
        "score": mod_score,
        "rationale": ", ".join(mod_rationales)
    }
    
    # Determine risk level
    if score >= 65:
        risk_level = "high"
    elif score >= 35:
        risk_level = "medium"
    else:
        risk_level = "low"
        
    # Determine recommended specialist
    recommended_specialist = SPECIALIST_MAP.get(highest_cat, "General Practitioner")
    
    return TriageResult(
        risk_level=risk_level,
        score_breakdown=breakdown,
        recommended_specialist=recommended_specialist,
        emergency_flag=False
    )
