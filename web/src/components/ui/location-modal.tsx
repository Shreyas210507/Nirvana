'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Crosshair,
  Search,
  X,
  AlertCircle,
  Check,
  Building,
  Navigation,
  Globe,
} from 'lucide-react';
import { useLocation } from '@/lib/location-context';
import { searchLocations, LocationData } from '@/lib/location-service';
import { hyderabadWards } from '@/lib/mock-data';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected?: (loc: LocationData) => void;
}

export function LocationModal({ isOpen, onClose, onLocationSelected }: LocationModalProps) {
  const {
    currentLocation,
    isLocating,
    locationError,
    requestDeviceLocation,
    selectLocation,
    clearLocationError,
  } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery.trim());
        setSearchResults(results);
      } catch (err) {
        console.warn('Location search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleUseDeviceLocation = async () => {
    clearLocationError();
    try {
      const loc = await requestDeviceLocation();
      if (onLocationSelected) {
        onLocationSelected(loc);
      }
      onClose();
    } catch {
      // Error handled in context state
    }
  };

  const handleSelectWard = (wardId: string) => {
    const ward = hyderabadWards.find((w) => w.id === wardId);
    if (!ward) return;

    const coords = (ward.geometry.geometry as { coordinates?: number[][][] }).coordinates?.[0];
    const centerLng = coords ? coords.reduce((acc, c) => acc + c[0], 0) / coords.length : 78.4867;
    const centerLat = coords ? coords.reduce((acc, c) => acc + c[1], 0) / coords.length : 17.385;

    const loc: LocationData = {
      latitude: Number(centerLat.toFixed(6)),
      longitude: Number(centerLng.toFixed(6)),
      name: ward.name,
      zone: ward.zone,
      wardId: ward.id,
      country: 'India',
      admin1: 'Telangana',
      isDeviceLocation: false,
      timestamp: Date.now(),
    };

    selectLocation(loc);
    if (onLocationSelected) {
      onLocationSelected(loc);
    }
    onClose();
  };

  const handleSelectSearchResult = (loc: LocationData) => {
    selectLocation(loc);
    if (onLocationSelected) {
      onLocationSelected(loc);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl border border-sand-200 shadow-soft-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-sand-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal/10 text-teal flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-ink text-base font-display">Select Your Location</h2>
                <p className="text-xs text-ink-400">Accurate weather & risk data for your locality</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 text-ink-500 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Current Active Location Pill */}
            <div className="rounded-2xl bg-cream-100 p-3.5 border border-sand-200 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal">Currently Selected</span>
                <p className="text-sm font-bold text-ink truncate mt-0.5">{currentLocation.name}</p>
                <p className="text-[11px] text-ink-400">
                  {currentLocation.latitude.toFixed(4)}° N, {currentLocation.longitude.toFixed(4)}° E
                  {currentLocation.isDeviceLocation && ' • GPS Accurate'}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-teal text-white flex items-center justify-center text-xs">
                <Check className="w-4 h-4" />
              </div>
            </div>

            {/* Error Message if GPS failed */}
            <AnimatePresence>
              {locationError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 space-y-1.5"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1 font-medium">{locationError.message}</div>
                    <button
                      onClick={clearLocationError}
                      className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                    >
                      ×
                    </button>
                  </div>
                  <p className="text-[11px] text-rose-700 pl-6">
                    You can search your ward or city below without requiring device location permission.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Browser Device Location Button */}
            <button
              onClick={handleUseDeviceLocation}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-sm shadow-glow-teal transition-all disabled:opacity-60"
            >
              {isLocating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Requesting Device GPS...</span>
                </>
              ) : (
                <>
                  <Crosshair className="w-4 h-4" />
                  <span>Use My Current GPS Location</span>
                </>
              )}
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ward, locality, or city (e.g. Begumpet, Mumbai)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-sand-200 text-sm text-ink bg-white placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Results List */}
            {isSearching && (
              <div className="text-center py-4 text-xs text-ink-400 flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                <span>Searching locations...</span>
              </div>
            )}

            {searchQuery && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-4 text-xs text-ink-400">
                No locations found matching &quot;{searchQuery}&quot;. Try searching another locality.
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-sand-200 divide-y divide-sand-100">
                {searchResults.map((res, i) => (
                  <button
                    key={`${res.name}-${i}`}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full text-left p-2.5 hover:bg-cream-100 transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {res.wardId ? (
                        <Building className="w-3.5 h-3.5 text-teal shrink-0" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-ink-400 shrink-0" />
                      )}
                      <div className="truncate">
                        <span className="font-semibold text-ink">{res.name}</span>
                        {res.zone && <span className="text-ink-400 ml-1.5">• {res.zone}</span>}
                      </div>
                    </div>
                    <span className="text-[10px] text-ink-300 ml-2 shrink-0">
                      {res.latitude.toFixed(2)}°, {res.longitude.toFixed(2)}°
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick-Pick Hyderabad Wards */}
            <div>
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">
                Monitored Hyderabad Localities
              </p>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                {hyderabadWards.map((w) => {
                  const isCurrent = currentLocation.wardId === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleSelectWard(w.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isCurrent
                          ? 'bg-teal text-white shadow-glow-teal font-semibold'
                          : 'bg-sand-100 text-ink hover:bg-sand-200'
                      }`}
                    >
                      {w.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-3 bg-cream-100/50 border-t border-sand-200 text-center text-[11px] text-ink-400">
            Coordinates are verified and directly query Open-Meteo live weather models.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
