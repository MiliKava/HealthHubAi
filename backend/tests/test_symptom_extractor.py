import pytest
from unittest.mock import patch, MagicMock
from app.services.symptom_extractor import extract_symptoms, _extract_symptoms_rule_based
from app.schemas.symptom import ExtractedSymptom

TEST_CASES = [
    # Basic phrasing
    ("I've been having trouble breathing and my chest feels tight", ["dyspnea", "chest tightness"]),
    ("I am short of breath.", ["dyspnea"]),
    ("My head hurts really bad.", ["headache"]),
    ("I feel sick to my stomach.", ["nausea"]),
    ("I have been coughing all night.", ["cough"]),
    
    # Slang / casual phrasing
    ("I'm feeling super winded after walking upstairs", ["dyspnea"]),
    ("My tummy aches.", ["abdominal pain"]),
    ("I think I'm gonna throw up.", ["vomiting"]),
    ("Got the runs since yesterday.", ["diarrhea"]),
    ("My heart is pounding out of my chest.", ["palpitations"]),
    
    # Multi-symptom inputs
    ("I've got a splitting headache, I'm dizzy, and I threw up.", ["headache", "dizziness", "vomiting"]),
    ("My throat hurts, I'm coughing up blood, and I'm shivering.", ["hemoptysis", "chills"]),
    ("I passed out and when I woke up my leg was numb.", ["syncope", "numbness"]),
    ("Constant lower back hurts and my joints are aching.", ["back pain", "joint pain"]),
    ("I'm breaking out in hives and it's super scratchy.", ["rash", "pruritus"]),
    
    # Complex / tricky phrasing
    ("I can't seem to catch my breath.", ["dyspnea"]),
    ("Everything is spinning around me.", ["dizziness"]),
    ("I'm burning up and drenched in sweat at night.", ["fever", "night sweats"]),
    ("My skin is turning yellow.", ["jaundice"]),
    ("I am hearing voices that aren't there.", ["hallucinations"]),
    
    # Edge cases / synonyms
    ("I've been wheezing.", ["wheezing"]),
    ("I lost consciousness for a minute.", ["syncope"]),
]

@pytest.mark.parametrize("text,expected_canonicals", TEST_CASES)
def test_rule_based_extractor(text, expected_canonicals):
    # Test the fallback explicitly
    results = _extract_symptoms_rule_based(text)
    extracted_canonicals = [r.canonical_symptom for r in results]
    
    for expected in expected_canonicals:
        assert expected in extracted_canonicals, f"Expected '{expected}' to be extracted from '{text}', but got {extracted_canonicals}"

@patch("app.services.symptom_extractor.settings")
def test_fallback_works_when_no_api_key(mock_settings):
    mock_settings.OPENAI_API_KEY = None
    
    text = "I have a terrible headache."
    results = extract_symptoms(text)
    
    extracted_canonicals = [r.canonical_symptom for r in results]
    assert "headache" in extracted_canonicals

@patch("app.services.symptom_extractor.OpenAI")
@patch("app.services.symptom_extractor.settings")
def test_llm_extractor(mock_settings, MockOpenAI):
    mock_settings.OPENAI_API_KEY = "dummy_key"
    
    # Mock LLM response
    mock_client = MockOpenAI.return_value
    mock_response = MagicMock()
    mock_response.choices[0].message.content = '{"symptoms": [{"canonical_symptom": "dyspnea", "raw_text": "trouble breathing", "confidence": 0.9}]}'
    mock_client.chat.completions.create.return_value = mock_response
    
    text = "I have trouble breathing."
    results = extract_symptoms(text)
    
    extracted_canonicals = [r.canonical_symptom for r in results]
    assert "dyspnea" in extracted_canonicals
    assert len(results) == 1
    assert results[0].raw_text == "trouble breathing"
