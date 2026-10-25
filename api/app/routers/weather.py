"""Weather forecast endpoints — real Open-Meteo integration with caching, WMO code mapping, and geocoding."""

import time
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import httpx
from fastapi import APIRouter, Query, HTTPException, status
from pydantic import BaseModel

from app.models import WeatherResponse, HourlyForecast, DailyForecast
from app.config import settings

logger = logging.getLogger("nirvana.weather")
router = APIRouter()

# In-memory weather cache: { cache_key: { "data": WeatherResponse, "expires_at": float, "cached_at": float } }
WEATHER_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 300  # 5 minutes

_async_client: Optional[httpx.AsyncClient] = None

def get_async_client() -> httpx.AsyncClient:
    global _async_client
    if _async_client is None or _async_client.is_closed:
        _async_client = httpx.AsyncClient(
            timeout=httpx.Timeout(15.0, connect=8.0),
            limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        )
    return _async_client


# ============================================================================
# WMO WEATHER CODE MAPPINGS
# ============================================================================
WMO_CODE_MAP: Dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    62: "Moderate rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
}


def get_wmo_condition(code: int) -> str:
    """Return descriptive condition string for standard WMO weather codes."""
    return WMO_CODE_MAP.get(code, "Cloudy")


# ============================================================================
# REAL OPEN-METEO WEATHER CLIENT
# ============================================================================
async def fetch_open_meteo_weather(lat: float, lng: float) -> WeatherResponse:
    """Fetch live weather from Open-Meteo API and normalize into WeatherResponse."""
    cache_key = f"{round(lat, 3)}:{round(lng, 3)}"
    now_ts = time.time()

    # Check cache
    if cache_key in WEATHER_CACHE:
        entry = WEATHER_CACHE[cache_key]
        if now_ts < entry["expires_at"]:
            logger.info(f"Returning cached weather for {lat}, {lng}")
            cached_res = entry["data"]
            return cached_res

    # Open-Meteo URL
    base_url = getattr(settings, "OPEN_METEO_BASE_URL", "https://api.open-meteo.com/v1")
    url = f"{base_url}/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m",
        "hourly": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max",
        "timezone": "auto",
    }

    client = get_async_client()
    raw = None
    last_err: Optional[Exception] = None

    for attempt in range(2):
        try:
            resp = await client.get(url, params=params)
            if resp.status_code == 200:
                raw = resp.json()
                break
            elif resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Weather provider Open-Meteo returned status {resp.status_code}: {resp.text}",
                )
        except HTTPException:
            raise
        except Exception as exc:
            last_err = exc
            if attempt == 0:
                time.sleep(0.3)

    if raw is None:
        # Check if we have stale cache to salvage
        if cache_key in WEATHER_CACHE:
            logger.warning(f"Open-Meteo request failed ({last_err}); serving stale cached weather for {lat}, {lng}")
            stale = WEATHER_CACHE[cache_key]["data"]
            stale.is_stale = True
            return stale
        logger.error(f"Failed to fetch live weather from Open-Meteo: {last_err}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Open-Meteo weather service: {str(last_err)}",
        )

    # Parse current weather
    current_raw = raw.get("current", {})
    wmo_code = int(current_raw.get("weather_code", 0))
    temp = float(current_raw.get("temperature_2m", 30.0))
    humidity = float(current_raw.get("relative_humidity_2m", 50.0))
    apparent_temp = float(current_raw.get("apparent_temperature", temp))
    precip = float(current_raw.get("precipitation", 0.0))
    wind_spd = float(current_raw.get("wind_speed_10m", 0.0))
    wind_dir = int(current_raw.get("wind_direction_10m", 0))
    cloud_cov = int(current_raw.get("cloud_cover", 0))
    press = float(current_raw.get("surface_pressure", 1013.0))

    # Parse hourly forecast (first 72 hours)
    hourly_raw = raw.get("hourly", {})
    hourly_times = hourly_raw.get("time", [])
    hourly_temps = hourly_raw.get("temperature_2m", [])
    hourly_humids = hourly_raw.get("relative_humidity_2m", [])
    hourly_rains = hourly_raw.get("precipitation", [])
    hourly_winds = hourly_raw.get("wind_speed_10m", [])
    hourly_dirs = hourly_raw.get("wind_direction_10m", [])
    hourly_clouds = hourly_raw.get("cloud_cover", [])

    hourly_list: List[HourlyForecast] = []
    limit_hours = min(len(hourly_times), 72)
    for i in range(limit_hours):
        hourly_list.append(HourlyForecast(
            time=hourly_times[i],
            temperature=float(hourly_temps[i]) if i < len(hourly_temps) else temp,
            humidity=float(hourly_humids[i]) if i < len(hourly_humids) else humidity,
            rainfall=float(hourly_rains[i]) if i < len(hourly_rains) else 0.0,
            wind_speed=float(hourly_winds[i]) if i < len(hourly_winds) else wind_spd,
            wind_direction=int(hourly_dirs[i]) if i < len(hourly_dirs) else wind_dir,
            cloud_cover=int(hourly_clouds[i]) if i < len(hourly_clouds) else cloud_cov,
        ))

    # Parse daily forecast
    daily_raw = raw.get("daily", {})
    daily_times = daily_raw.get("time", [])
    daily_codes = daily_raw.get("weather_code", [])
    daily_max_temps = daily_raw.get("temperature_2m_max", [])
    daily_min_temps = daily_raw.get("temperature_2m_min", [])
    daily_rains = daily_raw.get("precipitation_sum", [])
    daily_sunrises = daily_raw.get("sunrise", [])
    daily_sunsets = daily_raw.get("sunset", [])
    daily_uvs = daily_raw.get("uv_index_max", [])

    daily_list: List[DailyForecast] = []
    for d in range(len(daily_times)):
        d_code = int(daily_codes[d]) if d < len(daily_codes) else 0
        sunrise_str = daily_sunrises[d].split("T")[-1] if d < len(daily_sunrises) and "T" in daily_sunrises[d] else "06:00"
        sunset_str = daily_sunsets[d].split("T")[-1] if d < len(daily_sunsets) and "T" in daily_sunsets[d] else "18:00"

        daily_list.append(DailyForecast(
            date=daily_times[d],
            min_temp=float(daily_min_temps[d]) if d < len(daily_min_temps) else temp - 5,
            max_temp=float(daily_max_temps[d]) if d < len(daily_max_temps) else temp + 5,
            total_rainfall=float(daily_rains[d]) if d < len(daily_rains) else 0.0,
            condition=get_wmo_condition(d_code),
            sunrise=sunrise_str,
            sunset=sunset_str,
            uv_index=int(daily_uvs[d]) if d < len(daily_uvs) and daily_uvs[d] is not None else 5,
        ))

    now_iso = datetime.now(timezone.utc).isoformat()
    weather_resp = WeatherResponse(
        current={
            "temperature": round(temp, 1),
            "humidity": round(humidity, 1),
            "rainfall": round(precip, 1),
            "wind_speed": round(wind_spd, 1),
            "wind_direction": wind_dir,
            "condition": get_wmo_condition(wmo_code),
            "weather_code": wmo_code,
            "apparent_temperature": round(apparent_temp, 1),
            "heat_index": round(apparent_temp, 1),
            "pressure": round(press, 1),
            "cloud_cover": cloud_cov,
            "observation_time": current_raw.get("time", now_iso),
        },
        hourly=hourly_list,
        daily=daily_list,
        source="Open-Meteo (Real-Time Model)",
        is_mock=False,
        is_stale=False,
        last_updated=now_iso,
        timezone=raw.get("timezone", "auto"),
    )

    # Save in cache
    WEATHER_CACHE[cache_key] = {
        "data": weather_resp,
        "expires_at": now_ts + CACHE_TTL_SECONDS,
        "cached_at": now_ts,
    }

    return weather_resp


# ============================================================================
# ENDPOINTS
# ============================================================================
@router.get("", response_model=WeatherResponse)
async def get_weather(
    lat: float = Query(..., description="Latitude (-90 to 90)"),
    lng: float = Query(..., description="Longitude (-180 to 180)"),
):
    """Retrieve verified Open-Meteo weather forecast for specified coordinates."""
    # Coordinate validation
    if lat < -90 or lat > 90:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Latitude {lat} is out of bounds (-90 to 90).",
        )
    if lng < -180 or lng > 180:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Longitude {lng} is out of bounds (-180 to 180).",
        )

    return await fetch_open_meteo_weather(lat=lat, lng=lng)


@router.get("/current")
async def get_current_weather(
    lat: float = Query(17.385, description="Latitude"),
    lng: float = Query(78.487, description="Longitude"),
):
    """Retrieve current weather conditions only for coordinates."""
    forecast = await fetch_open_meteo_weather(lat=lat, lng=lng)
    return forecast.current


@router.get("/geocode")
async def geocode_location(
    query: str = Query(..., min_length=2, description="Place or city name to search")
):
    """Proxy geocoding query to Open-Meteo Geocoding API."""
    url = f"https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": query.strip(), "count": 6, "language": "en", "format": "json"}

    try:
        client = get_async_client()
        resp = await client.get(url, params=params)
        if resp.status_code == 200:
                data = resp.json()
                results = []
                for item in data.get("results", []):
                    results.append({
                        "name": item.get("name"),
                        "latitude": item.get("latitude"),
                        "longitude": item.get("longitude"),
                        "country": item.get("country"),
                        "admin1": item.get("admin1"),
                    })
                return {"results": results}
    except Exception as e:
        logger.warning(f"Geocode lookup failed: {e}")

    return {"results": []}
