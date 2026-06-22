import pytest
import time
from app.services.emergency_detector import check_emergency

def test_rf_01_cardiac_emergency():
    # Positive cases
    assert check_emergency(["chest_pain", "dyspnea"]).rule_id == "RF-01"
    assert check_emergency(["left_arm_pain", "chest_pain", "other_symptom"]).rule_id == "RF-01"
    assert check_emergency(["jaw_pain", "chest_pain"]).rule_id == "RF-01"
    
    # Negative cases
    assert check_emergency(["chest_pain", "cough"]).emergency is False
    assert check_emergency(["dyspnea", "left_arm_pain"]).emergency is False

def test_rf_02_stroke_signs():
    # Positive cases
    assert check_emergency(["face_drooping"]).rule_id == "RF-02"
    assert check_emergency(["arm_weakness", "headache"]).rule_id == "RF-02"
    assert check_emergency(["sudden_speech_difficulty"]).rule_id == "RF-02"
    
    # Negative cases
    assert check_emergency(["headache", "dizziness"]).emergency is False

def test_rf_03_severe_bleeding():
    # Positive cases
    assert check_emergency(["severe_bleeding"]).rule_id == "RF-03"
    assert check_emergency(["uncontrolled_hemorrhage"]).rule_id == "RF-03"
    
    # Negative cases
    assert check_emergency(["minor_cut", "bruise"]).emergency is False

def test_rf_04_anaphylaxis():
    # Positive cases
    assert check_emergency(["throat_swelling", "hives"]).rule_id == "RF-04"
    assert check_emergency(["dyspnea", "throat_swelling"]).rule_id == "RF-04"
    
    # Negative cases
    assert check_emergency(["throat_swelling", "cough"]).emergency is False
    assert check_emergency(["hives", "itchy_skin"]).emergency is False

def test_rf_05_mental_health():
    # Positive cases
    assert check_emergency(["suicidal_ideation"]).rule_id == "RF-05"
    assert check_emergency(["self_harm_intent", "depression"]).rule_id == "RF-05"
    
    # Negative cases
    assert check_emergency(["anxiety", "insomnia"]).emergency is False

def test_rf_06_unconsciousness():
    # Positive cases
    assert check_emergency(["loss_of_consciousness"]).rule_id == "RF-06"
    assert check_emergency(["loss_of_consciousness", "fever"]).rule_id == "RF-06"
    
    # Negative cases
    assert check_emergency(["dizziness", "fatigue"]).emergency is False

def test_rf_07_head_trauma():
    # Positive cases
    assert check_emergency(["severe_head_trauma"]).rule_id == "RF-07"
    assert check_emergency(["severe_head_trauma", "headache"]).rule_id == "RF-07"
    
    # Negative cases
    assert check_emergency(["mild_concussion"]).emergency is False
    assert check_emergency(["headache"]).emergency is False

def test_no_emergency():
    res = check_emergency(["fever", "cough", "sore_throat"])
    assert res.emergency is False
    assert res.rule_id is None
    assert res.message is None

def test_performance_under_10ms():
    start_time = time.perf_counter()
    check_emergency(["chest_pain", "dyspnea", "fever", "cough", "throat_swelling", "hives"])
    end_time = time.perf_counter()
    duration_ms = (end_time - start_time) * 1000
    assert duration_ms < 10.0, f"Execution took too long: {duration_ms} ms"

def test_disclaimer_included():
    # Triggered case
    res1 = check_emergency(["chest_pain", "dyspnea"])
    assert "This is not a diagnosis. This tool cannot replace emergency medical services." in res1.disclaimer
    
    # Non-triggered case
    res2 = check_emergency(["fever"])
    assert "This is not a diagnosis. This tool cannot replace emergency medical services." in res2.disclaimer

def test_message_format():
    res = check_emergency(["chest_pain", "dyspnea"])
    assert res.message == "⚠️ Your symptoms may indicate a serious cardiac emergency. Please call 911 (or your local emergency number) immediately or go to the nearest emergency room. Do not drive yourself."

from unittest.mock import MagicMock

def test_pipeline_short_circuit_no_llm_call():
    # Mock an LLM or RAG function
    mock_llm_call = MagicMock()
    
    def dummy_triage_pipeline(symptoms):
        res = check_emergency(symptoms)
        if res.emergency:
            return res
        # Only call LLM if no emergency
        mock_llm_call()
        return "LLM Response"

    # Positive case: should short circuit
    res_emergency = dummy_triage_pipeline(["chest_pain", "dyspnea"])
    assert res_emergency.emergency is True
    mock_llm_call.assert_not_called()

    # Negative case: should call LLM
    res_normal = dummy_triage_pipeline(["fever", "cough"])
    assert res_normal == "LLM Response"
    mock_llm_call.assert_called_once()

