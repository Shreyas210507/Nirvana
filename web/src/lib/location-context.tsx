'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  LocationData,
  LocationError,
  getBrowserLocation,
  reverseGeocode,
  getSavedLocation,
  saveSelectedLocation,
  DEFAULT_HYDERABAD_LOCATION,
  validateCoordinates,
} from './location-service';

interface LocationContextType {
  currentLocation: LocationData;
  isLocating: boolean;
  locationError: LocationError | null;
  requestDeviceLocation: () => Promise<LocationData>;
  selectLocation: (location: LocationData) => void;
  selectCoordinates: (latitude: number, longitude: number, customName?: string) => Promise<LocationData>;
  clearLocationError: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<LocationData>(DEFAULT_HYDERABAD_LOCATION);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<LocationError | null>(null);

  // Counter to prevent older async requests from overwriting newer selections
  const requestVersionRef = useRef(0);

  // Initialize from storage on mount
  useEffect(() => {
    const saved = getSavedLocation();
    if (saved) {
      setCurrentLocation(saved);
    }
  }, []);

  const requestDeviceLocation = useCallback(async (): Promise<LocationData> => {
    const currentVersion = ++requestVersionRef.current;
    setIsLocating(true);
    setLocationError(null);

    try {
      const coords = await getBrowserLocation();
      
      // If a newer location request was initiated in the meantime, ignore this one
      if (currentVersion !== requestVersionRef.current) {
        return currentLocation;
      }

      const geo = await reverseGeocode(coords.latitude, coords.longitude);

      if (currentVersion !== requestVersionRef.current) {
        return currentLocation;
      }

      const newLoc: LocationData = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        name: geo.name,
        zone: geo.zone,
        wardId: geo.wardId,
        isDeviceLocation: true,
        accuracy: coords.accuracy,
        timestamp: Date.now(),
      };

      setCurrentLocation(newLoc);
      saveSelectedLocation(newLoc);
      return newLoc;
    } catch (err: unknown) {
      if (currentVersion === requestVersionRef.current) {
        const locErr = err as LocationError;
        setLocationError(locErr);
      }
      throw err;
    } finally {
      if (currentVersion === requestVersionRef.current) {
        setIsLocating(false);
      }
    }
  }, [currentLocation]);

  const selectLocation = useCallback((location: LocationData) => {
    // Invalidate pending async geolocation requests
    requestVersionRef.current++;
    setIsLocating(false);
    setLocationError(null);

    const validation = validateCoordinates(location.latitude, location.longitude);
    if (!validation.valid || validation.latitude === undefined || validation.longitude === undefined) {
      setLocationError({
        code: 'INVALID_COORDINATES',
        message: validation.error || 'Invalid coordinates provided for location.',
        recoverable: true,
      });
      return;
    }

    const validatedLocation: LocationData = {
      ...location,
      latitude: validation.latitude,
      longitude: validation.longitude,
      timestamp: Date.now(),
    };

    setCurrentLocation(validatedLocation);
    saveSelectedLocation(validatedLocation);
  }, []);

  const selectCoordinates = useCallback(
    async (latitude: number, longitude: number, customName?: string): Promise<LocationData> => {
      const currentVersion = ++requestVersionRef.current;
      setIsLocating(true);
      setLocationError(null);

      const validation = validateCoordinates(latitude, longitude);
      if (!validation.valid || validation.latitude === undefined || validation.longitude === undefined) {
        setIsLocating(false);
        const err: LocationError = {
          code: 'INVALID_COORDINATES',
          message: validation.error || 'Coordinates out of bounds.',
          recoverable: true,
        };
        setLocationError(err);
        throw err;
      }

      try {
        let name = customName;
        let zone: string | undefined;
        let wardId: string | undefined;

        if (!name) {
          const geo = await reverseGeocode(validation.latitude, validation.longitude);
          name = geo.name;
          zone = geo.zone;
          wardId = geo.wardId;
        }

        if (currentVersion !== requestVersionRef.current) {
          return currentLocation;
        }

        const newLoc: LocationData = {
          latitude: validation.latitude,
          longitude: validation.longitude,
          name: name || 'Selected Area',
          zone,
          wardId,
          isDeviceLocation: false,
          timestamp: Date.now(),
        };

        setCurrentLocation(newLoc);
        saveSelectedLocation(newLoc);
        return newLoc;
      } finally {
        if (currentVersion === requestVersionRef.current) {
          setIsLocating(false);
        }
      }
    },
    [currentLocation]
  );

  const clearLocationError = useCallback(() => {
    setLocationError(null);
  }, []);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isLocating,
        locationError,
        requestDeviceLocation,
        selectLocation,
        selectCoordinates,
        clearLocationError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
