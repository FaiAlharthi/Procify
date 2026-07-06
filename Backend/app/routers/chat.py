import re

import requests
from fastapi import APIRouter
from pydantic import BaseModel

from app.rag_service import search_documents

router = APIRouter(prefix="/chat", tags=["Chat"])

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:7b"

FIELD_LABELS = {
    "objective": "Objective",
    "scope": "Scope of Work",
    "technical": "Technical Criteria",
    "commercial": "Commercial Template",
    "delivery": "Project Delivery & Deadline",
}

UPDATE_PATTERN = re.compile(r"\[UPDATE:(\w+)\](.*?)\[/UPDATE\]", re.DOTALL)


class ChatRequest(BaseModel):
    message: str
    rfp_context: dict = {}


def _build_rfp_context(ctx: dict) -> str:
    parts = []
    if ctx.get("title"):
        parts.append(f"Project Title: {ctx['title']}")
    for key, label in FIELD_LABELS.items():
        val = ctx.get(key)
        if val:
            parts.append(f"{label}:\n{val}")
    return "\n\n".join(parts)


@router.post("/")
def chat(req: ChatRequest):
    rfp_text = _build_rfp_context(req.rfp_context)
    rag_context = search_documents(req.message)

    rag_section = (
        f"\nRelevant Procurement Knowledge:\n{rag_context}\n" if rag_context else ""
    )

    prompt = f"""You are a procurement expert AI helping to write and enhance RFP (Request for Proposal) documents.

Current RFP Draft:
{rfp_text if rfp_text else "(No content written yet)"}
{rag_section}
User: {req.message}

Instructions:
- Give concise, professional suggestions to improve the RFP.
- If you want to update a specific field, append it at the end using this exact format:
[UPDATE:field_name]
new content here
[/UPDATE]
- Available field names: objective, scope, technical, commercial, delivery
- Only include UPDATE blocks when you are explicitly suggesting new content for a field.
- Never include UPDATE blocks in your conversational reply text.
- Be specific and professional, focused on procurement best practices."""

    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=90,
        )
        response.raise_for_status()
        raw = response.json().get("response", "I could not generate a response.")

        updates = {}
        for match in UPDATE_PATTERN.finditer(raw):
            field = match.group(1).strip()
            content = match.group(2).strip()
            if field in FIELD_LABELS:
                updates[field] = content

        clean = UPDATE_PATTERN.sub("", raw).strip()
        return {"response": clean, "updates": updates}

    except Exception as exc:
        return {"response": f"AI service unavailable: {exc}", "updates": {}}
