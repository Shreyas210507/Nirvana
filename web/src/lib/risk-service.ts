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
 * Resolves local terrain profile for given coordinates:
 * Checks closest Hyderabad ward within 5km for exact civic survey metrics;
 * otherwise derives terrain characteristics for custom locations.
 */
export function resolveLocationTerrain(lat: number, lng: number): LocationTerrainProfile {
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

  // Derive reasonable terrain profile for custom locations outside pilot wards
  // Regional elevation baseline around Deccan plateau / urban plains
  const baseElev = 525 + Math.round((Math.sin(lat * 10) + Math.cos(lng * 10)) * 18);
  return {
    elevation: Math.max(480, Math.min(590, baseElev)),
    drainageCondition: 'partial',
    imperviousFraction: 0.72,
    greenCoverFraction: 0.12,
    historicalFloodFrequency: 4,
    historicalHeatwaveDays: 14,
    outdoorWorkerFraction: 0.28,
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
  const terrain = resolveLocationTerrain(location.latitude, location.longitude);

  // 1. Extract live rainfall metrics
  const currentRain = forecast?.current?.rainfall ?? 0;
  let next3hRain = 0;
  let next24hRain = 0;

  if (forecast?.hourly && forecast.hourly.length > 0) {
    // Horizon index offset
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
  const currentTemp = forecast?.current?.temperature ?? 32;
  const currentHeatIndex = forecast?.current?.heatIndex ?? currentTemp;
  const maxTemp24h = forecast?.daily?.[0]?.tempMax ?? currentTemp;
  const maxHeatIndex24h = forecast?.daily?.[0]?.heatIndexMax ?? currentHeatIndex;

  // --------------------------------------------------------------------------
  // FLOOD RISK COMPUTATION
  // --------------------------------------------------------------------------
  // Rainfall weight: 0.35, Elevation weight: 0.25, Drainage: 0.20, Impervious/History: 0.20
  let floodScore = 15; // baseline

  // Rain component
  if (next3hRain > 50 || currentRain > 25) {
    floodScore += 50;
  } else if (next3hRain > 25 || currentRain > 12) {
    floodScore += 38;
  } else if (next3hRain > 10 || currentRain > 4) {
    floodScore += 24;
  } else if (next3hRain > 2 || currentRain > 0.5) {
    floodScore += 12;
  }

  // Elevation component (Regional average ~540m; lower elevation increases pooling)
  const elevDeficit = Math.max(0, 540 - terrain.elevation);
  floodScore += Math.min(25, Math.round((elevDeficit / 35) * 22));

  // Drainage component
  if (terrain.drainageCondition === 'poor') {
    floodScore += 18;
  } else if (terrain.drainageCondition === 'partial') {
    floodScore += 8;
  } else {
    floodScore -= 5;
  }

  // Impervious surface & history
  floodScore += Math.round(terrain.imperviousFraction * 10);
  floodScore += Math.min(10, Math.round(terrain.historicalFloodFrequency * 0.9));

  // Clamp 0-100
  floodScore = Math.max(8, Math.min(96, floodScore));

  const floodLevel: RiskLevel =
    floodScore >= 75 ? 'severe' : floodScore >= 52 ? 'high' : floodScore >= 32 ? 'moderate' : 'low';

  const rainContribution = Math.min(1, Math.max(0.15, next3hRain / 50));
  const elevContribution = Math.min(1, Math.max(0.1, (550 - terrain.elevation) / 45));
  const drainContribution = terrain.drainageCondition === 'poor' ? 0.8 : terrain.drainageCondition === 'partial' ? 0.45 : 0.18;

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
          : `Dry conditions: ${next3hRain.toFixed(1)}mm rainfall expected in next 3 hours`,
    },
    {
      name: 'Elevation ASL',
      contribution: Number(elevContribution.toFixed(2)),
      value: `${terrain.elevation.toFixed(0)}m ASL`,
      description:
        terrain.elevation <= 512
          ? `Low-lying depression (${terrain.elevation}m ASL) prone to rapid surface water accumulation`
          : terrain.elevation <= 535
          ? `Moderate elevation (${terrain.elevation}m ASL) with moderate natural drainage gradient`
          : `High plateau elevation (${terrain.elevation}m ASL) well above primary floodplains`,
    },
    {
      name: 'Drainage Condition',
      contribution: Number(drainContribution.toFixed(2)),
      value:
        terrain.drainageCondition === 'poor'
          ? 'Poor (Restricted)'
          : terrain.drainageCondition === 'good'
          ? 'Good (High Flow)'
          : 'Partial Capacity',
      description:
        terrain.drainageCondition === 'poor'
          ? 'Stormwater nalas have restricted outflow and frequent siltation'
          : terrain.drainageCondition === 'good'
          ? 'Clear concrete stormwater drains capable of handling high runoff'
          : 'Moderate stormwater capacity with potential local backflow during surges',
    },
    {
      name: 'Impervious Surface',
      contribution: Number((terrain.imperviousFraction * 0.5).toFixed(2)),
      value: `${Math.round(terrain.imperviousFraction * 100)}% paved`,
      description: `${Math.round(terrain.imperviousFraction * 100)}% paved/built area impedes ground infiltration`,
    },
    {
      name: 'Historical Flooding',
      contribution: Number((Math.min(0.65, terrain.historicalFloodFrequency / 12)).toFixed(2)),
      value: `${terrain.historicalFloodFrequency} recorded events`,
      description: `Locality experienced ${terrain.historicalFloodFrequency} waterlogging incidents in recent seasons`,
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

  const nowIso = new Date().toISOString();

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
