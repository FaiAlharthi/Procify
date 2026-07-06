from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db

router = APIRouter(prefix="/employees", tags=["Employees"])


@router.get("/{employee_id}")
def get_employee(employee_id: str, db: Session = Depends(get_db)):
    e = db.query(models.Employee).filter(models.Employee.employee_id == employee_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {
        "employee_id": e.employee_id,
        "name": e.name,
        "company_name": e.company_name,
        "company_id": e.company_id or "C0001",
    }
