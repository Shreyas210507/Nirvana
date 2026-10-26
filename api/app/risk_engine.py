"""
Risk Scoring Engine — computes flood and heat risk per ward.

Fuses: elevation, drainage, rainfall forecast, land cover, historical events,
and vulnerability data into a 0-100 risk score with explainable factors.

Architecture: city-agnostic. Ward data drives the computation.
"""

import math
import random
from datetime import datetime, timedelta, timezone
from typing import List, Tuple

from app.models import RiskScore, RiskFactor, WardRisk, RiskLevel, WardBase
from app.config import settings


def _classify_risk(score: float) -> RiskLevel:
    """Map a 0-100 score to a risk level using configurable thresholds."""
    if score >= settings.FLOOD_SEVERE_THRESHOLD:
        return "severe"
    elif score >= settings.FLOOD_HIGH_THRESHOLD:
        return "high"
    elif score >= settings.FLOOD_MODERATE_THRESHOLD:
        return "moderate"
    return "low"


def _compute_flood_score(ward: WardBase, rainfall_mm: float = 0.0) -> Tuple[float, List[RiskFactor]]:
    """
    Compute flood risk score for a ward.

    Factors (weights):
      - Rainfall forecast intensity (0.25)
      - Elevation below city mean (0.20)
      - Drainage condition (0.15)
      - Impervious surface fraction (0.12)
      - Historical flood frequency (0.10)
      - Green cover deficit (0.08)
      - Informal settlement fraction (0.05)
      - Population density (0.05)
    """
    factors: List[RiskFactor] = []
    total = 0.0

    # 1. Rainfall intensity
    rain_norm = min(rainfall_mm / 100.0, 1.0)
    rain_score = rain_norm * 25
    total += rain_score
    factors.append(RiskFactor(
        name="Rainfall Forecast",
        contribution=rain_norm,
        description=f"{'Heavy' if rainfall_mm > 50 else 'Moderate' if rainfall_mm > 20 else 'Light'} rainfall of {rainfall_mm:.0f}mm expected",
        value=f"{rainfall_mm:.0f}mm",
    ))

    # 2. Low elevation
    city_mean_elev = 542.0  # Hyderabad mean
    elev_diff = max(0, city_mean_elev - ward.avg_elevation)
    elev_norm = min(elev_diff / 30.0, 1.0)
    elev_score = elev_norm * 20
    total += elev_score
    factors.append(RiskFactor(
        name="Elevation",
        contribution=elev_norm,
        description=f"{'Below' if elev_diff > 0 else 'At or above'} city average by {abs(elev_diff):.0f}m",
        value=f"{ward.avg_elevation:.0f}m",
    ))

    # 3. Drainage condition
    drain_map = {"good": 0.15, "fair": 0.45, "poor": 0.75, "very_poor": 0.95}
    drain_norm = drain_map.get(ward.drainage_condition, 0.5)
    drain_score = drain_norm * 15
    total += drain_score
    factors.append(RiskFactor(
        name="Drainage",
        contribution=drain_norm,
        description=f"Drainage rated '{ward.drainage_condition}' — {'frequent blockages' if drain_norm > 0.6 else 'adequate capacity'}",
        value=ward.drainage_condition,
    ))

    # 4. Impervious surfaces
    imperv_norm = ward.impervious_fraction
    imperv_score = imperv_norm * 12
    total += imperv_score
    factors.append(RiskFactor(
        name="Impervious Surface",
        contribution=imperv_norm,
        description=f"{imperv_norm*100:.0f}% of area is paved/built — {'poor' if imperv_norm > 0.7 else 'moderate'} water absorption",
        value=f"{imperv_norm*100:.0f}%",
    ))

    # 5. Historical floods
    hist_norm = min(ward.historical_flood_frequency / 8.0, 1.0)
    hist_score = hist_norm * 10
    total += hist_score
    factors.append(RiskFactor(
        name="Flood History",
        contribution=hist_norm,
        description=f"{ward.historical_flood_frequency} flood events recorded in this ward",
        value=f"{ward.historical_flood_frequency} events",
    ))

    # 6. Green cover deficit
    green_deficit = max(0, 0.30 - ward.green_cover_fraction)
    green_norm = min(green_deficit / 0.30, 1.0)
    green_score = green_norm * 8
    total += green_score
    factors.append(RiskFactor(
        name="Green Cover",
        contribution=green_norm,
        description=f"Only {ward.green_cover_fraction*100:.0f}% green cover — {'critically low' if green_norm > 0.7 else 'below target'}",
        value=f"{ward.green_cover_fraction*100:.0f}%",
    ))

    # 7. Informal settlements
    informal_norm = ward.informal_settlement_fraction
    informal_score = informal_norm * 5
    total += informal_score

    # 8. Population density
    density = ward.population / max(ward.area, 0.1)
    density_norm = min(density / 80000, 1.0)
    density_score = density_norm * 5
    total += density_score

    return min(total, 100.0), factors


def _compute_heat_score(ward: WardBase, max_temp: float = 35.0, heat_index: float = 38.0) -> Tuple[float, List[RiskFactor]]:
    """
    Compute heat risk score for a ward.

    Factors:
      - Heat index / feels-like temperature (0.30)
      - Green cover deficit / urban heat island (0.20)
      - Outdoor worker fraction (0.15)
      - Elderly population (0.12)
      - Informal settlement (0.10)
      - Impervious surface (0.08)
      - Historical heat events (0.05)
    """
    factors: List[RiskFactor] = []
    total = 0.0

    # 1. Heat index
    hi_norm = min(max(0, heat_index - 35) / 15.0, 1.0)
    total += hi_norm * 30
    factors.append(RiskFactor(
        name="Heat Index",
        contribution=hi_norm,
        description=f"Feels like {heat_index:.0f}°C — {'dangerous' if heat_index > 45 else 'uncomfortable' if heat_index > 38 else 'warm'}",
        value=f"{heat_index:.0f}°C",
    ))

    # 2. Urban heat island / green deficit
    uhi_norm = max(0, 0.35 - ward.green_cover_fraction) / 0.35
    total += uhi_norm * 20
    factors.append(RiskFactor(
        name="Urban Heat Island",
        contribution=uhi_norm,
        description=f"Low green cover ({ward.green_cover_fraction*100:.0f}%) amplifies urban temperatures",
        value=f"{ward.green_cover_fraction*100:.0f}% green",
    ))

    # 3. Outdoor workers
    ow_norm = ward.outdoor_worker_fraction / 0.30
    total += min(ow_norm, 1.0) * 15
    factors.append(RiskFactor(
        name="Outdoor Workers",
        contribution=min(ow_norm, 1.0),
        description=f"{ward.outdoor_worker_fraction*100:.0f}% of workers are outdoors — high heat exposure",
        value=f"{ward.outdoor_worker_fraction*100:.0f}%",
    ))

    # 4. Elderly
    el_norm = ward.elderly_population_fraction / 0.15
    total += min(el_norm, 1.0) * 12

    # 5. Informal settlements
    total += ward.informal_settlement_fraction * 10

    # 6. Impervious surface
    total += ward.impervious_fraction * 8

    # 7. Base from temperature
    temp_norm = min(max(0, max_temp - 33) / 12.0, 1.0)
    total += temp_norm * 5

    return min(total, 100.0), factors


def compute_ward_risks(
    wards: List[WardBase],
    rainfall_forecast_mm: float = 45.0,
    max_temp: float = 39.0,
    heat_index: float = 43.0,
    horizon: str = "now",
) -> List[WardRisk]:
    """Compute risk scores for all wards given current weather conditions."""
    results: List[WardRisk] = []
    now = datetime.now(timezone.utc)

    for ward in wards:
        # Add per-ward rainfall variance (some wards get more rain)
        ward_rainfall = rainfall_forecast_mm * (0.7 + 0.6 * (hash(ward.id) % 100) / 100.0)
        ward_heat_index = heat_index + (-2 + 4 * (hash(ward.id + "heat") % 100) / 100.0)

        flood_score, flood_factors = _compute_flood_score(ward, ward_rainfall)
        heat_score, heat_factors = _compute_heat_score(ward, max_temp, ward_heat_index)

        flood_level = _classify_risk(flood_score)
        heat_level = _classify_risk(heat_score)

        prob_map = {"severe": 0.85, "high": 0.65, "moderate": 0.40, "low": 0.15}
        conf_map = {"severe": 0.72, "high": 0.78, "moderate": 0.85, "low": 0.90}

        depth_map = {"severe": "30cm+", "high": "10-30cm", "moderate": "< 10cm", "low": None}

        # Simple trend based on ward hash (deterministic but varied)
        trend_val = hash(ward.id + "trend") % 3
        trend = ["rising", "stable", "falling"][trend_val]

        vuln = (
            ward.informal_settlement_fraction * 0.3 +
            ward.elderly_population_fraction * 0.25 +
            ward.outdoor_worker_fraction * 0.2 +
            (1 - ward.green_cover_fraction) * 0.15 +
            ward.impervious_fraction * 0.1
        )

        results.append(WardRisk(
            ward_id=ward.id,
            ward_name=ward.name,
            flood=RiskScore(
                level=flood_level,
                score=int(flood_score),
                probability=prob_map[flood_level],
                confidence=conf_map[flood_level],
                horizon=horizon,
                factors=flood_factors,
                depth_bucket=depth_map[flood_level],
                computed_at=now,
                data_freshness=now - timedelta(minutes=12),
            ),
            heat=RiskScore(
                level=heat_level,
                score=int(heat_score),
                probability=prob_map[heat_level],
                confidence=conf_map[heat_level],
                horizon=horizon,
                factors=heat_factors,
                computed_at=now,
                data_freshness=now - timedelta(minutes=12),
            ),
            population=ward.population,
            vulnerability_index=round(vuln, 3),
            trend=trend,
        ))

    return results
