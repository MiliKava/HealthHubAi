import json
import logging
from typing import List, Dict, Any, Tuple
from pydantic import BaseModel
# pyrefly: ignore [missing-import]
from openai import OpenAI
from app.core.config import settings
from app.schemas.triage import TriageResult

logger = logging.getLogger(__name__)

DISCLAIMER = "\n\n*Disclaimer: This is an AI-generated triage assessment, not a medical diagnosis. If you are experiencing a life-threatening emergency, please call 911 or go to the nearest emergency room immediately.*"

class Citation(BaseModel):
    source: str
    excerpt: str

def generate_triage_response(
    triage_result: TriageResult,
    rag_chunks: List[Dict[str, Any]],
    conversation_summary: Dict[str, Any]
) -> Tuple[str, List[Dict[str, str]]]:
    """
    Generates a natural-language triage response combining RAG context, scoring result, and conversation history.
    Returns (response_text, citations_list)
    """
    if settings.GROQ_API_KEY or settings.GROQ_API_KEY_TWO or settings.GEMINI_API_KEY or settings.OPENAI_API_KEY:
        try:
            return _generate_llm_response(triage_result, rag_chunks, conversation_summary)
        except Exception as e:
            logger.error(f"LLM response generation failed: {e}. Falling back to templated response.")
            return _generate_fallback_response(triage_result, rag_chunks, conversation_summary)
    else:
        return _generate_fallback_response(triage_result, rag_chunks, conversation_summary)

def _generate_llm_response(
    triage_result: TriageResult,
    rag_chunks: List[Dict[str, Any]],
    conversation_summary: Dict[str, Any]
) -> Tuple[str, List[Dict[str, str]]]:
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
            "model": "llama3-8b-8192"
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

    # Format RAG Context
    context_str = ""
    citations_mapping = []
    for i, chunk in enumerate(rag_chunks, 1):
        source = chunk.get("source", "Unknown Source")
        title = chunk.get("title", source)
        content = chunk.get("content_chunk", "")
        context_str += f"[{i}] Source: {title}\nExcerpt: {content}\n\n"
        citations_mapping.append({"source": title, "excerpt": content})

    # Format Triage Result
    triage_str = f"Risk Level: {triage_result.risk_level.upper()}\n"
    triage_str += f"Recommended Specialist: {triage_result.recommended_specialist}\n"
    if hasattr(triage_result, "score_breakdown"):
        triage_str += f"Score Breakdown: {json.dumps(triage_result.score_breakdown)}\n"

    # Format Conversation Summary
    # prevent prompt injection by escaping/quoting input safely
    symptoms = ", ".join(conversation_summary.get("symptoms", []))
    severity = conversation_summary.get("severity", "unknown")
    duration = conversation_summary.get("duration", "unknown").replace('"', "'")
    history = conversation_summary.get("history", "none").replace('"', "'")
    
    conv_str = f"Symptoms: {symptoms}\nSeverity: {severity}/10\nDuration: {duration}\nHistory: {history}\n"

    system_prompt = (
        "You are a triage assistant. You do not diagnose. You summarise risk and recommend "
        "next steps based only on the provided context."
    )

    user_prompt = f"""
    Please generate a 150–250 word response to the patient.
    - Cite sources inline using the format [Source: Title].
    - End the response with exactly this text: "{DISCLAIMER.strip()}"
    - Do not speculate beyond the provided context.

    ### Retrieved Medical Context
    {context_str}

    ### Triage Result
    {triage_str}

    ### Patient Conversation Summary
    {conv_str}
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
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.0
            )
            
            response_text = response.choices[0].message.content.strip()
            
            # Ensure disclaimer is present
            if DISCLAIMER.strip() not in response_text:
                if DISCLAIMER.strip().replace("*", "") not in response_text:
                    response_text += DISCLAIMER

            return response_text, citations_mapping
        except Exception as e:
            logger.error(f"LLM API Call failed for model {config['model']}: {e}")
            last_exception = e
            continue

    if last_exception:
        raise last_exception

    return _generate_fallback_response(triage_result, rag_chunks, conversation_summary)

def _generate_fallback_response(
    triage_result: TriageResult,
    rag_chunks: List[Dict[str, Any]],
    conversation_summary: Dict[str, Any]
) -> Tuple[str, List[Dict[str, str]]]:
    
    symptoms = ", ".join(conversation_summary.get("symptoms", [])) or "not specified"
    severity = conversation_summary.get("severity", "unknown")
    duration = conversation_summary.get("duration", "unknown")
    level = triage_result.risk_level.upper()
    specialist = triage_result.recommended_specialist

    chunk_info = "None available"
    citations_list = []
    if rag_chunks:
        first_chunk = rag_chunks[0]
        source = first_chunk.get("title") or first_chunk.get("source", "Unknown")
        excerpt = first_chunk.get("content_chunk", "...")
        chunk_info = f"{excerpt[:100]}... — {source}"
        citations_list.append({"source": source, "excerpt": excerpt})

    text = (
        f"Based on your reported symptoms [{symptoms}] with severity [{severity}]/10 over [{duration}], "
        f"your risk level is assessed as [{level}]. "
        f"Relevant information: [{chunk_info}]. "
        f"Recommended next step: consult a [{specialist}]."
    )
    
    text += DISCLAIMER
    
    return text, citations_list
