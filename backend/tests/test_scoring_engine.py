import pytest
import time
from datetime import date
from app.schemas.symptom import ExtractedSymptom
from app.schemas.patient import PatientProfileBase
from app.services.scoring_engine import score_triage

def create_symptoms(canonicals):
    return [ExtractedSymptom(canonical_symptom=c, raw_text=c, confidence=0.9) for c in canonicals]

def test_triage_scoring_engine_performance():
    symptoms = create_symptoms(["headache", "fever", "stiff_neck"])
    start_time = time.perf_counter()
    result = score_triage(symptoms=symptoms, severity=7, duration="2 days")
    end_time = time.perf_counter()
    duration_ms = (end_time - start_time) * 1000
    assert duration_ms < 50.0, f"Engine took {duration_ms} ms, which is over 50 ms."

def test_triage_scoring_cases():
    test_cases = [
        # 1. Example from spec
        {
            "symptoms": ["headache", "fever", "stiff_neck"],
            "severity": 7,
            "duration": "2 days",
            "profile": None,
            "expected_risk": "high",
            "expected_spec": "Neurologist"
        },
        # 2. Cardiac acute
        {
            "symptoms": ["chest pain", "shortness of breath", "sweating"], # sweating might not be in the list, but it defaults to systemic
            "severity": 9,
            "duration": "2 hours",
            "profile": None,
            "expected_risk": "high",
            "expected_spec": "Cardiologist"
        },
        # 3. Systemic low risk
        {
            "symptoms": ["fatigue"],
            "severity": 3,
            "duration": "3 weeks",
            "profile": None,
            "expected_risk": "low",
            "expected_spec": "General Practitioner"
        },
        # 4. Gastro medium risk
        {
            "symptoms": ["abdominal pain", "nausea"],
            "severity": 6,
            "duration": "1 day",
            "profile": None,
            "expected_risk": "medium",
            "expected_spec": "Gastroenterologist"
        },
        # 5. Risk modifier - Age > 65 elevates medium to high
        {
            "symptoms": ["cough", "fever"], # Respiratory/Systemic
            "severity": 5, # 15
            "duration": "3 days", # 10
            "profile": PatientProfileBase(date_of_birth=date(1950, 1, 1)), # > 65 -> +15. Category: respiratory=30, syms=10. Total: 30+10+15+10+15 = 80 (High)
            "expected_risk": "high",
            "expected_spec": "Pulmonologist"
        },
        # 6. Same symptoms as 5, but younger -> Medium
        {
            "symptoms": ["cough", "fever"],
            "severity": 4,
            "duration": "3 days",
            "profile": PatientProfileBase(date_of_birth=date(1990, 1, 1)), # Total 30+10+5+10 = 55 (Medium)
            "expected_risk": "medium",
            "expected_spec": "Pulmonologist"
        },
        # Let's adjust case 6 to actually test the diff
        {
            "symptoms": ["joint pain", "stiffness"], # musculoskeletal = 5
            "severity": 5, # 15
            "duration": "1 week", # 10
            "profile": PatientProfileBase(date_of_birth=date(1990, 1, 1)), # Total: 5 + 10 + 15 + 10 + 0 = 40 (Medium)
            "expected_risk": "medium",
            "expected_spec": "Orthopedist"
        },
        # 7. Same as case 6 (adjusted), but pregnant -> High risk
        {
            "symptoms": ["joint pain", "stiffness"],
            "severity": 5,
            "duration": "1 week",
            "profile": PatientProfileBase(pregnancy_status="Yes", date_of_birth=date(1990, 1, 1)), # Total: 40 + 20 = 60. Wait, High is 65+. Let's increase duration to acute (20) -> 5+10+15+20+20 = 70.
            "expected_risk": "high", # I'll adjust the test case setup
            "expected_spec": "Orthopedist"
        },
        # 8. Single low severity symptom, chronic -> Low
        {
            "symptoms": ["rash"], # Dermatological = 5
            "severity": 2, # 5
            "duration": "2 months", # 5
            "profile": None, # syms: 0. Total: 5+5+5+0 = 15 (Low)
            "expected_risk": "low",
            "expected_spec": "Dermatologist"
        },
        # 9. Multiple symptoms but low severity -> Medium
        {
            "symptoms": ["headache", "nausea", "dizziness"], # Neuro = 30
            "severity": 2, # 5
            "duration": "3 days", # 10
            "profile": None, # syms: 10. Total: 30+10+5+10 = 55 (Medium)
            "expected_risk": "medium",
            "expected_spec": "Neurologist"
        },
        # 10. Psychiatric emergency proxy (High risk)
        {
            "symptoms": ["suicidal ideation"], # Psych = 30
            "severity": 9, # 25
            "duration": "1 hour", # 20
            "profile": None, # syms: 0. Total: 30+0+25+20 = 75 (High)
            "expected_risk": "high",
            "expected_spec": "Psychiatrist"
        },
        # 11. Chronic conditions modifier
        {
            "symptoms": ["abdominal pain"], # Gastro = 15
            "severity": 4, # 5
            "duration": "1 month", # 5
            "profile": PatientProfileBase(chronic_conditions="Diabetes"), # syms: 0. Total: 15+0+5+5+15 = 40 (Medium)
            "expected_risk": "medium",
            "expected_spec": "Gastroenterologist"
        },
        # 12. Same as 11 but no chronic conditions -> Low
        {
            "symptoms": ["abdominal pain"], # Gastro = 15
            "severity": 4, # 5
            "duration": "1 month", # 5
            "profile": None, # syms: 0. Total: 15+0+5+5+0 = 25 (Low)
            "expected_risk": "low",
            "expected_spec": "Gastroenterologist"
        },
        # 13. High severity, single symptom
        {
            "symptoms": ["back pain"], # musculoskeletal = 5
            "severity": 10, # 25
            "duration": "1 day", # 10
            "profile": None, # syms: 0. Total: 5+0+25+10 = 40 (Medium)
            "expected_risk": "medium",
            "expected_spec": "Orthopedist"
        },
        # 14. 4+ symptoms
        {
            "symptoms": ["cough", "fever", "chills", "muscle pain"], # Systemic = 15, Respiratory (cough) = 30
            "severity": 6, # 15
            "duration": "4 days", # 10
            "profile": None, # syms: 20 (4+). Total: 30+20+15+10 = 75 (High)
            "expected_risk": "high",
            "expected_spec": "Pulmonologist"
        },
        # 15. All risk modifiers active
        {
            "symptoms": ["fatigue"], # Systemic = 15
            "severity": 6, # 15
            "duration": "1 day", # 10
            "profile": PatientProfileBase(date_of_birth=date(1950, 1, 1), pregnancy_status="Pregnant", chronic_conditions="Hypertension"),
            # syms: 0. Modifiers: 15 + 20 + 15 = 50. Total: 15+0+15+10+50 = 90 (High)
            "expected_risk": "high",
            "expected_spec": "General Practitioner"
        }
    ]

    # Adjust case 7 to ensure it's High
    test_cases[7]["duration"] = "1 hour" # Acute -> 20. Total: 5+10+15+20+20 = 70 (High)

    for i, tc in enumerate(test_cases):
        symptoms = create_symptoms(tc["symptoms"])
        result = score_triage(
            symptoms=symptoms,
            severity=tc["severity"],
            duration=tc["duration"],
            patient_profile=tc["profile"]
        )
        
        assert result.risk_level == tc["expected_risk"], f"Case {i+1} failed: Expected risk {tc['expected_risk']}, got {result.risk_level}. Breakdown: {result.score_breakdown}"
        assert result.recommended_specialist == tc["expected_spec"], f"Case {i+1} failed: Expected specialist {tc['expected_spec']}, got {result.recommended_specialist}"
        
        # Verify human readability
        for k, v in result.score_breakdown.items():
            assert "rationale" in v
            assert isinstance(v["rationale"], str)
            assert len(v["rationale"]) > 0

