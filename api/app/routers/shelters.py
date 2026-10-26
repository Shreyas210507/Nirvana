"""Shelter endpoints — list, nearest, get by ID."""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from math import radians, cos, sin, asin, sqrt
from app.models import ShelterResponse
from app.mock_data import SHELTERS

router = APIRouter()


def _haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance in meters between two lat/lng points."""
    R = 6371000
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return R * 2 * asin(sqrt(a))


@router.get("", response_model=List[ShelterResponse])
async def list_shelters(
    ward_id: Optional[str] = Query(None, description="Filter by ward"),
    shelter_type: Optional[str] = Query(None, description="Filter by type"),
    verified_only: bool = Query(False, description="Only verified shelters"),
    lat: Optional[float] = Query(None, description="User latitude for distance calc"),
    lng: Optional[float] = Query(None, description="User longitude for distance calc"),
):
    """List shelters with optional filters and distance calculation."""
    shelters = list(SHELTERS)

    if ward_id:
        shelters = [s for s in shelters if s.ward_id == ward_id]
    if shelter_type:
        shelters = [s for s in shelters if s.type == shelter_type]
    if verified_only:
        shelters = [s for s in shelters if "verified" in s.verification_status]

    # Calculate distance if user location provided
    result: List[ShelterResponse] = []
    for s in shelters:
        sc = s.model_copy()
        if lat is not None and lng is not None:
            dist = _haversine(lat, lng, sc.lat, sc.lng)
            sc.distance = int(dist)
            sc.walking_time = max(1, int(dist / 80))  # ~80m/min walking speed
        result.append(sc)

    if lat is not None and lng is not None:
        result.sort(key=lambda s: s.distance if s.distance is not None else 999999)

    return result


@router.get("/nearest", response_model=ShelterResponse)
async def nearest_shelter(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    verified_only: bool = Query(True, description="Only search verified shelters"),
):
    """Find the nearest verified shelter to a given location."""
    candidates = [s for s in SHELTERS if ("verified" in s.verification_status)] if verified_only else list(SHELTERS)
    if not candidates:
        candidates = list(SHELTERS)

    best = None
    best_dist = float("inf")
    for s in candidates:
        dist = _haversine(lat, lng, s.lat, s.lng)
        if dist < best_dist:
            best_dist = dist
            best = s
    if best:
        res = best.model_copy()
        res.distance = int(best_dist)
        res.walking_time = max(1, int(best_dist / 80))
        return res
    raise HTTPException(status_code=404, detail="No shelters found")


@router.get("/{shelter_id}", response_model=ShelterResponse)
async def get_shelter(shelter_id: str):
    """Get shelter details by ID."""
    for s in SHELTERS:
        if s.id == shelter_id:
            return s
    raise HTTPException(status_code=404, detail=f"Shelter with ID '{shelter_id}' not found")
