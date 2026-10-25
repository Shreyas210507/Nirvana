"""Alert endpoints — list, create, get by ID."""

from fastapi import APIRouter, Query
from typing import Optional, List
from app.models import AlertResponse, AlertCreate
from app.mock_data import MOCK_ALERTS
from datetime import datetime, timedelta
import uuid

router = APIRouter()


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    active_only: bool = Query(True, description="Only return active alerts"),
    hazard: Optional[str] = Query(None, description="Filter by hazard type"),
    ward_id: Optional[str] = Query(None, description="Filter by ward"),
):
    """List alerts, optionally filtered by status, hazard, or ward."""
    alerts = MOCK_ALERTS
    if active_only:
        alerts = [a for a in alerts if a.is_active]
    if hazard:
        alerts = [a for a in alerts if a.hazard == hazard]
    if ward_id:
        alerts = [a for a in alerts if ward_id in a.ward_ids]
    return alerts


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str):
    """Get a specific alert by ID."""
    for a in MOCK_ALERTS:
        if a.id == alert_id:
            return a
    return {"error": "Alert not found"}


@router.post("", response_model=AlertResponse)
async def create_alert(alert: AlertCreate):
    """Create and dispatch a new alert (demo — adds to in-memory list)."""
    now = datetime.utcnow()
    new_alert = AlertResponse(
        id=f"a-{uuid.uuid4().hex[:6]}",
        hazard=alert.hazard,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        actions=alert.actions,
        ward_ids=alert.ward_ids,
        ward_names=alert.ward_ids,  # In production, resolve from DB
        issued_at=now,
        expires_at=now + timedelta(hours=6),
        is_active=True,
        language=alert.language,
        channels=alert.channels,
        sent_by="API User",
        estimated_reach=len(alert.ward_ids) * 50000,
    )
    MOCK_ALERTS.append(new_alert)
    return new_alert
