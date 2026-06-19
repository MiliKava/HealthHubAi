from typing import List
from app.schemas.emergency import EmergencyResult

DISCLAIMER = "This is not a diagnosis. This tool cannot replace emergency medical services."

def check_emergency(symptoms: List[str]) -> EmergencyResult:
    """
    Checks a list of canonical symptoms against hardcoded red-flag rules.
    Runs purely in-memory, under 10ms.
    """
    symptoms_set = set(sym.lower() for sym in symptoms)
    
    # RF-01: Possible cardiac emergency
    if "chest_pain" in symptoms_set and any(s in symptoms_set for s in ["dyspnea", "left_arm_pain", "jaw_pain"]):
        return EmergencyResult(
            emergency=True,
            rule_id="RF-01",
            message="⚠️ Your symptoms may indicate a serious cardiac emergency. Please call 911 (or your local emergency number) immediately or go to the nearest emergency room. Do not drive yourself.",
            disclaimer=DISCLAIMER
        )

    # RF-02: Possible stroke (FAST signs)
    if any(s in symptoms_set for s in ["face_drooping", "arm_weakness", "sudden_speech_difficulty"]):
        return EmergencyResult(
            emergency=True,
            rule_id="RF-02",
            message="⚠️ Your symptoms may indicate a possible stroke. Please call 911 (or your local emergency number) immediately or go to the nearest emergency room.",
            disclaimer=DISCLAIMER
        )

    # RF-03: Severe bleeding emergency
    if any(s in symptoms_set for s in ["severe_bleeding", "uncontrolled_hemorrhage"]):
        return EmergencyResult(
            emergency=True,
            rule_id="RF-03",
            message="⚠️ You may have a severe bleeding emergency. Please call 911 (or your local emergency number) immediately.",
            disclaimer=DISCLAIMER
        )

    # RF-04: Possible anaphylaxis
    if "throat_swelling" in symptoms_set and any(s in symptoms_set for s in ["hives", "dyspnea"]):
        return EmergencyResult(
            emergency=True,
            rule_id="RF-04",
            message="⚠️ Your symptoms may indicate a severe allergic reaction (anaphylaxis). Please use an epinephrine auto-injector if available and call 911 immediately.",
            disclaimer=DISCLAIMER
        )

    # RF-05: Mental health crisis
    if any(s in symptoms_set for s in ["suicidal_ideation", "self_harm_intent"]):
        return EmergencyResult(
            emergency=True,
            rule_id="RF-05",
            message="⚠️ You are not alone and help is available. Please call or text the Suicide & Crisis Lifeline at 988, or call 911 immediately.",
            disclaimer=DISCLAIMER
        )

    # RF-06: Unconsciousness emergency
    if "loss_of_consciousness" in symptoms_set:
        return EmergencyResult(
            emergency=True,
            rule_id="RF-06",
            message="⚠️ Loss of consciousness is a medical emergency. Please call 911 (or your local emergency number) immediately.",
            disclaimer=DISCLAIMER
        )

    # RF-07: Head injury emergency
    if "severe_head_trauma" in symptoms_set:
        return EmergencyResult(
            emergency=True,
            rule_id="RF-07",
            message="⚠️ A severe head injury is a medical emergency. Please call 911 (or your local emergency number) immediately or go to the nearest emergency room.",
            disclaimer=DISCLAIMER
        )

    # No emergency detected
    return EmergencyResult(emergency=False)
