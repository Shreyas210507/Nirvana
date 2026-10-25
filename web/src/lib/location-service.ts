/**
 * Nirvana Location Service
 * Handles native browser geolocation, strict coordinate validation,
 * reverse geocoding, locality search, and persistent location state.
 */

import { hyderabadWards } from './mock-data';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  name: string;
  zone?: string;
  wardId?: string;
  country?: string;
  admin1?: string;
  isDeviceLocation: boolean;
  accuracy?: number;
  timestamp: number;
}

export type LocationErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NOT_SUPPORTED'
  | 'INSECURE_CONTEXT'
  | 'INVALID_COORDINATES'
  | 'GEOCODING_FAILED';

export interface LocationError {
  code: LocationErrorCode;
  message: string;
  recoverable: boolean;
  details?: string;
}

const STORAGE_KEY_LOCATION = 'nirvana_selected_location';

/**
 * Strict coordinate validation:
 * Latitude must be a finite number between -90 and 90.
 * Longitude must be a finite number between -180 and 180.
 * Rejects NaN, Infinity, null, undefined, strings, and out-of-bounds coordinates.
 */
export function validateCoordinates(
  lat: unknown,
  lng: unknown
): { valid: boolean; latitude?: number; longitude?: number; error?: string } {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { valid: false, error: 'Latitude and longitude coordinates are required.' };
  }

  const numLat = typeof lat === 'number' ? lat : Number(lat);
  const numLng = typeof lng === 'number' ? lng : Number(lng);

  if (!Number.isFinite(numLat) || Number.isNaN(numLat)) {
    return { valid: false, error: 'Latitude must be a valid finite number.' };
  }

  if (!Number.isFinite(numLng) || Number.isNaN(numLng)) {
    return { valid: false, error: 'Longitude must be a valid finite number.' };
  }

  if (numLat < -90 || numLat > 90) {
    return { valid: false, error: `Latitude ${numLat} is out of bounds (must be between -90 and 90).` };
  }

  if (numLng < -180 || numLng > 180) {
    return { valid: false, error: `Longitude ${numLng} is out of bounds (must be between -180 and 180).` };
  }

  return {
    valid: true,
    latitude: Number(numLat.toFixed(6)),
    longitude: Number(numLng.toFixed(6)),
  };
}

/**
 * Calculate Great-Circle distance (Haversine formula) in kilometers between two points.
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Retrieve current location using browser Geolocation API.
 * Configured with high accuracy, a 10s timeout, and no stale cache.
 */
export function getBrowserLocation(): Promise<GeoCoordinates> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      const err: LocationError = {
        code: 'NOT_SUPPORTED',
        message: 'Browser geolocation is not supported on this device or environment.',
        recoverable: true,
      };
      return reject(err);
    }

    // Geolocation requires a secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      const err: LocationError = {
        code: 'INSECURE_CONTEXT',
        message: 'Geolocation requires a secure connection (HTTPS). Please search for your city manually.',
        recoverable: true,
      };
      return reject(err);
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const validation = validateCoordinates(position.coords.latitude, position.coords.longitude);
        if (!validation.valid || validation.latitude === undefined || validation.longitude === undefined) {
          const err: LocationError = {
            code: 'INVALID_COORDINATES',
            message: validation.error || 'Device returned invalid coordinates.',
            recoverable: true,
          };
          return reject(err);
        }

        resolve({
          latitude: validation.latitude,
          longitude: validation.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp || Date.now(),
        });
      },
      (error) => {
        let code: LocationErrorCode = 'POSITION_UNAVAILABLE';
        let message = 'Unable to determine your current location. Please try again or select a city.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            code = 'PERMISSION_DENIED';
            message = 'Location access was denied. Please allow location permissions in your browser or search for your city.';
            break;
          case error.POSITION_UNAVAILABLE:
            code = 'POSITION_UNAVAILABLE';
            message = 'Current location signal is unavailable. Please check your GPS/network settings or search manually.';
            break;
          case error.TIMEOUT:
            code = 'TIMEOUT';
            message = 'Location request timed out. Please try again or search for your location.';
            break;
        }

        const err: LocationError = {
          code,
          message,
          recoverable: true,
          details: error.message,
        };
        reject(err);
      },
      options
    );
  });
}

/**
 * Reverse geocode coordinates to a place name:
 * 1. Checks proximity to known Hyderabad wards first.
 * 2. If not within immediate ward range, queries Open-Meteo or BigDataCloud reverse geocoding API.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ name: string; zone?: string; wardId?: string }> {
  // Check known Hyderabad wards
  let closestWard: { ward: (typeof hyderabadWards)[0]; distance: number } | null = null;

  for (const ward of hyderabadWards) {
    if (ward.geometry && ward.geometry.geometry) {
      // Use ward polygon centroid or coordinates
      const coords = (ward.geometry.geometry as { coordinates?: number[][][] }).coordinates?.[0];
      if (coords && coords.length > 0) {
        const centerLng = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
        const centerLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
        const dist = calculateDistanceKm(lat, lng, centerLat, centerLng);
        if (!closestWard || dist < closestWard.distance) {
          closestWard = { ward, distance: dist };
        }
      }
    }
  }

  // If within 4 km of a Hyderabad ward centroid, associate with that ward
  if (closestWard && closestWard.distance <= 4.0) {
    return {
      name: closestWard.ward.name,
      zone: closestWard.ward.zone,
      wardId: closestWard.ward.id,
    };
  }

  // Fallback to free BigDataCloud client reverse geocoding (no API key required)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const locality = data.locality || data.city || data.principalSubdivision || data.countryName;
      if (locality) {
        return {
          name: `${locality}${data.principalSubdivision ? `, ${data.principalSubdivision}` : ''}`,
          zone: data.countryName,
        };
      }
    }
  } catch {
    // If external reverse geocode fails, format coordinates cleanly
  }

  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return {
    name: `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lng).toFixed(2)}° ${lngDir}`,
  };
}

/**
 * Search locations by name (city, ward, or area):
 * 1. Checks matching Hyderabad wards first for instant, accurate hyperlocal results.
 * 2. Uses Open-Meteo's official free geocoding API for any city globally.
 */
export async function searchLocations(query: string): Promise<LocationData[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const results: LocationData[] = [];

  // Match local wards
  const matchingWards = hyderabadWards.filter(
    (w) =>
      w.name.toLowerCase().includes(q) ||
      (w.nameLocal && w.nameLocal.toLowerCase().includes(q)) ||
      w.zone.toLowerCase().includes(q)
  );

  for (const ward of matchingWards) {
    const coords = (ward.geometry.geometry as { coordinates?: number[][][] }).coordinates?.[0];
    if (coords && coords.length > 0) {
      const centerLng = coords.reduce((acc, c) => acc + c[0], 0) / coords.length;
      const centerLat = coords.reduce((acc, c) => acc + c[1], 0) / coords.length;
      results.push({
        latitude: Number(centerLat.toFixed(6)),
        longitude: Number(centerLng.toFixed(6)),
        name: ward.name,
        zone: ward.zone,
        wardId: ward.id,
        country: 'India',
        admin1: 'Telangana',
        isDeviceLocation: false,
        timestamp: Date.now(),
      });
    }
  }

  // Query Open-Meteo Geocoding API for cities
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results) {
          const validation = validateCoordinates(item.latitude, item.longitude);
          if (validation.valid && validation.latitude !== undefined && validation.longitude !== undefined) {
            // Avoid duplicate with ward
            const exists = results.some(
              (r) =>
                Math.abs(r.latitude - validation.latitude!) < 0.01 &&
                Math.abs(r.longitude - validation.longitude!) < 0.01
            );
            if (!exists) {
              results.push({
                latitude: validation.latitude,
                longitude: validation.longitude,
                name: item.name,
                zone: item.admin1 || item.country,
                country: item.country,
                admin1: item.admin1,
                isDeviceLocation: false,
                timestamp: Date.now(),
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn('Open-Meteo geocoding search failed:', err);
  }

  return results;
}

/**
 * Storage helpers for persisting the user's selected location across page reloads.
 */
export function getSavedLocation(): LocationData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY_LOCATION);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const validation = validateCoordinates(parsed.latitude, parsed.longitude);
    if (!validation.valid || !parsed.name) {
      localStorage.removeItem(STORAGE_KEY_LOCATION);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY_LOCATION);
    return null;
  }
}

export function saveSelectedLocation(location: LocationData): void {
  if (typeof window === 'undefined') return;
  const validation = validateCoordinates(location.latitude, location.longitude);
  if (validation.valid) {
    localStorage.setItem(STORAGE_KEY_LOCATION, JSON.stringify(location));
  }
}

/**
 * Default fallback location (Hyderabad Malakpet) used ONLY when no location has been selected.
 */
export const DEFAULT_HYDERABAD_LOCATION: LocationData = {
  latitude: 17.385,
  longitude: 78.4867,
  name: 'Malakpet',
  zone: 'Charminar Zone',
  wardId: 'w-001',
  country: 'India',
  admin1: 'Telangana',
  isDeviceLocation: false,
  timestamp: Date.now(),
};
