import json
import os
import sys

# Adjust path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.symptom_extractor import extract_symptoms
from app.services.emergency_detector import check_emergency
from app.services.scoring_engine import score_triage

EVAL_DIR = os.path.dirname(__file__)
SCENARIOS_FILE = os.path.join(EVAL_DIR, "scenarios.json")
RESULTS_DIR = os.path.join(EVAL_DIR, "results")
LATEST_RESULT_FILE = os.path.join(RESULTS_DIR, "latest.json")

def run_evaluation():
    if not os.path.exists(SCENARIOS_FILE):
        print(f"Error: {SCENARIOS_FILE} not found.")
        sys.exit(1)
        
    with open(SCENARIOS_FILE, "r") as f:
        scenarios = json.load(f)
        
    results = []
    
    triage_matches = 0
    specialist_matches = 0
    
    total_emergencies = 0
    true_positive_emergencies = 0
    flagged_emergencies = 0
    true_flagged_emergencies = 0

    for sc in scenarios:
        symptoms_text = sc["symptoms_text"]
        severity = sc.get("severity", 5)
        duration = sc.get("duration", "2 days")
        
        expected_risk = sc["expected_risk_level"]
        expected_spec = sc["expected_specialist"]
        expected_emerg = sc["expected_emergency"]
        
        print(f"Evaluating {sc['id']}...")
        # 1. Extract symptoms
        extracted = extract_symptoms(symptoms_text)
        canonical_list = [s.canonical_symptom for s in extracted]
        
        # 2. Emergency detection
        emerg_res = check_emergency(canonical_list)
        is_emerg = emerg_res.emergency
        
        # 3. Scoring
        if is_emerg:
            risk_level = "high"
            # Emergency might not specify a specialist in triage, but let's see
            # Actually, check_emergency doesn't return specialist. Let's run scoring anyway to get specialist
            # or just use the scoring engine for specialist
            triage_res = score_triage(extracted, severity, duration, None)
            specialist = triage_res.recommended_specialist
        else:
            triage_res = score_triage(extracted, severity, duration, None)
            risk_level = triage_res.risk_level
            specialist = triage_res.recommended_specialist
            
        # Match checks
        risk_match = (risk_level == expected_risk)
        spec_match = (specialist == expected_spec)
        emerg_match = (is_emerg == expected_emerg)
        
        # Stats accumulation
        if expected_emerg:
            total_emergencies += 1
            if is_emerg:
                true_positive_emergencies += 1
                
        if is_emerg:
            flagged_emergencies += 1
            if expected_emerg:
                true_flagged_emergencies += 1
                
        # For triage agreement, if it's an emergency, it's expected to be high risk. We count it in triage_matches if risk matches
        if risk_match:
            triage_matches += 1
        if spec_match:
            specialist_matches += 1
            
        results.append({
            "id": sc["id"],
            "expected_risk": expected_risk,
            "actual_risk": risk_level,
            "risk_match": risk_match,
            "expected_specialist": expected_spec,
            "actual_specialist": specialist,
            "specialist_match": spec_match,
            "expected_emergency": expected_emerg,
            "actual_emergency": is_emerg,
            "emergency_match": emerg_match
        })
        
    total_scenarios = len(scenarios)
    triage_agreement = triage_matches / total_scenarios if total_scenarios > 0 else 0
    specialist_accuracy = specialist_matches / total_scenarios if total_scenarios > 0 else 0
    
    emergency_recall = true_positive_emergencies / total_emergencies if total_emergencies > 0 else 1.0
    emergency_precision = true_flagged_emergencies / flagged_emergencies if flagged_emergencies > 0 else 1.0
    
    report_str = f"Triage agreement: {int(triage_agreement*100)}% ({triage_matches}/{total_scenarios}) · " \
                 f"Specialist accuracy: {int(specialist_accuracy*100)}% ({specialist_matches}/{total_scenarios}) · " \
                 f"Emergency recall: {int(emergency_recall*100)}% ({true_positive_emergencies}/{total_emergencies})"
                 
    print(report_str)
    
    os.makedirs(RESULTS_DIR, exist_ok=True)
    with open(LATEST_RESULT_FILE, "w") as f:
        json.dump({
            "metrics": {
                "triage_agreement": triage_agreement,
                "specialist_accuracy": specialist_accuracy,
                "emergency_recall": emergency_recall,
                "emergency_precision": emergency_precision
            },
            "results": results
        }, f, indent=4)
        
    # CI enforcement
    if triage_agreement < 0.70:
        print("Build Failed: Triage agreement dropped below 70%.")
        sys.exit(1)
    
    if emergency_recall < 1.0:
        print("Build Failed: Emergency detection recall dropped below 100%.")
        sys.exit(1)

if __name__ == "__main__":
    run_evaluation()
