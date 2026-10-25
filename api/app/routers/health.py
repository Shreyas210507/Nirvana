"""Health check endpoint."""

from fastapi import APIRouter
from app.models import HealthResponse
from app.config import settings

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns API health status, version, and data source statuses."""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        city=settings.PILOT_CITY,
        mock_mode=settings.USE_MOCK_DATA,
        data_sources=[
            {"name": "Open-Meteo Weather", "status": "healthy", "is_mock": False},
            {"name": "SRTM Elevation", "status": "healthy", "is_mock": False},
            {"name": "IMD Rainfall", "status": "healthy", "is_mock": True},
            {"name": "OSM Drainage", "status": "healthy", "is_mock": False},
            {"name": "Sentinel-2 NDVI", "status": "degraded", "is_mock": True},
            {"name": "Historical Events", "status": "healthy", "is_mock": True},
            {"name": "Census Vulnerability", "status": "healthy", "is_mock": True},
        ],
    )
