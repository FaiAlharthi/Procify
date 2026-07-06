from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("/")
def get_vendors(db: Session = Depends(get_db)):
    vendors = db.query(models.Vendor).all()
    return [
        {
            "vendor_id": v.vendor_id,
            "company_name": v.company_name,
            "description": v.description,
        }
        for v in vendors
    ]


@router.get("/{vendor_id}")
def get_vendor(vendor_id: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    v = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return {
        "vendor_id": v.vendor_id,
        "company_name": v.company_name,
        "description": v.description,
    }
