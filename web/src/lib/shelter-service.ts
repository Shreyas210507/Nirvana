/**
 * Nirvana Shelter Service
 * Dynamically computes nearest verified shelters relative to user's active coordinates,
 * calculates real Great-Circle distances, walking/driving times, and provides
 * localized fallback shelters when outside primary pilot ward coverage.
 */

import { Shelter, ShelterType } from './types';
import { hyderabadShelters } from './mock-data';
import { calculateDistanceKm } from './location-service';

export interface ShelterFilterOptions {
  filterType?: string;
  verifiedOnly?: boolean;
  limit?: number;
}

/**
 * Synthesizes localized emergency shelters around any coordinate set
 * when the user is located far from pre-seeded municipal shelters.
 */
function generateLocalSheltersForCoordinates(
  lat: number,
  lng: number,
  locationName: string = 'Current Area'
): Shelter[] {
  const isIndia = lat >= 6.5 && lat <= 37.5 && lng >= 68.0 && lng <= 97.5;
  const isTelangana = lat >= 15.8 && lat <= 19.9 && lng >= 77.2 && lng <= 81.8;

  const defaultElevation = isTelangana ? 535 : isIndia ? 250 : 25;
  const emergencyContact1 = isIndia ? '112 / Local Control' : '999 / 112 Emergency';
  const emergencyContact2 = isIndia ? '1077 (Disaster Helpline)' : 'Local Civic Response';
  const medicalContact = isIndia ? '108 (Ambulance)' : '111 / Emergency Medical';
  const authorityVerified = 'Illustrative Demonstration Data';

  // Minor coordinate offsets (~500m to ~2km)
  return [
    {
      id: `local-s-001-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: `${locationName} Community Relief Centre`,
      nameLocal: isTelangana ? 'సామాజిక సహాయ కేంద్రం' : undefined,
      type: 'community_hall' as ShelterType,
      lat: Number((lat + 0.0055).toFixed(5)),
      lng: Number((lng + 0.0042).toFixed(5)),
      address: `Civic Center Road, ${locationName}`,
      contact: emergencyContact1,
      capacity: 450,
      currentOccupancy: 45,
      facilities: {
        water: true,
        toilets: true,
        power: true,
        medical: true,
        accessible: true,
        womenSafe: true,
        petFriendly: false,
      },
      operatingHours: '24/7 emergency activation',
      floodSafe: true,
      elevationM: defaultElevation,
      verificationStatus: 'illustrative_demo',
      lastVerified: '2026-10-26T00:00:00.000Z',
      verifiedBy: authorityVerified,
    },
    {
      id: `local-s-002-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: `${locationName} Civic High School`,
      nameLocal: isTelangana ? 'ప్రభుత్వ ఉన్నత పాఠశాల' : undefined,
      type: 'school' as ShelterType,
      lat: Number((lat - 0.0065).toFixed(5)),
      lng: Number((lng + 0.0058).toFixed(5)),
      address: `Station Approach, ${locationName}`,
      contact: emergencyContact2,
      capacity: 350,
      currentOccupancy: 12,
      facilities: {
        water: true,
        toilets: true,
        power: true,
        medical: false,
        accessible: true,
        womenSafe: true,
        petFriendly: true,
      },
      operatingHours: '24/7 during weather alerts',
      floodSafe: true,
      elevationM: defaultElevation + 4,
      verificationStatus: 'illustrative_demo',
      lastVerified: '2026-10-26T00:00:00.000Z',
      verifiedBy: authorityVerified,
    },
    {
      id: `local-s-003-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: `${locationName} Central Hospital & Relief Wing`,
      nameLocal: isTelangana ? 'ప్రభుత్వ ఆసుపత్రి' : undefined,
      type: 'hospital' as ShelterType,
      lat: Number((lat + 0.0082).toFixed(5)),
      lng: Number((lng - 0.0075).toFixed(5)),
      address: `Hospital Road, ${locationName}`,
      contact: medicalContact,
      capacity: 600,
      currentOccupancy: 190,
      facilities: {
        water: true,
        toilets: true,
        power: true,
        medical: true,
        accessible: true,
        womenSafe: true,
        petFriendly: false,
      },
      operatingHours: '24/7 round the clock',
      floodSafe: true,
      elevationM: defaultElevation + 2,
      verificationStatus: 'illustrative_demo',
      lastVerified: '2026-10-26T00:00:00.000Z',
      verifiedBy: authorityVerified,
    },
    {
      id: `local-s-004-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: `${locationName} Cooling & Heat Relief Facility`,
      nameLocal: isTelangana ? 'శీతలీకరణ కేంద్రం' : undefined,
      type: 'cooling_centre' as ShelterType,
      lat: Number((lat - 0.0092).toFixed(5)),
      lng: Number((lng - 0.0088).toFixed(5)),
      address: `Urban Health Complex, ${locationName}`,
      contact: emergencyContact1,
      capacity: 200,
      currentOccupancy: 28,
      facilities: {
        water: true,
        toilets: true,
        power: true,
        medical: true,
        accessible: true,
        womenSafe: true,
        petFriendly: false,
      },
      operatingHours: '08:00 AM - 08:00 PM',
      floodSafe: true,
      elevationM: defaultElevation,
      verificationStatus: 'illustrative_demo',
      lastVerified: '2026-10-26T00:00:00.000Z',
      verifiedBy: authorityVerified,
    },
    {
      id: `local-s-005-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: `${locationName} Sports Complex Camp`,
      nameLocal: isTelangana ? 'స్టేడియం సహాయ శిబిరం' : undefined,
      type: 'relief_camp' as ShelterType,
      lat: Number((lat + 0.014).toFixed(5)),
      lng: Number((lng + 0.012).toFixed(5)),
      address: `Sports Authority Grounds, ${locationName}`,
      contact: emergencyContact2,
      capacity: 800,
      currentOccupancy: 0,
      facilities: {
        water: true,
        toilets: true,
        power: true,
        medical: true,
        accessible: true,
        womenSafe: true,
        petFriendly: true,
      },
      operatingHours: 'Activated for severe emergencies',
      floodSafe: true,
      elevationM: defaultElevation + 5,
      verificationStatus: 'illustrative_demo',
      lastVerified: '2026-10-26T00:00:00.000Z',
      verifiedBy: authorityVerified,
    },
  ];
}

/**
 * Calculates dynamic distances (in meters) and walking/driving times (in minutes)
 * for all shelters relative to user's active coordinates.
 */
export function computeNearbyShelters(
  userLat: number,
  userLng: number,
  locationName?: string,
  options: ShelterFilterOptions = {}
): Shelter[] {
  const { filterType = 'all', verifiedOnly = false, limit } = options;

  // Check closest shelter in known Hyderabad dataset
  let minKnownDistanceKm = Infinity;
  for (const s of hyderabadShelters) {
    const d = calculateDistanceKm(userLat, userLng, s.lat, s.lng);
    if (d < minKnownDistanceKm) {
      minKnownDistanceKm = d;
    }
  }

  // If user is within 35 km of Hyderabad, use real dataset; otherwise provide synthesized local shelters
  const baseList: Shelter[] =
    minKnownDistanceKm <= 35
      ? hyderabadShelters
      : generateLocalSheltersForCoordinates(userLat, userLng, locationName);

  // Compute accurate metrics relative to active location
  const withMetrics: Shelter[] = baseList.map((shelter) => {
    const distKm = calculateDistanceKm(userLat, userLng, shelter.lat, shelter.lng);
    const distanceMeters = Math.round(distKm * 1000);
    // Standard urban walking speed: ~80 meters/min (~4.8 km/h)
    const walkingMinutes = Math.max(1, Math.round(distanceMeters / 80));

    return {
      ...shelter,
      distance: distanceMeters,
      walkingTime: walkingMinutes,
    };
  });

  // Apply filters
  let filtered = withMetrics.filter((s) => {
    if (filterType !== 'all' && s.type !== filterType) {
      return false;
    }
    if (verifiedOnly && !s.verificationStatus.includes('verified')) {
      return false;
    }
    return true;
  });

  // Sort strictly by proximity
  filtered.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

  if (limit && limit > 0) {
    return filtered.slice(0, limit);
  }

  return filtered;
}

/**
 * Retrieves the single closest verified shelter for the active coordinates.
 */
export function getNearestVerifiedShelter(
  userLat: number,
  userLng: number,
  locationName?: string
): Shelter {
  const verified = computeNearbyShelters(userLat, userLng, locationName, {
    verifiedOnly: true,
    limit: 1,
  });

  if (verified.length > 0) {
    return verified[0];
  }

  // Fallback to any closest shelter
  const anyShelter = computeNearbyShelters(userLat, userLng, locationName, { limit: 1 });
  return anyShelter[0] || hyderabadShelters[0];
}

/**
 * Formats distance cleanly for UI display (e.g. "650m" or "2.4 km").
 */
export function formatShelterDistance(distanceMeters?: number): string {
  if (distanceMeters === undefined || distanceMeters === null) return 'Nearby';
  if (distanceMeters < 1000) {
    return `${distanceMeters}m`;
  }
  return `${(distanceMeters / 1000).toFixed(1)} km`;
}

/**
 * Formats travel times (walking and estimated driving).
 */
export function formatTravelTimes(distanceMeters?: number): { walking: string; driving: string } {
  if (!distanceMeters) {
    return { walking: '5 min walk', driving: '2 min drive' };
  }
  const walkMin = Math.max(1, Math.round(distanceMeters / 80));
  const driveMin = Math.max(1, Math.round(distanceMeters / 500));

  const walkingStr = walkMin < 60 ? `${walkMin} min walk` : `${(walkMin / 60).toFixed(1)}h walk`;
  const drivingStr = driveMin < 60 ? `${driveMin} min drive` : `${(driveMin / 60).toFixed(1)}h drive`;

  return { walking: walkingStr, driving: drivingStr };
}
