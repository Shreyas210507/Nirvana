"""Configuration loaded from environment variables with sensible defaults."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings with mock-friendly defaults."""

    # General
    ENVIRONMENT: str = "development"
    PILOT_CITY: str = "Hyderabad"
    USE_MOCK_DATA: bool = True
    LOG_LEVEL: str = "INFO"

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
    ]

    # Database (optional — falls back to in-memory mock)
    DATABASE_URL: str = ""

    # External APIs (optional — falls back to mock data)
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    GEMINI_API_KEY: str = ""

    # Risk Engine
    RISK_UPDATE_INTERVAL_MINUTES: int = 15
    FLOOD_SEVERE_THRESHOLD: float = 75.0
    FLOOD_HIGH_THRESHOLD: float = 55.0
    FLOOD_MODERATE_THRESHOLD: float = 35.0
    HEAT_SEVERE_THRESHOLD: float = 75.0
    HEAT_HIGH_THRESHOLD: float = 55.0
    HEAT_MODERATE_THRESHOLD: float = 35.0

    model_config = {"env_prefix": "NIRVANA_", "env_file": "../.env", "extra": "ignore"}


settings = Settings()
