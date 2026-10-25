"""Community report endpoints — list, create, confirm."""

from fastapi import APIRouter, Query
from typing import Optional, List
from app.models import ReportResponse, ReportCreate
from app.mock_data import MOCK_REPORTS
from datetime import datetime
import uuid

router = APIRouter()


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    ward_id: Optional[str] = Query(None, description="Filter by ward"),
    report_type: Optional[str] = Query(None, description="Filter by type"),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    """List community reports with optional filters."""
    reports = list(MOCK_REPORTS)
    if ward_id:
        reports = [r for r in reports if r.ward_id == ward_id]
    if report_type:
        reports = [r for r in reports if r.type == report_type]
    if status:
        reports = [r for r in reports if r.status == status]
    return sorted(reports, key=lambda r: r.submitted_at, reverse=True)


@router.post("", response_model=ReportResponse)
async def create_report(report: ReportCreate):
    """Submit a new community report."""
    new_report = ReportResponse(
        id=f"r-{uuid.uuid4().hex[:6]}",
        type=report.type,
        severity=report.severity,
        description=report.description,
        lat=report.lat,
        lng=report.lng,
        ward_id=report.ward_id or "w-001",
        ward_name="Malakpet",
        status="submitted",
        confirmations=0,
        submitted_at=datetime.utcnow(),
        language=report.language,
    )
    MOCK_REPORTS.append(new_report)
    return new_report


@router.post("/{report_id}/confirm")
async def confirm_report(report_id: str):
    """Add a community confirmation to a report."""
    for r in MOCK_REPORTS:
        if r.id == report_id:
            r.confirmations += 1
            if r.confirmations >= 3 and r.status == "submitted":
                r.status = "confirmed"
            return {"status": "confirmed", "confirmations": r.confirmations}
    return {"error": "Report not found"}
