import os
from datetime import date, datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import SessionLocal
from app.routers import auth, chat, employees, proposals, rfps, vendor_suggestions, vendors

_VENDOR_DESCRIPTIONS = {
    "V0001": "Global technology company specializing in consumer electronics, premium hardware, and innovative software ecosystems.",
    "V0002": "Leading provider of personal computers, enterprise printers, and end-to-end IT hardware solutions for businesses worldwide.",
    "V0003": "Multinational electronics manufacturer offering reliable and affordable laptops, desktops, and professional display solutions.",
    "V0004": "Pioneer in cloud computing platforms, enterprise productivity software, and AI-driven digital transformation services.",
    "V0005": "Global consulting and technology firm delivering deep expertise in AI, hybrid cloud infrastructure, and enterprise process optimization.",
    "V0006": "World-leading networking and cybersecurity company providing advanced infrastructure, connectivity, and secure communications solutions.",
    "V0007": "Enterprise cloud platform and database technology provider, specializing in scalable business applications and data management.",
    "V0008": "End-to-end technology solutions provider offering high-performance servers, storage systems, and managed IT services for enterprises.",
    "V0009": "Industry-leading CRM and cloud software platform driving customer engagement, sales automation, and business growth at scale.",
    "V0010": "Global leader in enterprise resource planning and intelligent business solutions, enabling digital transformation across industries.",
    "V0011": "Leading cloud data analytics and machine learning training platform specializing in data engineering, AI solutions, and enterprise workforce upskilling.",
}
app = FastAPI(
    title="Procify API",
    description="Procurement management system",
    version="0.2.0",
)

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(rfps.router)
app.include_router(proposals.router)
app.include_router(vendors.router)
app.include_router(vendor_suggestions.router)
app.include_router(chat.router)

os.makedirs("uploads/proposals", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


def seed_db():
    from app import models
    from app.auth import hash_password

    db = SessionLocal()
    try:
        if db.query(models.Employee).count() > 0:
            return  # already seeded

        # ── Employees ──────────────────────────────────────────────────────
        hashed = hash_password("1234")

        employees = [
            ("E0001", "Bahy"),
            ("E0002", "Fai"),
            ("E0003", "Shouq"),
            ("E0004", "Rana"),
            ("E0005", "Abrar"),
            ("E0006", "Zahy"),
            ("E0007", "Rizzwan"),
        ]
        for eid, name in employees:
            db.add(models.Employee(employee_id=eid, name=name, company_name="Saudi Digital Academy", company_id="C0001", password=hashed))

        # ── Vendors ────────────────────────────────────────────────────────
        vendors = [
            ("V0001", "Apple",      _VENDOR_DESCRIPTIONS["V0001"]),
            ("V0002", "HP",         _VENDOR_DESCRIPTIONS["V0002"]),
            ("V0003", "Acer",       _VENDOR_DESCRIPTIONS["V0003"]),
            ("V0004", "Microsoft",  _VENDOR_DESCRIPTIONS["V0004"]),
            ("V0005", "IBM",        _VENDOR_DESCRIPTIONS["V0005"]),
            ("V0006", "Cisco",      _VENDOR_DESCRIPTIONS["V0006"]),
            ("V0007", "Oracle",     _VENDOR_DESCRIPTIONS["V0007"]),
            ("V0008", "Dell",       _VENDOR_DESCRIPTIONS["V0008"]),
            ("V0009", "Salesforce",  _VENDOR_DESCRIPTIONS["V0009"]),
            ("V0010", "SAP",         _VENDOR_DESCRIPTIONS["V0010"]),
            ("V0011", "WeCloudData", _VENDOR_DESCRIPTIONS["V0011"]),
        ]
        for vid, company, desc in vendors:
            db.add(models.Vendor(vendor_id=vid, company_name=company, password=hashed, description=desc))

        db.flush()  # so FKs resolve for RFPs and Proposals below

        # ── RFPs ───────────────────────────────────────────────────────────
        rfp_rows = [
            {
                "rfp_id": "R0001", "title": "Laptops Rental",
                "date_created": date(2026, 5, 10), "deadline": date(2026, 7, 16),
                "status": "inProgress", "employee_id": "E0001", "category": "Hardware",
                "objective": "Procure 50 laptops for company operations with modern specs.",
                "scope_of_work": "Supply, deliver, and configure 50 laptops within 30 days.",
                "technical_criteria": "Intel Core i7 or above, 16GB RAM, 512GB SSD, Windows 11 Pro.",
                "commercials": "Fixed-price contract. Delivery within 30 days. Warranty: 2 years.",
                "project_delivery": "Delivery by July 16, 2026. Milestone: full setup by August 1.",
            },
            {
                "rfp_id": "R0002", "title": "Cloud Migration Project",
                "date_created": date(2026, 5, 18), "deadline": date(2026, 8, 1),
                "status": "inProgress", "employee_id": "E0002", "category": "Cloud",
                "objective": "Migrate all company systems to a cloud infrastructure with zero downtime.",
                "scope_of_work": "Assessment, planning, migration, and 12 months of managed support.",
                "technical_criteria": "Multi-region failover, Terraform IaC, zero-trust networking.",
                "commercials": "Budget ceiling $125,000. Milestone-based billing.",
                "project_delivery": "Kickoff Aug 1, 2026. Go-live Dec 1, 2026.",
            },
            {
                "rfp_id": "R0003", "title": "Enterprise Consulting Services",
                "date_created": date(2026, 5, 25), "deadline": date(2026, 9, 1),
                "status": "inProgress", "employee_id": "E0003", "category": "Consulting",
                "objective": "Optimize business processes and deliver strategic consulting services.",
                "scope_of_work": "Process audit, gap analysis, recommendations, and implementation support.",
                "technical_criteria": "ISO 9001 certified, proven enterprise transformation experience.",
                "commercials": "Budget up to $210,000. Time-and-material contract.",
                "project_delivery": "Kickoff Sep 1, 2026. Final report by Dec 31, 2026.",
            },
        ]
        for row in rfp_rows:
            desc = "\n\n".join(
                f"{label}:\n{row[key]}"
                for label, key in [
                    ("Objective", "objective"), ("Scope of Work", "scope_of_work"),
                    ("Technical Criteria", "technical_criteria"), ("Commercials", "commercials"),
                    ("Project Delivery", "project_delivery"),
                ]
                if row.get(key)
            )
            db.add(models.RFP(description=desc, **row))

        db.flush()

        # ── Proposals ──────────────────────────────────────────────────────
        upload_dt = datetime(2026, 6, 14, 10, 22, 38, tzinfo=timezone.utc)
        proposal_rows = [
            # (pid, vendor_id, rfp_id, ai_title, price, timeline)
            ("P0001", "V0001", "R0001", "Laptop Supply & Deployment Proposal",       "$50,000",  "30 days"),
            ("P0002", "V0002", "R0001", "Enterprise Laptop Procurement Proposal",    "$48,000",  "25 days"),
            ("P0003", "V0003", "R0001", "Budget Laptop Rental Proposal",             "$45,000",  "35 days"),
            ("P0004", "V0008", "R0001", "Premium Hardware Supply Proposal",          "$52,000",  "28 days"),
            ("P0005", "V0004", "R0002", "Cloud Infrastructure Migration Proposal",   "$120,000", "45 days"),
            ("P0006", "V0007", "R0002", "Hybrid Cloud Migration Proposal",           "$115,000", "40 days"),
            ("P0007", "V0009", "R0002", "CRM-Integrated Cloud Migration Proposal",   "$125,000", "50 days"),
            ("P0008", "V0005", "R0003", "Enterprise Transformation Consulting",      "$200,000", "60 days"),
            ("P0009", "V0006", "R0003", "Network & Infrastructure Consulting",       "$180,000", "55 days"),
            ("P0010", "V0010", "R0003", "SAP Enterprise Process Optimization",       "$210,000", "65 days"),
        ]
        vendor_names = {v[0]: v[1] for v in vendors}
        for pid, vendor_id, rfp_id, ai_title, price, timeline in proposal_rows:
            vname = vendor_names[vendor_id]
            db.add(models.Proposal(
                proposal_id=pid,
                name=f"{vname} - {ai_title} - {pid}",
                description=ai_title,
                upload_date=upload_dt,
                file_path=f"uploads/proposals/{pid}.pdf",
                rfp_id=rfp_id, vendor_id=vendor_id,
                price=price, timeline=timeline,
            ))

        db.commit()
    finally:
        db.close()


seed_db()


@app.get("/", tags=["Health"])
def root():
    return {"status": "ok", "service": "Procify API"}
