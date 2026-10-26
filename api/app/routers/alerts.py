"""Alert endpoints — list, create, get by ID."""

from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from app.models import AlertResponse, AlertCreate
from app.mock_data import MOCK_ALERTS, HYDERABAD_WARDS

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
    raise HTTPException(status_code=404, detail=f"Alert with ID '{alert_id}' not found")


@router.post("", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(alert: AlertCreate):
    """Create and dispatch a new alert with ward name resolution."""
    now = datetime.now(timezone.utc)
    # Resolve ward names from HYDERABAD_WARDS
    ward_name_map = {w.id: w.name for w in HYDERABAD_WARDS}
    resolved_ward_names = [ward_name_map.get(wid, wid) for wid in alert.ward_ids]

    # Calculate estimated reach based on actual ward population
    selected_population = sum(w.population for w in HYDERABAD_WARDS if w.id in alert.ward_ids)
    estimated_reach = selected_population if selected_population > 0 else len(alert.ward_ids) * 45000

    new_alert = AlertResponse(
        id=f"a-{uuid.uuid4().hex[:6]}",
        hazard=alert.hazard,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        actions=alert.actions,
        ward_ids=alert.ward_ids,
        ward_names=resolved_ward_names,
        issued_at=now,
        expires_at=now + timedelta(hours=6),
        is_active=True,
        language=alert.language,
        channels=alert.channels,
        sent_by="Municipal Command Operator",
        estimated_reach=estimated_reach,
        delivery_stats={
            "sent": int(estimated_reach * 0.9),
            "delivered": int(estimated_reach * 0.82),
            "read": int(estimated_reach * 0.6),
        },
    )
    MOCK_ALERTS.append(new_alert)
    return new_alert
