"""Pydantic models for API request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ============================================================================
# ENUMS / LITERALS
# ============================================================================
RiskLevel = Literal["low", "moderate", "high", "severe"]
HazardType = Literal["flood", "heat"]
Horizon = Literal["now", "6h", "24h", "72h"]
AlertSeverity = Literal["advisory", "watch", "warning", "emergency"]
ReportType = Literal["waterlogging", "blocked_drain", "heat_stress", "power_cut", "other"]
ReportStatus = Literal["submitted", "confirmed", "under_review", "resolved", "rejected"]


# ============================================================================
# WARD
# ============================================================================
class WardBase(BaseModel):
    id: str
    name: str
    name_local: str = ""
    zone: str = ""
    population: int = 0
    area: float = 0.0
    avg_elevation: float = 0.0
    drainage_condition: str = "fair"
    impervious_fraction: float = 0.5
    green_cover_fraction: float = 0.2
    informal_settlement_fraction: float = 0.1
    elderly_population_fraction: float = 0.08
    outdoor_worker_fraction: float = 0.15
    historical_flood_frequency: int = 0
    historical_heatwave_days: int = 0
    geometry: Optional[dict] = None


class WardResponse(WardBase):
    pass


# ============================================================================
# RISK
# ============================================================================
class RiskFactor(BaseModel):
    name: str
    contribution: float = Field(ge=0, le=1)
    description: str
    value: str


class RiskScore(BaseModel):
    level: RiskLevel
    score: int = Field(ge=0, le=100)
    probability: float = Field(ge=0, le=1)
    confidence: float = Field(ge=0, le=1)
    horizon: Horizon = "now"
    factors: List[RiskFactor] = []
    depth_bucket: Optional[str] = None
    computed_at: datetime
    data_freshness: datetime


class WardRisk(BaseModel):
    ward_id: str
    ward_name: str
    flood: RiskScore
    heat: RiskScore
    population: int = 0
    vulnerability_index: float = 0.0
    trend: Literal["rising", "falling", "stable"] = "stable"


# ============================================================================
# ALERT
# ============================================================================
class AlertCreate(BaseModel):
    hazard: HazardType
    severity: AlertSeverity
    title: str
    message: str
    actions: List[str] = []
    ward_ids: List[str] = []
    channels: List[str] = ["in_app"]
    language: str = "en"


class AlertResponse(BaseModel):
    id: str
    hazard: HazardType
    severity: AlertSeverity
    title: str
    message: str
    actions: List[str] = []
    ward_ids: List[str] = []
    ward_names: List[str] = []
    issued_at: datetime
    expires_at: datetime
    is_active: bool = True
    language: str = "en"
    channels: List[str] = []
    sent_by: Optional[str] = None
    estimated_reach: int = 0
    delivery_stats: Optional[dict] = None


# ============================================================================
# SHELTER
# ============================================================================
class ShelterResponse(BaseModel):
    id: str
    name: str
    name_local: Optional[str] = None
    type: str
    lat: float
    lng: float
    ward_id: str
    ward_name: str
    capacity: int = 0
    current_occupancy: int = 0
    facilities: List[str] = []
    is_flood_safe: bool = True
    verification_status: str = "unverified"
    contact_phone: Optional[str] = None
    contact_name: Optional[str] = None
    accessibility: str = "partial"
    address: Optional[str] = None
    operating_hours: Optional[str] = None
    elevation_m: Optional[int] = None
    verified_by: Optional[str] = None
    last_verified: Optional[str] = None
    distance: Optional[int] = None
    walking_time: Optional[int] = None


# ============================================================================
# REPORT
# ============================================================================
class ReportCreate(BaseModel):
    type: ReportType
    severity: str = "medium"
    description: str = ""
    lat: float
    lng: float
    ward_id: str = ""
    language: str = "en"


class ReportResponse(BaseModel):
    id: str
    type: ReportType
    severity: str
    description: str
    lat: float
    lng: float
    ward_id: str
    ward_name: str
    status: ReportStatus = "submitted"
    confirmations: int = 0
    submitted_at: datetime
    language: str = "en"


# ============================================================================
# WEATHER
# ============================================================================
class HourlyForecast(BaseModel):
    time: str
    temperature: float
    humidity: float
    rainfall: float
    wind_speed: float
    wind_direction: int = 0
    cloud_cover: int = 0


class DailyForecast(BaseModel):
    date: str
    min_temp: float
    max_temp: float
    total_rainfall: float
    condition: str
    sunrise: str = "06:00"
    sunset: str = "18:00"
    uv_index: int = 0


class WeatherResponse(BaseModel):
    current: dict
    hourly: List[HourlyForecast] = []
    daily: List[DailyForecast] = []
    source: str = "Open-Meteo"
    is_mock: bool = False
    is_stale: bool = False
    last_updated: Optional[str] = None
    timezone: str = "UTC"


# ============================================================================
# DASHBOARD
# ============================================================================
class DashboardKPIs(BaseModel):
    wards_at_severe: int = 0
    wards_at_high: int = 0
    people_in_high_risk: int = 0
    shelters_open: int = 0
    shelter_capacity_used: int = 0
    shelter_capacity_total: int = 0
    active_reports: int = 0
    alerts_sent_today: int = 0
    wards_monitored: int = 22
    active_data_points: int = 176
    last_updated: datetime
    data_source: str = "Nirvana Risk Engine + Open-Meteo"
    is_demonstration: bool = True


# ============================================================================
# HEALTH
# ============================================================================
class HealthResponse(BaseModel):
    status: str = "healthy"
    version: str = "1.0.0"
    city: str = "Hyderabad"
    mock_mode: bool = True
    data_sources: List[dict] = []
