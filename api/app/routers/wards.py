from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.models import WardResponse
from app.mock_data import HYDERABAD_WARDS

router = APIRouter()


@router.get("", response_model=List[WardResponse])
async def list_wards(
    zone: Optional[str] = Query(None, description="Filter by zone name"),
    search: Optional[str] = Query(None, description="Search by ward name"),
):
    """List all monitored wards, optionally filtered by zone or search query."""
    wards = HYDERABAD_WARDS
    if zone:
        wards = [w for w in wards if w.zone.lower() == zone.lower()]
    if search:
        wards = [w for w in wards if search.lower() in w.name.lower() or search.lower() in w.name_local.lower()]
    return [WardResponse(**w.model_dump()) for w in wards]


@router.get("/{ward_id}", response_model=WardResponse)
async def get_ward(ward_id: str):
    """Get detailed information about a specific ward."""
    for w in HYDERABAD_WARDS:
        if w.id == ward_id:
            return WardResponse(**w.model_dump())
    raise HTTPException(status_code=404, detail=f"Ward with ID '{ward_id}' not found")
