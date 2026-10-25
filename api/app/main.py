"""
Nirvana API — Hyperlocal Climate Risk Alerts
FastAPI backend with risk scoring engine, data adapters, and mock fallbacks.

Pilot city: Hyderabad (Telangana). Architecture is city-agnostic.
Advisory platform — complements official IMD/NDMA/TSDMA warnings.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import wards, risks, alerts, shelters, reports, weather, health, auth
from app.config import settings
from app.database import init_db
from app.auth import seed_default_users

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nirvana")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    logger.info("🏘️  Nirvana API starting up...")
    logger.info(f"   City: {settings.PILOT_CITY}")
    logger.info(f"   Environment: {settings.ENVIRONMENT}")
    logger.info(f"   Mock mode: {settings.USE_MOCK_DATA}")
    # Initialize SQLite database and demo accounts
    init_db()
    seed_default_users()
    yield
    logger.info("🏘️  Nirvana API shutting down...")


app = FastAPI(
    title="Nirvana API",
    description="Hyperlocal climate risk alerts for vulnerable urban communities. "
                "Advisory platform — complements official IMD/NDMA warnings.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS — allow the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication v1"])
app.include_router(wards.router, prefix="/api/wards", tags=["Wards"])
app.include_router(risks.router, prefix="/api/risks", tags=["Risks"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(shelters.router, prefix="/api/shelters", tags=["Shelters"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
