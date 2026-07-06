import json
import requests

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5:7b"


def analyze_proposal_with_ai(rfp_text: str, proposal_text: str) -> dict:
    prompt = f"""You are an AI procurement evaluator. Read the RFP and the PROPOSAL carefully, then score how well the proposal matches the RFP requirements.

SCORING RUBRIC (total 100 points):
- Objective: 20 pts — Does the proposal address the RFP's stated objective?
- Scope of Work:       20 pts — Does the proposal cover all work described in the RFP scope?
- Technical Criteria:  25 pts — Does the proposal meet the specific technical requirements?
- Commercials:         15 pts — Is the pricing and contract structure aligned with the RFP?
- Project Delivery:    20 pts — Does the timeline and delivery plan match the RFP expectations?

Add up the points you award across all five criteria to get the final ai_score.
A strong, well-aligned proposal should score 70–90. A partial match scores 40–69. A poor match scores below 40.

IMPORTANT: You must compute a real score based on the actual content. Do NOT return 0 unless the proposal is completely irrelevant to the RFP.

Return ONLY valid JSON with no markdown or extra text. Fill in every field with your analysis:

{{
  "title": "short descriptive title for this proposal",
  "vendor_name": "vendor or company name from the proposal",
  "ai_score": 75,
  "objective": "one paragraph: how well the proposal aligns with the RFP objective",
  "scope_of_work": "one paragraph: how well the proposal covers the RFP scope",
  "technical_criteria": "one paragraph: how well the proposal meets technical requirements",
  "commercials": "one paragraph: how pricing and terms align with the RFP",
  "project_delivery": "one paragraph: how well the timeline and delivery match the RFP",
  "price": "exact price or budget from the proposal, or Not specified",
  "timeline": "delivery duration from the proposal, or Not specified"
}}

Replace ai_score (currently shown as 75) with your actual computed score. Replace all other field values with your real analysis.

RFP TEXT:
{rfp_text}

PROPOSAL TEXT:
{proposal_text}"""

    response = requests.post(
        OLLAMA_URL,
        json={
            "model": MODEL_NAME,
            "prompt": prompt,
            "stream": False,
            "format": "json",
        },
        timeout=120,
    )
    response.raise_for_status()
    return json.loads(response.json()["response"])
