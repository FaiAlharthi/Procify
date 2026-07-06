from datetime import date, datetime, timezone

from sqlalchemy import (
    Column, Date, DateTime, ForeignKey,
    Numeric, String, Text, UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base

RFP_STATUSES = {"draft", "inProgress", "closed"}


class Employee(Base):
    __tablename__ = "employee"

    employee_id = Column(String(10), primary_key=True)
    name = Column(String(50), nullable=False)
    company_name = Column(String(50), nullable=False, default="Procify Corp")
    company_id = Column(String(10), nullable=True, default="C0001")
    password = Column(String(255), nullable=False)

    rfps = relationship("RFP", back_populates="employee")


class Vendor(Base):
    __tablename__ = "vendor"

    vendor_id = Column(String(10), primary_key=True)
    company_name = Column(String(50), nullable=False)
    password = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    proposals = relationship("Proposal", back_populates="vendor")


class RFP(Base):
    __tablename__ = "rfp"

    rfp_id = Column(String(10), primary_key=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    date_created = Column(Date, nullable=False, default=date.today)
    deadline = Column(Date, nullable=False)
    file_path = Column(String(255))
    status = Column(String(20), nullable=False, default="draft")
    employee_id = Column(String(10), ForeignKey("employee.employee_id"), nullable=False)
    category = Column(String(50))

    objective = Column(Text)
    scope_of_work = Column(Text)
    technical_criteria = Column(Text)
    commercials = Column(Text)
    project_delivery = Column(Text)

    winner_vendor_id = Column(String(10), ForeignKey("vendor.vendor_id"), nullable=True)

    employee = relationship("Employee", back_populates="rfps")
    proposals = relationship("Proposal", back_populates="rfp")
    winner = relationship("Vendor", foreign_keys=[winner_vendor_id])


class RFPVendor(Base):
    __tablename__ = "rfp_vendor"

    rfp_id = Column(String(10), ForeignKey("rfp.rfp_id"), primary_key=True)
    vendor_id = Column(String(10), ForeignKey("vendor.vendor_id"), primary_key=True)


class Proposal(Base):
    __tablename__ = "proposal"
    __table_args__ = (
        UniqueConstraint("rfp_id", "vendor_id", name="uq_proposal_rfp_vendor"),
    )

    proposal_id = Column(String(10), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    upload_date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    ai_score = Column(Numeric(5, 2))
    file_path = Column(String(255))
    rfp_id = Column(String(10), ForeignKey("rfp.rfp_id"), nullable=False)
    vendor_id = Column(String(10), ForeignKey("vendor.vendor_id"), nullable=False)

    objective = Column(Text)
    scope_of_work = Column(Text)
    technical_criteria = Column(Text)
    commercials = Column(Text)
    project_delivery = Column(Text)
    price = Column(String(255))
    timeline = Column(String(255))

    rfp = relationship("RFP", back_populates="proposals")
    vendor = relationship("Vendor", back_populates="proposals")
