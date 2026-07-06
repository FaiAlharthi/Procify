from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app import models
from app.auth import create_access_token, verify_password
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    user_id: str
    password: str
    role: str  # "employee" | "vendor"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    name: str
    company_name: str = ""
    company_id: str = ""


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    company_name = ""
    company_id = ""

    if req.role == "employee":
        user = db.query(models.Employee).filter(models.Employee.employee_id == req.user_id).first()
        if not user or not verify_password(req.password, user.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        name = user.name
        company_name = user.company_name or "Procify Corp"
        company_id = user.company_id or "C0001"

    elif req.role == "vendor":
        user = db.query(models.Vendor).filter(models.Vendor.vendor_id == req.user_id).first()
        if not user or not verify_password(req.password, user.password):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        name = user.company_name

    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Role must be 'employee' or 'vendor'")

    token = create_access_token({"sub": req.user_id, "role": req.role, "name": name})
    return TokenResponse(
        access_token=token, role=req.role, user_id=req.user_id,
        name=name, company_name=company_name, company_id=company_id,
    )
