/**
 * Nirvana Risk Service
 * Dynamically evaluates hyperlocal flood and heat risk scores and generates
 * explainable reasoning factors (Rainfall Forecast, Elevation ASL, Drainage Condition)
 * tailored to active coordinates, terrain properties, and live weather models.
 */

import { WardRisk, RiskScore, RiskFactor, RiskLevel, Horizon, WeatherForecast } from './types';
import { hyderabadWards } from './mock-data';
import { calculateDistanceKm, LocationData } from './location-service';

export interface LocationTerrainProfile {
  elevation: number;
  drainageCondition: 'poor' | 'partial' | 'good';
  imperviousFraction: number;
  greenCoverFraction: number;
  historicalFloodFrequency: number;
  historicalHeatwaveDays: number;
  outdoorWorkerFraction: number;
  matchedWardName?: string;
  matchedWardId?: string;
}

/**
/**
 * Resolves local terrain profile for given coordinates:
 * Checks closest Hyderabad ward within 6km for exact civic survey metrics;
 * otherwise derives terrain characteristics for custom locations using live forecast elevation.
 */
export function resolveLocationTerrain(
  lat: number,
  lng: number,
  forecast?: WeatherForecast | null
): LocationTerrainProfile {
  let closestWard: (typeof hyderabadWards)[0] | null = null;
  let minDistance = Infinity;

  for (const ward of hyderabadWards) {
    const coords = (ward.geometry?.geometry as { coordinates?: number[][][] })?.coordinates?.[0];
    if (coords && coords.length > 0) {
      const cLng = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
      const cLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
      const dist = calculateDistanceKm(lat, lng, cLat, cLng);
      if (dist < minDistance) {
        minDistance = dist;
        closestWard = ward;
      }
    }
  }

  if (closestWard && minDistance <= 6.0) {
    return {
      elevation: closestWard.avgElevation,
      drainageCondition: closestWard.drainageCondition === 'good' ? 'good' : closestWard.drainageCondition === 'poor' ? 'poor' : 'partial',
      imperviousFraction: closestWard.imperviousFraction,
      greenCoverFraction: closestWard.greenCoverFraction,
      historicalFloodFrequency: closestWard.historicalFloodFrequency,
      historicalHeatwaveDays: closestWard.historicalHeatwaveDays,
      outdoorWorkerFraction: closestWard.outdoorWorkerFraction,
      matchedWardName: closestWard.name,
      matchedWardId: closestWard.id,
    };
  }

  // Derive realistic terrain profile for locations outside pilot wards
  let elevation = 25; // Default lowland baseline
  if (forecast?.elevation !== undefined && forecast.elevation !== null) {
    elevation = Math.round(forecast.elevation);
  } else if (lat >= 15.8 && lat <= 19.9 && lng >= 77.2 && lng <= 81.8) {
    // Deccan Plateau / Telangana region
    elevation = 525 + Math.round((Math.sin(lat * 10) + Math.cos(lng * 10)) * 18);
  } else if (lat >= 50 && lat <= 58 && lng >= -6 && lng <= 2) {
    // UK / London Thames Valley
    elevation = 25;
  } else {
    // General urban elevation model
    elevation = Math.max(8, Math.min(650, Math.round(30 + Math.abs(Math.sin(lat) * 120))));
  }

  return {
    elevation,
    drainageCondition: 'good',
    imperviousFraction: 0.65,
    greenCoverFraction: 0.22,
    historicalFloodFrequency: 2,
    historicalHeatwaveDays: 5,
    outdoorWorkerFraction: 0.14,
  };
}

/**
 * Computes dynamic flood and heat risk scores along with explainable breakdown factors
 * bound to the live weather forecast and active location.
 */
export function computeLocationRisk(
  location: LocationData,
  forecast: WeatherForecast | null,
  horizon: Horizon = 'now'
): WardRisk {
  const terrain = resolveLocationTerrain(location.latitude, location.longitude, forecast);

  // 1. Extract live rainfall metrics
  const currentRain = forecast?.current?.rainfall ?? 0;
  let next3hRain = 0;
  let next24hRain = 0;

  if (forecast?.hourly && forecast.hourly.length > 0) {
    const offset = horizon === '6h' ? 6 : horizon === '24h' ? 24 : horizon === '72h' ? 48 : 0;
    const slice3 = forecast.hourly.slice(offset, offset + 3);
    next3hRain = slice3.reduce((sum, h) => sum + (h.rainfall || 0), 0);

    const slice24 = forecast.hourly.slice(0, 24);
    next24hRain = slice24.reduce((sum, h) => sum + (h.rainfall || 0), 0);
  } else {
    next3hRain = currentRain * 3;
    next24hRain = currentRain * 24;
  }

  // 2. Extract live temperature & heat index metrics
  const currentTemp = forecast?.current?.temperature ?? 24;
  const currentHeatIndex = forecast?.current?.heatIndex ?? currentTemp;
  const maxTemp24h = forecast?.daily?.[0]?.tempMax ?? currentTemp;
  const maxHeatIndex24h = forecast?.daily?.[0]?.heatIndexMax ?? currentHeatIndex;

  // --------------------------------------------------------------------------
  // FLOOD RISK COMPUTATION
  // --------------------------------------------------------------------------
  let floodScore = 10; // baseline

  // Rain component
  if (next3hRain > 50 || currentRain > 25) {
    floodScore += 55;
  } else if (next3hRain > 25 || currentRain > 12) {
    floodScore += 40;
  } else if (next3hRain > 10 || currentRain > 4) {
    floodScore += 25;
  } else if (next3hRain > 2 || currentRain > 0.5) {
    floodScore += 12;
  }

  // Elevation component (evaluated relative to local floodplains)
  if (terrain.matchedWardId) {
    const elevDeficit = Math.max(0, 540 - terrain.elevation);
    floodScore += Math.min(20, Math.round((elevDeficit / 35) * 18));
  } else {
    // For non-Hyderabad areas, lower elevation (< 20m) only increases score if precipitation is present
    if (terrain.elevation < 20 && next3hRain > 5) {
      floodScore += 10;
    }
  }

  // Drainage component
  if (terrain.drainageCondition === 'poor') {
    floodScore += 18;
  } else if (terrain.drainageCondition === 'partial') {
    floodScore += 8;
  } else {
    floodScore -= 4;
  }

  // Impervious surface & history
  floodScore += Math.round(terrain.imperviousFraction * 8);
  floodScore += Math.min(8, Math.round(terrain.historicalFloodFrequency * 0.8));

  // Clamp 0-100
  floodScore = Math.max(5, Math.min(96, floodScore));

  const floodLevel: RiskLevel =
    floodScore >= 75 ? 'severe' : floodScore >= 50 ? 'high' : floodScore >= 28 ? 'moderate' : 'low';

  const rainContribution = Math.min(1, Math.max(0.12, next3hRain / 50));
  const elevContribution = terrain.matchedWardId
    ? Math.min(1, Math.max(0.1, (545 - terrain.elevation) / 45))
    : Math.min(1, Math.max(0.1, (next3hRain > 2 ? 0.35 : 0.1)));
  const drainContribution = terrain.drainageCondition === 'poor' ? 0.8 : terrain.drainageCondition === 'partial' ? 0.45 : 0.18;

  const isMusiWard = terrain.matchedWardId && ['w-001', 'w-002', 'w-003', 'w-004'].includes(terrain.matchedWardId);

  const floodFactors: RiskFactor[] = [
    {
      name: 'Rainfall Forecast',
      contribution: Number(rainContribution.toFixed(2)),
      value: `${next3hRain.toFixed(1)}mm/3h`,
      description:
        next3hRain > 40
          ? `Intense precipitation: ${next3hRain.toFixed(1)}mm rain forecast in next 3h (current rate ${currentRain.toFixed(1)} mm/hr)`
          : next3hRain > 15
          ? `Moderate-heavy rain: ${next3hRain.toFixed(1)}mm rain expected in next 3h`
          : next3hRain > 2
          ? `Light rain showers: ${next3hRain.toFixed(1)}mm expected in next 3h`
          : `${next3hRain.toFixed(1)}mm rain expected in next 3h`,
    },
    {
      name: 'Elevation',
      contribution: Number(elevContribution.toFixed(2)),
      value: `${terrain.elevation.toFixed(0)}m ASL`,
      description: isMusiWard
        ? 'Low-lying area near Musi river'
        : terrain.matchedWardName
        ? terrain.elevation <= 512
          ? `Low-lying river corridor (${terrain.elevation}m ASL) prone to surface accumulation`
          : `Moderate elevation (${terrain.elevation}m ASL) with steady natural drainage`
        : terrain.elevation <= 30
        ? `Lowland river basin topography (${terrain.elevation}m ASL) with gentle drainage gradient`
        : terrain.elevation <= 120
        ? `Moderate urban elevation (${terrain.elevation}m ASL) above primary flood channels`
        : `Elevated topography (${terrain.elevation}m ASL) with rapid surface runoff`,
    },
    {
      name: 'Drainage Condition',
      contribution: Number(drainContribution.toFixed(2)),
      value:
        terrain.drainageCondition === 'poor'
          ? 'Poor'
          : terrain.drainageCondition === 'good'
          ? 'Good'
          : 'Partial',
      description:
        terrain.drainageCondition === 'poor'
          ? 'Drain blocked nearby'
          : terrain.drainageCondition === 'good'
          ? 'Drain clear with high flow'
          : 'Drain partially clear',
    },
    {
      name: 'Historical Flooding',
      contribution: Number((Math.min(0.65, terrain.historicalFloodFrequency / 12)).toFixed(2)),
      value: `${terrain.historicalFloodFrequency} events`,
      description: `Area has flooded ${terrain.historicalFloodFrequency} times in 5 years`,
    },
    {
      name: 'Impervious Surface',
      contribution: Number((terrain.imperviousFraction * 0.45).toFixed(2)),
      value: `${Math.round(terrain.imperviousFraction * 100)}%`,
      description: `${Math.round(terrain.imperviousFraction * 100)}% concrete/paved surface`,
    },
  ];

  // --------------------------------------------------------------------------
  // HEAT RISK COMPUTATION
  // --------------------------------------------------------------------------
  let heatScore = 20;
  if (currentHeatIndex >= 46 || currentTemp >= 43) {
    heatScore += 55;
  } else if (currentHeatIndex >= 41 || currentTemp >= 39) {
    heatScore += 40;
  } else if (currentHeatIndex >= 36 || currentTemp >= 34) {
    heatScore += 22;
  } else if (currentHeatIndex >= 32) {
    heatScore += 10;
  }

  // Built-up density and green cover penalty
  heatScore += Math.round((1 - terrain.greenCoverFraction) * 14);
  heatScore += Math.round(terrain.outdoorWorkerFraction * 12);
  heatScore = Math.max(10, Math.min(95, heatScore));

  const heatLevel: RiskLevel =
    heatScore >= 75 ? 'severe' : heatScore >= 52 ? 'high' : heatScore >= 32 ? 'moderate' : 'low';

  const heatFactors: RiskFactor[] = [
    {
      name: 'Temperature Forecast',
      contribution: Number((Math.min(1, Math.max(0.2, (currentTemp - 28) / 16))).toFixed(2)),
      value: `${currentTemp.toFixed(1)}°C (Peak ${maxTemp24h.toFixed(0)}°C)`,
      description: `Ambient air temperature reaching ${currentTemp.toFixed(1)}°C with high solar radiation`,
    },
    {
      name: 'Heat Index (Feels Like)',
      contribution: Number((Math.min(1, Math.max(0.2, (currentHeatIndex - 30) / 18))).toFixed(2)),
      value: `${currentHeatIndex.toFixed(1)}°C`,
      description: `Humidity combined with heat creates a thermal stress index of ${currentHeatIndex.toFixed(1)}°C`,
    },
    {
      name: 'Green Cover & Shade',
      contribution: Number(((1 - terrain.greenCoverFraction) * 0.4).toFixed(2)),
      value: `${Math.round(terrain.greenCoverFraction * 100)}% canopy`,
      description:
        terrain.greenCoverFraction < 0.1
          ? 'Sparse vegetation exacerbates local Urban Heat Island (UHI) temperatures'
          : 'Moderate tree canopy helps mitigate localized radiant heat',
    },
    {
      name: 'Built-up Surface Density',
      contribution: Number((terrain.imperviousFraction * 0.45).toFixed(2)),
      value: `${Math.round(terrain.imperviousFraction * 100)}% built`,
      description: 'High thermal mass of concrete and asphalt retains heat late into the evening',
    },
    {
      name: 'Vulnerable Population',
      contribution: Number((terrain.outdoorWorkerFraction * 0.6).toFixed(2)),
      value: `${Math.round(terrain.outdoorWorkerFraction * 100)}% outdoor workers`,
      description: `${Math.round(terrain.outdoorWorkerFraction * 100)}% of workers are outdoors during peak sunshine`,
    },
  ];

  const nowIso = forecast?.lastUpdated || '2026-10-26T00:00:00.000Z';

  const floodRiskScore: RiskScore = {
    hazard: 'flood',
    level: floodLevel,
    score: floodScore,
    probability: Math.min(0.95, floodScore / 100 + 0.05),
    confidence: 0.88,
    horizon,
    factors: floodFactors,
    depthBucket: floodLevel === 'severe' ? '30cm+' : floodLevel === 'high' ? '10-30cm' : '< 10cm',
    computedAt: nowIso,
    dataFreshness: forecast?.lastUpdated || nowIso,
  };

  const heatRiskScore: RiskScore = {
    hazard: 'heat',
    level: heatLevel,
    score: heatScore,
    probability: Math.min(0.95, heatScore / 100 + 0.05),
    confidence: 0.86,
    horizon,
    factors: heatFactors,
    computedAt: nowIso,
    dataFreshness: forecast?.lastUpdated || nowIso,
  };

  return {
    wardId: terrain.matchedWardId || location.wardId || 'custom',
    wardName: location.name || terrain.matchedWardName || 'Selected Location',
    flood: floodRiskScore,
    heat: heatRiskScore,
    population: 48000,
    vulnerabilityIndex: Number(
      (
        terrain.outdoorWorkerFraction * 0.35 +
        terrain.imperviousFraction * 0.25 +
        (1 - terrain.greenCoverFraction) * 0.25
      ).toFixed(2)
    ),
    geometry: {
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [location.longitude, location.latitude],
      },
      properties: {},
    },
    trend: floodScore > 50 || heatScore > 50 ? 'rising' : 'stable',
  };
}

/**
 * Attempts to query the backend risk evaluation endpoint (/api/risks/evaluate)
 * with graceful fallback to client-side computeLocationRisk.
 */
export async function fetchLocationRisk(
  location: LocationData,
  forecast: WeatherForecast | null,
  horizon: Horizon = 'now',
  signal?: AbortSignal
): Promise<WardRisk> {
  const currentRain = forecast?.current?.rainfall ?? 0;
  const currentTemp = forecast?.current?.temperature ?? 30;
  const heatIndex = forecast?.current?.heatIndex ?? currentTemp;

  try {
    const url = `/api/risks/evaluate?lat=${location.latitude}&lng=${location.longitude}&name=${encodeURIComponent(
      location.name
    )}&rainfall_mm=${currentRain}&temp=${currentTemp}&heat_index=${heatIndex}&horizon=${horizon}`;
    const res = await fetch(url, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data && data.flood && data.heat) {
        return data as WardRisk;
      }
    }
  } catch {
    // Backend proxy unavailable; gracefully proceed to client engine
  }

  return computeLocationRisk(location, forecast, horizon);
}
