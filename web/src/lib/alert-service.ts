/**
 * Nirvana Alert Service
 * Dynamically re-evaluates active weather and climate risk alerts for the user's
 * active location, binding live Open-Meteo observations and calculated risk factors.
 */

import { Alert, AlertSeverity, HazardType, WeatherForecast, WardRisk } from './types';
import { mockAlerts } from './mock-data';
import { LocationData } from './location-service';
import { getNearestVerifiedShelter } from './shelter-service';

/**
 * Evaluates live weather and risk conditions to produce dynamic, localized alerts.
 * Whenever lat, lng, or locationName changes, this function produces fresh alerts
 * explicitly addressed to the active micro-zone.
 */
export function evaluateDynamicAlerts(
  location: LocationData,
  forecast: WeatherForecast | null,
  risk: WardRisk | null
): Alert[] {
  const alerts: Alert[] = [];
  const locationName = location.name || 'Selected Area';
  const issuedIso = forecast?.lastUpdated || '2026-10-26T00:00:00.000Z';
  const expiresIso = '2026-10-26T23:59:59.000Z';

  // Nearest verified shelter for active coordinates
  const nearestShelter = getNearestVerifiedShelter(
    location.latitude,
    location.longitude,
    locationName
  );

  const affectedMicroZones = [
    locationName,
    ...(location.zone ? [location.zone] : []),
    ...(risk?.wardName && risk.wardName !== locationName ? [risk.wardName] : []),
  ];

  // 1. EVALUATE FLOOD / HEAVY RAINFALL CONDITIONS
  const currentRain = forecast?.current?.rainfall ?? 0;
  let next3hRain = 0;
  if (forecast?.hourly && forecast.hourly.length >= 3) {
    next3hRain = forecast.hourly.slice(0, 3).reduce((sum, h) => sum + (h.rainfall || 0), 0);
  } else {
    next3hRain = currentRain * 3;
  }

  const floodRiskLevel = risk?.flood?.level ?? 'low';

  const isFloodThreat =
    currentRain >= 4 ||
    next3hRain >= 12 ||
    floodRiskLevel === 'severe' ||
    floodRiskLevel === 'high';

  if (isFloodThreat) {
    let severity: AlertSeverity = 'warning';
    if (currentRain >= 20 || next3hRain >= 40 || floodRiskLevel === 'severe') {
      severity = 'emergency';
    } else if (currentRain >= 8 || next3hRain >= 20 || floodRiskLevel === 'high') {
      severity = 'warning';
    } else if (currentRain >= 3 || next3hRain >= 10) {
      severity = 'watch';
    } else {
      severity = 'advisory';
    }

    const title =
      severity === 'emergency'
        ? `Flash Flood Emergency — ${locationName}`
        : severity === 'warning'
        ? `Heavy Rain & Waterlogging Alert — ${locationName}`
        : `Rain & Flood Watch — ${locationName}`;

    const message = `Intense precipitation (${currentRain.toFixed(1)} mm/hr current, ~${next3hRain.toFixed(
      1
    )}mm projected in next 3 hours) detected in ${locationName}. Elevation and local drainage constraints indicate elevated waterlogging risk along roads and low-lying crossings. Move valuables above floor level and stay alert.`;

    const actions = [
      'Avoid waterlogged roads, open stormwater channels, and railway underpasses',
      'Move critical electronics, groceries, and documentation above floor level',
      'Keep local emergency helpline 112 and flood disaster cell (040-21111111) ready',
      `Nearest emergency shelter is ${nearestShelter.name} (${nearestShelter.distance ? (nearestShelter.distance < 1000 ? `${nearestShelter.distance}m` : `${(nearestShelter.distance / 1000).toFixed(1)}km`) : 'nearby'}, ~${nearestShelter.walkingTime || 10} min walk)`,
    ];

    const wardPop = risk?.population || 48000;

    alerts.push({
      id: `alert-flood-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`,
      hazard: 'flood' as HazardType,
      severity,
      title,
      message,
      actions,
      wardIds: [location.wardId || 'custom'],
      wardNames: affectedMicroZones,
      issuedAt: issuedIso,
      expiresAt: expiresIso,
      isActive: true,
      language: 'en',
      nearestShelter,
      channels: ['in_app', 'push', 'sms'],
      sentBy: 'Nirvana Automated Early Warning Engine',
      estimatedReach: wardPop,
    });
  }

  // 2. EVALUATE HEAT WAVE / THERMAL STRESS CONDITIONS
  const currentTemp = forecast?.current?.temperature ?? 30;
  const heatIndex = forecast?.current?.heatIndex ?? currentTemp;
  const heatRiskLevel = risk?.heat?.level ?? 'low';

  const isHeatThreat =
    heatIndex >= 38 ||
    currentTemp >= 37 ||
    heatRiskLevel === 'severe' ||
    heatRiskLevel === 'high';

  if (isHeatThreat) {
    let severity: AlertSeverity = 'warning';
    if (heatIndex >= 44 || currentTemp >= 42 || heatRiskLevel === 'severe') {
      severity = 'emergency';
    } else if (heatIndex >= 40 || currentTemp >= 38 || heatRiskLevel === 'high') {
      severity = 'warning';
    } else if (heatIndex >= 37) {
      severity = 'watch';
    } else {
      severity = 'advisory';
    }

    const title =
      severity === 'emergency'
        ? `Extreme Heat Wave Emergency — ${locationName}`
        : severity === 'warning'
        ? `Heat Wave Alert — ${locationName}`
        : `High Heat Advisory — ${locationName}`;

    const message = `Heat index has reached ${heatIndex.toFixed(1)}°C with ambient temperatures of ${currentTemp.toFixed(
      1
    )}°C in ${locationName}. Severe thermal stress danger for outdoor workers, senior citizens, and young children. Avoid peak sunlight hours and drink fluids every 20-30 minutes.`;

    const actions = [
      'Stay indoors between 11:00 AM and 4:00 PM during maximum solar irradiance',
      'Hydrate regularly with water, ORS electrolytes, or fresh lemon juice',
      'Ensure outdoor laborers and elderly residents rest in well-ventilated shade',
      `Visit nearest verified cooling center at ${nearestShelter.name} if feeling dizzy or disoriented`,
    ];

    const wardPop = risk?.population || 48000;

    alerts.push({
      id: `alert-heat-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`,
      hazard: 'heat' as HazardType,
      severity,
      title,
      message,
      actions,
      wardIds: [location.wardId || 'custom'],
      wardNames: affectedMicroZones,
      issuedAt: issuedIso,
      expiresAt: expiresIso,
      isActive: true,
      language: 'en',
      nearestShelter,
      channels: ['in_app', 'push', 'sms', 'whatsapp'],
      sentBy: 'Nirvana Automated Early Warning Engine',
      estimatedReach: wardPop,
    });
  }

  // 3. EVALUATE SEVERE THUNDERSTORM / SQUALL CONDITIONS
  const wmoCode = forecast?.current?.weatherCode ?? 0;
  const windSpeed = forecast?.current?.windSpeed ?? 0;
  if ((wmoCode >= 95 && wmoCode <= 99) || windSpeed > 45) {
    const wardPop = risk?.population || 48000;
    alerts.push({
      id: `alert-thunder-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`,
      hazard: 'flood' as HazardType,
      severity: 'warning',
      title: `Severe Thunderstorm & Squall Alert — ${locationName}`,
      message: `Active thunderstorm with localized wind gusts of ${windSpeed.toFixed(
        0
      )} km/h and lightning strikes reported across ${locationName}. Stay clear of tin sheds, trees, and precarious signboards.`,
      actions: [
        'Seek shelter inside sturdy permanent buildings',
        'Stay away from tall trees, electric transmission lines, and metal poles',
        'Unplug sensitive electrical devices until storm activity passes',
      ],
      wardIds: [location.wardId || 'custom'],
      wardNames: affectedMicroZones,
      issuedAt: issuedIso,
      expiresAt: expiresIso,
      isActive: true,
      language: 'en',
      nearestShelter,
      channels: ['in_app', 'push'],
      sentBy: 'Nirvana Automated Early Warning Engine',
      estimatedReach: wardPop,
    });
  }

  // 4. CHECK MATCHING MUNICIPAL / CIVIC ALERTS
  // If no live alert was triggered by weather, but official alerts match the active ward,
  // adapt them dynamically to highlight the user's active location.
  if (alerts.length === 0 && location.wardId) {
    const matchedOfficial = mockAlerts.filter(
      (a) => a.isActive && a.wardIds.includes(location.wardId!)
    );
    for (const off of matchedOfficial) {
      alerts.push({
        ...off,
        title: `${off.title.split('—')[0].trim()} — ${locationName}`,
        wardNames: affectedMicroZones,
        nearestShelter,
      });
    }
  }

  // Sort by severity: emergency > warning > watch > advisory
  const severityRank: Record<AlertSeverity, number> = {
    emergency: 4,
    warning: 3,
    watch: 2,
    advisory: 1,
  };

  alerts.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);

  return alerts;
}
