"""Risk scoring endpoints — compute ward risks, get individual ward risk."""

from fastapi import APIRouter, Query
from typing import Optional, List
from app.models import WardRisk, DashboardKPIs, Horizon, WardBase
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


@router.get("/evaluate", response_model=WardRisk)
async def evaluate_risk(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    name: Optional[str] = Query(None, description="Location name"),
    ward_id: Optional[str] = Query(None, description="Ward ID"),
    rainfall_mm: Optional[float] = Query(None, description="Current or 3h rainfall forecast in mm"),
    temp: Optional[float] = Query(None, description="Temperature in C"),
    heat_index: Optional[float] = Query(None, description="Heat index in C"),
    horizon: str = Query("now"),
):
    """Dynamically evaluate flood and heat risk for specific coordinates and weather parameters."""
    # Find matching ward or construct localized ward model
    matched_ward = None
    if ward_id:
        matched_ward = next((w for w in HYDERABAD_WARDS if w.id == ward_id), None)

    if not matched_ward:
        # Check proximity to known Hyderabad wards
        for w in HYDERABAD_WARDS:
            if w.id == ward_id:
                matched_ward = w
                break

    if not matched_ward:
        # Synthesize localized ward based on coordinates
        loc_name = name or f"{lat:.2f}N, {lng:.2f}E"
        matched_ward = WardBase(
            id="custom-loc",
            name=loc_name,
            name_local="",
            zone=loc_name,
            population=45000,
            area=3.0,
            avg_elevation=530.0,
            drainage_condition="fair",
            impervious_fraction=0.72,
            green_cover_fraction=0.12,
            informal_settlement_fraction=0.15,
            elderly_population_fraction=0.08,
            outdoor_worker_fraction=0.25,
            historical_flood_frequency=4,
        )

    rf = rainfall_mm if rainfall_mm is not None else 0.0
    t = temp if temp is not None else 32.0
    hi = heat_index if heat_index is not None else (t + 3.0)

    risks = compute_ward_risks(
        [matched_ward],
        rainfall_forecast_mm=rf,
        max_temp=t,
        heat_index=hi,
        horizon=horizon,
    )
    return risks[0]



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
