"""Risk scoring endpoints — compute ward risks, get individual ward risk."""

from fastapi import APIRouter, Query
from typing import Optional, List
from app.models import WardRisk, DashboardKPIs, Horizon
from app.mock_data import HYDERABAD_WARDS
from app.risk_engine import compute_ward_risks
from datetime import datetime

router = APIRouter()


@router.get("", response_model=List[WardRisk])
async def get_all_risks(
    horizon: str = Query("now", description="Time horizon: now, 6h, 24h, 72h"),
    hazard: Optional[str] = Query(None, description="Filter by hazard type: flood or heat"),
):
    """Compute and return risk scores for all monitored wards."""
    # Vary rainfall by horizon for demo
    rainfall_map = {"now": 45.0, "6h": 65.0, "24h": 40.0, "72h": 25.0}
    temp_map = {"now": 39.0, "6h": 41.0, "24h": 38.0, "72h": 36.0}
    hi_map = {"now": 43.0, "6h": 47.0, "24h": 42.0, "72h": 39.0}

    risks = compute_ward_risks(
        wards=HYDERABAD_WARDS,
        rainfall_forecast_mm=rainfall_map.get(horizon, 45.0),
        max_temp=temp_map.get(horizon, 39.0),
        heat_index=hi_map.get(horizon, 43.0),
        horizon=horizon,
    )
    return risks


@router.get("/ward/{ward_id}", response_model=WardRisk)
async def get_ward_risk(
    ward_id: str,
    horizon: str = Query("now"),
):
    """Get risk score for a specific ward."""
    ward = next((w for w in HYDERABAD_WARDS if w.id == ward_id), None)
    if not ward:
        return {"error": "Ward not found"}

    risks = compute_ward_risks([ward], horizon=horizon)
    return risks[0] if risks else {"error": "Could not compute risk"}


@router.get("/dashboard", response_model=DashboardKPIs)
async def get_dashboard_kpis():
    """Get aggregated KPIs for the municipal dashboard."""
    risks = compute_ward_risks(HYDERABAD_WARDS)
    severe_count = sum(1 for r in risks if r.flood.level == "severe" or r.heat.level == "severe")
    high_count = sum(1 for r in risks if r.flood.level == "high" or r.heat.level == "high")
    high_risk_pop = sum(r.population for r in risks if r.flood.level in ("severe", "high") or r.heat.level in ("severe", "high"))

    return DashboardKPIs(
        wards_at_severe=severe_count,
        wards_at_high=high_count,
        people_in_high_risk=high_risk_pop,
        shelters_open=4,
        shelter_capacity_used=223,
        shelter_capacity_total=1550,
        active_reports=3,
        alerts_sent_today=2,
        last_updated=datetime.utcnow(),
    )
