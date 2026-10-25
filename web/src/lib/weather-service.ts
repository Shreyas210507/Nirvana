/**
 * Nirvana Weather Service
 * Connects to Open-Meteo API via backend proxy or direct client fallback.
 * Implements TTL caching, cancellation of older requests, unit conversions,
 * and WMO code interpretation.
 */

import { WeatherForecast, WeatherSnapshot, DailyForecast } from './types';
import { validateCoordinates } from './location-service';

export interface WeatherFetchOptions {
  signal?: AbortSignal;
  forceRefresh?: boolean;
}

export interface WeatherFetchResult {
  forecast: WeatherForecast;
  isStale: boolean;
  source: string;
  cachedAt?: number;
}

// In-memory cache for weather forecasts
interface CacheItem {
  data: WeatherForecast;
  expiresAt: number;
  cachedAt: number;
}

const WEATHER_CACHE = new Map<string, CacheItem>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// WMO Weather interpretation table
export const WMO_INTERPRETATIONS: Record<number, { description: string; emoji: string }> = {
  0: { description: 'Clear sky', emoji: '☀️' },
  1: { description: 'Mainly clear', emoji: '🌤️' },
  2: { description: 'Partly cloudy', emoji: '⛅' },
  3: { description: 'Overcast', emoji: '☁️' },
  45: { description: 'Fog', emoji: '🌫️' },
  48: { description: 'Depositing rime fog', emoji: '🌫️' },
  51: { description: 'Light drizzle', emoji: '🌦️' },
  53: { description: 'Moderate drizzle', emoji: '🌦️' },
  55: { description: 'Dense drizzle', emoji: '🌧️' },
  56: { description: 'Freezing drizzle', emoji: '🌨️' },
  57: { description: 'Dense freezing drizzle', emoji: '🌨️' },
  61: { description: 'Slight rain', emoji: '🌧️' },
  62: { description: 'Moderate rain', emoji: '🌧️' },
  63: { description: 'Moderate rain', emoji: '🌧️' },
  65: { description: 'Heavy rain', emoji: '⛈️' },
  66: { description: 'Light freezing rain', emoji: '🌨️' },
  67: { description: 'Heavy freezing rain', emoji: '🌨️' },
  71: { description: 'Slight snow', emoji: '❄️' },
  73: { description: 'Moderate snow', emoji: '❄️' },
  75: { description: 'Heavy snow', emoji: '❄️' },
  77: { description: 'Snow grains', emoji: '❄️' },
  80: { description: 'Slight rain showers', emoji: '🌦️' },
  81: { description: 'Moderate rain showers', emoji: '🌧️' },
  82: { description: 'Violent rain showers', emoji: '⛈️' },
  85: { description: 'Snow showers', emoji: '🌨️' },
  86: { description: 'Heavy snow showers', emoji: '🌨️' },
  95: { description: 'Thunderstorm', emoji: '⛈️' },
  96: { description: 'Thunderstorm with slight hail', emoji: '⛈️' },
  99: { description: 'Thunderstorm with heavy hail', emoji: '⛈️' },
};

export function interpretWmoCode(code: number): { description: string; emoji: string } {
  return WMO_INTERPRETATIONS[code] || { description: 'Cloudy', emoji: '☁️' };
}

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)}:${lng.toFixed(3)}`;
}

/**
 * Fetch verified weather forecast for coordinates from FastAPI /api/weather
 * with fallback directly to Open-Meteo API.
 */
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  options: WeatherFetchOptions = {}
): Promise<WeatherFetchResult> {
  const validation = validateCoordinates(latitude, longitude);
  if (!validation.valid || validation.latitude === undefined || validation.longitude === undefined) {
    throw new Error(validation.error || 'Invalid coordinates provided for weather request.');
  }

  const lat = validation.latitude;
  const lng = validation.longitude;
  const cacheKey = getCacheKey(lat, lng);
  const now = Date.now();

  // Check cache unless forceRefresh is true
  if (!options.forceRefresh && WEATHER_CACHE.has(cacheKey)) {
    const cached = WEATHER_CACHE.get(cacheKey)!;
    if (now < cached.expiresAt) {
      return {
        forecast: cached.data,
        isStale: false,
        source: cached.data.source || 'Open-Meteo (Cached)',
        cachedAt: cached.cachedAt,
      };
    }
  }

  // 1. Try local backend proxy endpoint
  try {
    const proxyUrl = `/api/weather?lat=${lat}&lng=${lng}`;
    const res = await fetch(proxyUrl, { signal: options.signal });
    if (res.ok) {
      const data = await res.json();
      const normalized = normalizeBackendWeather(lat, lng, data);
      WEATHER_CACHE.set(cacheKey, {
        data: normalized,
        expiresAt: now + CACHE_TTL_MS,
        cachedAt: now,
      });
      return {
        forecast: normalized,
        isStale: false,
        source: 'Open-Meteo (via Nirvana API)',
        cachedAt: now,
      };
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err; // Re-throw abort signal
    }
    console.warn('Backend weather proxy unavailable, falling back to direct Open-Meteo endpoint:', err);
  }

  // 2. Direct client fallback to Open-Meteo API
  try {
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,pressure_msl,cloud_cover,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max&timezone=auto`;

    const res = await fetch(openMeteoUrl, { signal: options.signal });
    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}: ${res.statusText}`);
    }

    const raw = await res.json();
    const normalized = normalizeOpenMeteoRaw(lat, lng, raw);
    WEATHER_CACHE.set(cacheKey, {
      data: normalized,
      expiresAt: now + CACHE_TTL_MS,
      cachedAt: now,
    });

    return {
      forecast: normalized,
      isStale: false,
      source: 'Open-Meteo (Direct Live Model)',
      cachedAt: now,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }

    // Check if we have stale cache to salvage
    if (WEATHER_CACHE.has(cacheKey)) {
      const cached = WEATHER_CACHE.get(cacheKey)!;
      return {
        forecast: cached.data,
        isStale: true,
        source: 'Open-Meteo (Stale Cache)',
        cachedAt: cached.cachedAt,
      };
    }

    throw new Error(
      `Unable to retrieve weather forecast for coordinates (${lat}, ${lng}). Please check your connection and retry.`
    );
  }
}

/**
 * Normalizes backend response from /api/weather into WeatherForecast
 */
function normalizeBackendWeather(lat: number, lng: number, data: any): WeatherForecast {
  const currentObj = data.current || {};
  const weatherCode = Number(currentObj.weather_code ?? 0);
  const wmo = interpretWmoCode(weatherCode);

  const current: WeatherSnapshot = {
    time: currentObj.observation_time || new Date().toISOString(),
    temperature: Number(currentObj.temperature ?? 30),
    humidity: Number(currentObj.humidity ?? 50),
    rainfall: Number(currentObj.rainfall ?? 0),
    heatIndex: Number(currentObj.heat_index ?? currentObj.apparent_temperature ?? currentObj.temperature ?? 32),
    windSpeed: Number(currentObj.wind_speed ?? 0),
    windDirection: Number(currentObj.wind_direction ?? 0),
    pressure: Number(currentObj.pressure ?? 1013),
    cloudCover: Number(currentObj.cloud_cover ?? 0),
    weatherCode: weatherCode,
    weatherDescription: currentObj.condition || wmo.description,
  };

  const hourly: WeatherSnapshot[] = (data.hourly || []).map((h: any) => {
    const code = Number(h.weather_code ?? 0);
    return {
      time: h.time,
      temperature: Number(h.temperature),
      humidity: Number(h.humidity),
      rainfall: Number(h.rainfall),
      heatIndex: Number(h.temperature),
      windSpeed: Number(h.wind_speed ?? 0),
      windDirection: Number(h.wind_direction ?? 0),
      pressure: 1013,
      cloudCover: Number(h.cloud_cover ?? 0),
      weatherCode: code,
      weatherDescription: interpretWmoCode(code).description,
    };
  });

  const daily: DailyForecast[] = (data.daily || []).map((d: any) => ({
    date: d.date,
    tempMax: Number(d.max_temp),
    tempMin: Number(d.min_temp),
    rainfallTotal: Number(d.total_rainfall),
    rainfallProbability: 50,
    heatIndexMax: Number(d.max_temp),
    weatherCode: 0,
    weatherDescription: d.condition || 'Partly Cloudy',
  }));

  return {
    lat,
    lng,
    current,
    hourly,
    daily,
    source: data.source || 'Open-Meteo',
    lastUpdated: data.last_updated || new Date().toISOString(),
  };
}

/**
 * Normalizes direct Open-Meteo JSON into WeatherForecast
 */
function normalizeOpenMeteoRaw(lat: number, lng: number, raw: any): WeatherForecast {
  const cur = raw.current || {};
  const code = Number(cur.weather_code ?? 0);
  const wmo = interpretWmoCode(code);

  const current: WeatherSnapshot = {
    time: cur.time || new Date().toISOString(),
    temperature: Number(cur.temperature_2m ?? 30),
    humidity: Number(cur.relative_humidity_2m ?? 50),
    rainfall: Number(cur.precipitation ?? 0),
    heatIndex: Number(cur.apparent_temperature ?? cur.temperature_2m ?? 32),
    windSpeed: Number(cur.wind_speed_10m ?? 0),
    windDirection: Number(cur.wind_direction_10m ?? 0),
    pressure: Number(cur.surface_pressure ?? 1013),
    cloudCover: Number(cur.cloud_cover ?? 0),
    weatherCode: code,
    weatherDescription: wmo.description,
  };

  const hr = raw.hourly || {};
  const hourlyTimes = hr.time || [];
  const hourlyTemps = hr.temperature_2m || [];
  const hourlyRains = hr.precipitation || [];
  const hourlyHumid = hr.relative_humidity_2m || [];
  const hourlyWinds = hr.wind_speed_10m || [];
  const hourlyCodes = hr.weather_code || [];

  const hourly: WeatherSnapshot[] = [];
  const maxHours = Math.min(hourlyTimes.length, 72);
  for (let i = 0; i < maxHours; i++) {
    const hCode = Number(hourlyCodes[i] ?? 0);
    hourly.push({
      time: hourlyTimes[i],
      temperature: Number(hourlyTemps[i] ?? current.temperature),
      humidity: Number(hourlyHumid[i] ?? current.humidity),
      rainfall: Number(hourlyRains[i] ?? 0),
      heatIndex: Number(hourlyTemps[i] ?? current.temperature),
      windSpeed: Number(hourlyWinds[i] ?? 0),
      windDirection: 0,
      pressure: 1013,
      cloudCover: 0,
      weatherCode: hCode,
      weatherDescription: interpretWmoCode(hCode).description,
    });
  }

  const dl = raw.daily || {};
  const dailyDates = dl.time || [];
  const dailyMax = dl.temperature_2m_max || [];
  const dailyMin = dl.temperature_2m_min || [];
  const dailyRain = dl.precipitation_sum || [];
  const dailyProb = dl.precipitation_probability_max || [];
  const dailyCodes = dl.weather_code || [];

  const daily: DailyForecast[] = [];
  for (let d = 0; d < dailyDates.length; d++) {
    const dCode = Number(dailyCodes[d] ?? 0);
    daily.push({
      date: dailyDates[d],
      tempMax: Number(dailyMax[d] ?? current.temperature + 4),
      tempMin: Number(dailyMin[d] ?? current.temperature - 4),
      rainfallTotal: Number(dailyRain[d] ?? 0),
      rainfallProbability: Number(dailyProb[d] ?? 0),
      heatIndexMax: Number(dailyMax[d] ?? current.temperature + 4),
      weatherCode: dCode,
      weatherDescription: interpretWmoCode(dCode).description,
    });
  }

  return {
    lat,
    lng,
    current,
    hourly,
    daily,
    source: 'Open-Meteo (Real-Time Model)',
    lastUpdated: new Date().toISOString(),
  };
}

export function clearWeatherCache(): void {
  WEATHER_CACHE.clear();
}
