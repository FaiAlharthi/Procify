import os
import shutil
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pypdf import PdfReader
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import models, schemas
from app.ai_service import analyze_proposal_with_ai
from app.auth import require_vendor
from app.database import get_db

router = APIRouter(prefix="/proposals", tags=["Proposals"])

UPLOAD_FOLDER = "uploads/proposals"


def _next_proposal_id(db: Session) -> str:
    count = db.query(models.Proposal).count()
    return f"P{str(count + 1).zfill(4)}"


def _rfp_text(rfp: models.RFP) -> str:
    """Build a rich context string from the RFP's structured sections."""
    parts = [
        ("Objective", rfp.objective),
        ("Scope of Work", rfp.scope_of_work),
        ("Technical Criteria", rfp.technical_criteria),
        ("Commercials", rfp.commercials),
        ("Project Delivery", rfp.project_delivery),
    ]
    body = "\n\n".join(f"{label}:\n{val}" for label, val in parts if val)
    return body or rfp.description or rfp.title


def _serialize(proposal: models.Proposal) -> schemas.ProposalResponse:
    data = {c.name: getattr(proposal, c.name) for c in proposal.__table__.columns}
    data["ai_score"] = float(data["ai_score"]) if data["ai_score"] is not None else None
    data["vendor_name"] = proposal.vendor.company_name if proposal.vendor else "Unknown"
    data["rfp_title"] = proposal.rfp.title if proposal.rfp else None
    return schemas.ProposalResponse.model_validate(data)


@router.post(
    "/analyze/{rfp_id}",
    response_model=schemas.ProposalResponse,
    status_code=status.HTTP_201_CREATED,
)
def analyze_proposal(
    rfp_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(require_vendor),
):
    vendor_id = current_user["sub"]

    rfp = db.query(models.RFP).filter(models.RFP.rfp_id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    existing = (
        db.query(models.Proposal)
        .filter(models.Proposal.rfp_id == rfp_id, models.Proposal.vendor_id == vendor_id)
        .first()
    )

    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    with open(file_path, "wb") as buf:
        shutil.copyfileobj(file.file, buf)

    reader = PdfReader(file_path)
    proposal_text = "".join(
        page.extract_text() + "\n"
        for page in reader.pages
        if page.extract_text()
    )
    if not proposal_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract text from PDF. The file may be scanned or image-based.")

    try:
        ai = analyze_proposal_with_ai(rfp_text=_rfp_text(rfp), proposal_text=proposal_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI analysis failed: {e}")

    ai_title = ai.get("title") or rfp.title

    if existing:
        # Update the existing proposal in place.
        existing.name = f"{vendor.company_name} - {ai_title} - {existing.proposal_id}"
        existing.description = ai.get("objective", "")
        existing.file_path = file_path
        existing.ai_score = float(ai.get("ai_score", 0))
        existing.objective = ai.get("objective", "")
        existing.scope_of_work = ai.get("scope_of_work", "")
        existing.technical_criteria = ai.get("technical_criteria", "")
        existing.commercials = ai.get("commercials", "")
        existing.project_delivery = ai.get("project_delivery", "")
        existing.price = ai.get("price", "")
        existing.timeline = ai.get("timeline", "")
        db.commit()
        db.refresh(existing)
        return _serialize(existing)

    proposal_id = _next_proposal_id(db)
    proposal = models.Proposal(
        proposal_id=proposal_id,
        name=f"{vendor.company_name} - {ai_title} - {proposal_id}",
        description=ai.get("objective", ""),
        file_path=file_path,
        rfp_id=rfp_id,
        vendor_id=vendor_id,
        ai_score=float(ai.get("ai_score", 0)),
        objective=ai.get("objective", ""),
        scope_of_work=ai.get("scope_of_work", ""),
        technical_criteria=ai.get("technical_criteria", ""),
        commercials=ai.get("commercials", ""),
        project_delivery=ai.get("project_delivery", ""),
        price=ai.get("price", ""),
        timeline=ai.get("timeline", ""),
    )

    try:
        db.add(proposal)
        db.commit()
        db.refresh(proposal)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Proposal submission conflict. Please try again.")

    return _serialize(proposal)


@router.get("/", response_model=List[schemas.ProposalResponse])
def get_proposals(rfp_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Proposal)
    if rfp_id is not None:
        query = query.filter(models.Proposal.rfp_id == rfp_id)
    proposals = query.order_by(models.Proposal.upload_date.asc()).all()
    return [_serialize(p) for p in proposals]


@router.get("/{proposal_id}/file")
def get_proposal_file(proposal_id: str, db: Session = Depends(get_db)):
    proposal = db.query(models.Proposal).filter(models.Proposal.proposal_id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    if not proposal.file_path or not os.path.exists(proposal.file_path):
        raise HTTPException(status_code=404, detail="Proposal file not found on disk")
    return FileResponse(
        proposal.file_path,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=Proposal_{proposal_id}.pdf"},
    )
