import json
import os
import re
import time
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

load_dotenv(dotenv_path=Path(__file__).resolve().parents[2] / ".env")

router = APIRouter(tags=["AI Vendor Suggestions"])

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
# Primary model + ordered fallbacks tried when primary returns 503
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-flash-lite-latest", "gemini-2.0-flash", "gemini-2.0-flash-lite"]


def _rfp_context(rfp: models.RFP) -> str:
    parts = [f"Title: {rfp.title}"]
    for label, val in [
        ("Objective", rfp.objective),
        ("Scope of Work", rfp.scope_of_work),
        ("Technical Criteria", rfp.technical_criteria),
        ("Commercials", rfp.commercials),
        ("Project Delivery", rfp.project_delivery),
    ]:
        if val:
            parts.append(f"{label}:\n{val}")
    if rfp.description:
        parts.append(f"Description:\n{rfp.description}")
    return "\n\n".join(parts)


def _extract_json(text: str) -> dict:
    cleaned = text.strip().replace("```json", "").replace("```", "").strip()
    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        raise ValueError("Gemini did not return valid JSON")
    return json.loads(match.group(0))


def _call_gemini_model(model: str, api_key: str, prompt: str) -> requests.Response:
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{model}:generateContent"
    )
    return requests.post(
        url,
        headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
        json={
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        },
        timeout=45,
    )


def _call_gemini(rfp_text: str, vendors: list[dict]) -> list[dict]:
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Add it to Backend/.env",
        )

    vendors_payload = [
        {
            "vendor_id": v["vendor_id"],
            "company_name": v["company_name"],
            "description": v["description"] or "",
        }
        for v in vendors
    ]

    prompt = f"""
You are an AI procurement assistant for an RFP management system.

Task:
Analyze the RFP content and compare it semantically against the vendor descriptions.
Recommend only the vendors that are genuinely suitable for this RFP.

Important rules:
- Do not use keyword-only matching.
- Understand the business requirement semantically.
- Give higher scores to vendors whose capabilities strongly match the RFP.
- Exclude vendors that are not relevant.
- Score must be from 0 to 100.
- Return valid JSON only. No markdown. No explanation outside JSON.

RFP CONTENT:
{rfp_text[:25000]}

VENDORS:
{json.dumps(vendors_payload, ensure_ascii=False)}

Return exactly this JSON structure:

{{
  "suggested_vendors": [
    {{
      "vendor_id": "V0001",
      "company_name": "Vendor Name",
      "match_score": 95,
      "match_reasons": [
        "Clear reason 1",
        "Clear reason 2",
        "Clear reason 3"
      ]
    }}
  ]
}}
"""

    # Try primary model with up to 3 retries on 503, then fallback models
    models_to_try = [GEMINI_MODEL] + GEMINI_FALLBACK_MODELS
    last_error = None

    for model in models_to_try:
        for attempt in range(3):
            response = _call_gemini_model(model, GEMINI_API_KEY, prompt)

            if response.status_code == 200:
                try:
                    gemini_text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                    return _extract_json(gemini_text).get("suggested_vendors", [])
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to parse Gemini response: {e}")

            if response.status_code == 503:
                last_error = response.text
                # Exponential backoff: 1s, 2s, 4s — then try next model
                if attempt < 2:
                    time.sleep(2 ** attempt)
                continue

            if response.status_code in (429, 404):
                # 429 = quota exhausted, 404 = model unavailable — skip to next fallback
                last_error = response.text
                break

            # Any other error (4xx etc.) — don't retry
            raise HTTPException(status_code=500, detail=f"Gemini API error: {response.text}")

        # All retries on this model exhausted — move to next fallback

    raise HTTPException(
        status_code=503,
        detail=f"AI service temporarily unavailable. All Gemini models are overloaded. Please try again in a moment. Last error: {last_error}",
    )


@router.get("/rfps/{rfp_id}/suggested-vendors")
def get_suggested_vendors(rfp_id: str, db: Session = Depends(get_db)):
    rfp = db.query(models.RFP).filter(models.RFP.rfp_id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    vendors = db.query(models.Vendor).all()
    vendor_list = [
        {"vendor_id": v.vendor_id, "company_name": v.company_name, "description": v.description}
        for v in vendors
    ]

    rfp_text = _rfp_context(rfp)
    suggestions = _call_gemini(rfp_text, vendor_list)

    valid_ids = {v["vendor_id"] for v in vendor_list}
    result = []
    for item in suggestions:
        vid = item.get("vendor_id")
        if vid not in valid_ids:
            continue
        result.append({
            "vendor_id": vid,
            "company_name": item.get("company_name", ""),
            "match_score": int(item.get("match_score", 0)),
            "match_reasons": item.get("match_reasons", []),
        })

    result.sort(key=lambda x: x["match_score"], reverse=True)
    return {
        "rfp_id": rfp_id,
        "rfp_title": rfp.title,
        "suggested_vendors": result[:5],
    }
