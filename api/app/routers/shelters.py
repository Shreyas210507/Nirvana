"""Shelter endpoints — list, nearest, get by ID."""

from fastapi import APIRouter, Query
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
    if lat is not None and lng is not None:
        for s in shelters:
            dist = _haversine(lat, lng, s.lat, s.lng)
            s.distance = int(dist)
            s.walking_time = max(1, int(dist / 80))  # ~80m/min walking speed
        shelters.sort(key=lambda s: s.distance or 999999)

    return shelters


@router.get("/nearest", response_model=ShelterResponse)
async def nearest_shelter(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
):
    """Find the nearest verified shelter to a given location."""
    best = None
    best_dist = float("inf")
    for s in SHELTERS:
        dist = _haversine(lat, lng, s.lat, s.lng)
        if dist < best_dist:
            best_dist = dist
            best = s
    if best:
        best.distance = int(best_dist)
        best.walking_time = max(1, int(best_dist / 80))
        return best
    return {"error": "No shelters found"}


@router.get("/{shelter_id}", response_model=ShelterResponse)
async def get_shelter(shelter_id: str):
    """Get shelter details by ID."""
    for s in SHELTERS:
        if s.id == shelter_id:
            return s
    return {"error": "Shelter not found"}
