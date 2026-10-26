"""Community report endpoints — list, create, confirm with database persistence."""

from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.models import ReportResponse, ReportCreate
from app.mock_data import HYDERABAD_WARDS
from app.database import (
    create_report_record,
    list_reports_records,
    get_report_by_id,
    confirm_report_record,
)

router = APIRouter()


def _resolve_ward_name(ward_id: Optional[str], lat: float, lng: float) -> str:
    """Resolve ward name from ward_id or approximate closest ward."""
    if ward_id:
        ward = next((w for w in HYDERABAD_WARDS if w.id == ward_id), None)
        if ward:
            return ward.name

    # Approximate closest ward if in Hyderabad extent
    best_name = "Hyderabad Area"
    best_dist = float("inf")
    for w in HYDERABAD_WARDS:
        coords = w.geometry.get("geometry", {}).get("coordinates", [[]])[0] if w.geometry else []
        if coords:
            c_lng = sum(p[0] for p in coords) / len(coords)
            c_lat = sum(p[1] for p in coords) / len(coords)
            dist = (lat - c_lat) ** 2 + (lng - c_lng) ** 2
            if dist < best_dist:
                best_dist = dist
                best_name = w.name

    return best_name


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    ward_id: Optional[str] = Query(None, description="Filter by ward ID"),
    report_type: Optional[str] = Query(None, description="Filter by report type"),
    status: Optional[str] = Query(None, description="Filter by status"),
):
    """List community reports with database backing and filtering."""
    records = list_reports_records(ward_id=ward_id, report_type=report_type, status=status)
    results = []
    for r in records:
        submitted_at_val = r["submitted_at"]
        if isinstance(submitted_at_val, str):
            submitted_at_val = datetime.fromisoformat(submitted_at_val)

        results.append(ReportResponse(
            id=r["id"],
            type=r["type"],
            severity=r["severity"],
            description=r["description"],
            lat=r["lat"],
            lng=r["lng"],
            ward_id=r["ward_id"],
            ward_name=r["ward_name"],
            status=r["status"],
            confirmations=r["confirmations"],
            submitted_at=submitted_at_val,
            language=r.get("language", "en"),
        ))
    return results


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(report: ReportCreate):
    """Submit a new community report with persistence to SQLite."""
    ward_id = report.ward_id or "w-001"
    ward_name = _resolve_ward_name(ward_id, report.lat, report.lng)
    report_id = f"r-{uuid.uuid4().hex[:6]}"

    created = create_report_record(
        report_id=report_id,
        report_type=report.type,
        severity=report.severity,
        description=report.description,
        lat=report.lat,
        lng=report.lng,
        ward_id=ward_id,
        ward_name=ward_name,
        language=report.language,
    )

    submitted_at_val = created.get("submitted_at")
    if isinstance(submitted_at_val, str):
        submitted_at_val = datetime.fromisoformat(submitted_at_val)
    elif not submitted_at_val:
        submitted_at_val = datetime.now(timezone.utc)

    return ReportResponse(
        id=created["id"],
        type=created["type"],
        severity=created["severity"],
        description=created["description"],
        lat=created["lat"],
        lng=created["lng"],
        ward_id=created["ward_id"],
        ward_name=created["ward_name"],
        status=created.get("status", "submitted"),
        confirmations=created.get("confirmations", 0),
        submitted_at=submitted_at_val,
        language=created.get("language", "en"),
    )


@router.post("/{report_id}/confirm")
async def confirm_report(report_id: str):
    """Add a community confirmation to a report."""
    updated = confirm_report_record(report_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report with ID '{report_id}' was not found.",
        )
    return {"status": updated["status"], "confirmations": updated["confirmations"]}
