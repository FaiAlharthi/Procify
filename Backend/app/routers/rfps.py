from datetime import date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from fpdf import FPDF

from app import models, schemas
from app.auth import require_employee
from app.database import get_db

router = APIRouter(prefix="/rfps", tags=["RFPs"])


def _next_rfp_id(db: Session) -> str:
    from sqlalchemy import func
    max_id = db.query(func.max(models.RFP.rfp_id)).scalar()
    if max_id is None:
        return "R0001"
    return f"R{str(int(max_id[1:]) + 1).zfill(4)}"


def _fmt_date(d) -> Optional[str]:
    if d is None:
        return None
    return f"{d.strftime('%B')} {d.day}, {d.strftime('%Y')}"


def _serialize_rfp(rfp: models.RFP) -> schemas.RFPResponse:
    data = {c.name: getattr(rfp, c.name) for c in rfp.__table__.columns}
    data["date_created"] = _fmt_date(data.get("date_created"))
    data["vendors_matched"] = len(rfp.proposals)
    data["company_name"] = rfp.employee.company_name if rfp.employee else None
    data["company_id"] = rfp.employee.company_id if rfp.employee else None
    return schemas.RFPResponse.model_validate(data)


@router.post("/", response_model=schemas.RFPResponse, status_code=status.HTTP_201_CREATED)
def create_rfp(rfp: schemas.RFPCreate, db: Session = Depends(get_db), _: dict = Depends(require_employee)):
    sections = [
        ("Objective", rfp.objective),
        ("Scope of Work", rfp.scope_of_work),
        ("Technical Criteria", rfp.technical_criteria),
        ("Commercials", rfp.commercials),
        ("Project Delivery", rfp.project_delivery),
    ]
    combined = "\n\n".join(f"{label}:\n{val}" for label, val in sections if val)

    new_rfp = models.RFP(
        rfp_id=_next_rfp_id(db),
        title=rfp.title,
        description=combined or rfp.description or rfp.title,
        date_created=date.today(),
        deadline=rfp.deadline or (date.today() + timedelta(days=30)),
        status=rfp.status or "draft",
        employee_id=rfp.employee_id,
        category=rfp.category or "General",
        objective=rfp.objective,
        scope_of_work=rfp.scope_of_work,
        technical_criteria=rfp.technical_criteria,
        commercials=rfp.commercials,
        project_delivery=rfp.project_delivery,
    )
    db.add(new_rfp)
    db.commit()
    db.refresh(new_rfp)
    return _serialize_rfp(new_rfp)


@router.get("/", response_model=List[schemas.RFPResponse])
def get_rfps(vendor_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.RFP).order_by(models.RFP.deadline.asc())
    if vendor_id:
        invited_ids = (
            db.query(models.RFPVendor.rfp_id)
            .filter(models.RFPVendor.vendor_id == vendor_id)
            .subquery()
        )
        query = query.filter(models.RFP.rfp_id.in_(invited_ids))
    return [_serialize_rfp(r) for r in query.all()]


def _build_rfp_pdf(rfp: models.RFP) -> bytes:
    pdf = FPDF(format="A4")
    pdf.set_margins(20, 20, 20)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=20)

    # Header
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_text_color(45, 27, 78)
    pdf.multi_cell(0, 10, rfp.title or "Untitled RFP")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(100, 100, 120)
    created = rfp.date_created.strftime("%B %d, %Y") if rfp.date_created else "N/A"
    deadline = rfp.deadline.strftime("%B %d, %Y") if rfp.deadline else "N/A"
    pdf.cell(0, 6, f"RFP ID: {rfp.rfp_id}   |   Status: {rfp.status}   |   Created: {created}   |   Deadline: {deadline}",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(4)

    # Divider
    pdf.set_draw_color(220, 215, 240)
    pdf.set_line_width(0.5)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
    pdf.ln(8)

    sections = [
        ("Objective", rfp.objective),
        ("Scope of Work", rfp.scope_of_work),
        ("Technical Criteria", rfp.technical_criteria),
        ("Commercials", rfp.commercials),
        ("Project Delivery", rfp.project_delivery),
    ]

    for label, content in sections:
        if not content:
            continue
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(45, 27, 78)
        pdf.cell(0, 8, label, new_x="LMARGIN", new_y="NEXT")

        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(40, 40, 55)
        pdf.multi_cell(0, 6, content)
        pdf.ln(6)

    return bytes(pdf.output())


@router.patch("/{rfp_id}", response_model=schemas.RFPResponse)
def update_rfp(
    rfp_id: str,
    body: schemas.RFPUpdate,
    db: Session = Depends(get_db),
    _: dict = Depends(require_employee),
):
    rfp = db.query(models.RFP).filter(models.RFP.rfp_id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(rfp, field, value)

    # Rebuild the combined description from current sections
    sections = [
        ("Objective", rfp.objective),
        ("Scope of Work", rfp.scope_of_work),
        ("Technical Criteria", rfp.technical_criteria),
        ("Commercials", rfp.commercials),
        ("Project Delivery", rfp.project_delivery),
    ]
    combined = "\n\n".join(f"{label}:\n{val}" for label, val in sections if val)
    if combined:
        rfp.description = combined

    db.commit()
    db.refresh(rfp)
    return _serialize_rfp(rfp)


@router.post("/{rfp_id}/send-to-vendors", status_code=status.HTTP_204_NO_CONTENT)
def send_to_vendors(
    rfp_id: str,
    body: schemas.SendToVendorsRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_employee),
):
    rfp = db.query(models.RFP).filter(models.RFP.rfp_id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    db.query(models.RFPVendor).filter(models.RFPVendor.rfp_id == rfp_id).delete()
    for vid in body.vendor_ids:
        db.add(models.RFPVendor(rfp_id=rfp_id, vendor_id=vid))
    db.commit()


@router.get("/{rfp_id}/pdf")
def get_rfp_pdf(rfp_id: str, db: Session = Depends(get_db)):
    rfp = db.query(models.RFP).filter(models.RFP.rfp_id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    pdf_bytes = _build_rfp_pdf(rfp)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=RFP_{rfp_id}.pdf"},
    )


@router.delete("/{rfp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rfp(
    rfp_id: str,
    db: Session = Depends(get_db),
    _: dict = Depends(require_employee),
):
    rfp = db.query(models.RFP).filter(models.RFP.rfp_id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    if rfp.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft RFPs can be deleted")
    db.delete(rfp)
    db.commit()


@router.patch("/{rfp_id}/close", response_model=schemas.RFPResponse)
def close_rfp(
    rfp_id: str,
    body: schemas.CloseRFPRequest,
    db: Session = Depends(get_db),
    _: dict = Depends(require_employee),
):
    rfp = db.query(models.RFP).filter(models.RFP.rfp_id == rfp_id).first()
    if not rfp:
        raise HTTPException(status_code=404, detail="RFP not found")
    rfp.status = "closed"
    if body.winner_vendor_id:
        rfp.winner_vendor_id = body.winner_vendor_id
    db.commit()
    db.refresh(rfp)
    return _serialize_rfp(rfp)
