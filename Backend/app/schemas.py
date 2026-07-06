from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, field_validator


# ── Employees ────────────────────────────────────────────────────────────────

class EmployeeResponse(BaseModel):
    employee_id: str
    name: str
    company_name: str

    model_config = ConfigDict(from_attributes=True)


# ── Vendors ───────────────────────────────────────────────────────────────────

class VendorResponse(BaseModel):
    vendor_id: str
    company_name: str
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ── RFPs ──────────────────────────────────────────────────────────────────────

RFPStatus = Literal["draft", "inProgress", "closed"]


class RFPCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[date] = None
    status: Optional[RFPStatus] = "draft"
    employee_id: str
    category: Optional[str] = "General"

    # Structured sections
    objective: Optional[str] = None
    scope_of_work: Optional[str] = None
    technical_criteria: Optional[str] = None
    commercials: Optional[str] = None
    project_delivery: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def validate_status(cls, v):
        allowed = {"draft", "inProgress", "closed"}
        if v not in allowed:
            raise ValueError(f"status must be one of {sorted(allowed)}")
        return v


class RFPResponse(BaseModel):
    rfp_id: str
    title: str
    description: Optional[str]
    date_created: Optional[str] = None   # formatted: "May 18, 2026"
    deadline: Optional[date]
    file_path: Optional[str]
    status: str
    employee_id: str
    company_name: Optional[str] = None
    company_id: Optional[str] = None
    category: Optional[str]
    vendors_matched: int = 0             # count of proposals submitted for this RFP
    winner_vendor_id: Optional[str] = None

    # Structured sections
    objective: Optional[str]
    scope_of_work: Optional[str]
    technical_criteria: Optional[str]
    commercials: Optional[str]
    project_delivery: Optional[str]

    model_config = ConfigDict(from_attributes=True)


class RFPUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[RFPStatus] = None
    objective: Optional[str] = None
    scope_of_work: Optional[str] = None
    technical_criteria: Optional[str] = None
    commercials: Optional[str] = None
    project_delivery: Optional[str] = None


class CloseRFPRequest(BaseModel):
    winner_vendor_id: Optional[str] = None


class SendToVendorsRequest(BaseModel):
    vendor_ids: List[str]


# ── Proposals ─────────────────────────────────────────────────────────────────

class ProposalResponse(BaseModel):
    proposal_id: str
    name: str
    description: Optional[str]
    upload_date: datetime
    ai_score: Optional[float]
    file_path: Optional[str]
    rfp_id: str
    vendor_id: str
    vendor_name: Optional[str] = None
    rfp_title: Optional[str] = None

    # AI breakdown — same attribute names as RFP sections
    objective: Optional[str]
    scope_of_work: Optional[str]
    technical_criteria: Optional[str]
    commercials: Optional[str]
    project_delivery: Optional[str]
    price: Optional[str]
    timeline: Optional[str]

    model_config = ConfigDict(from_attributes=True)
