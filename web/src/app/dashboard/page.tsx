'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  RiskGauge,
  RiskBadge,
  AlertCard,
  ShelterCard,
  TimelineChips,
  DataFreshness,
  CardSkeleton,
  ReportCard,
  LanguageSelector,
} from '@/components/ui';
import {
  generateWardRisks,
  mockAlerts,
  hyderabadShelters,
  hyderabadWards,
  mockReports,
  emergencyContacts,
  safetyGuidance,
} from '@/lib/mock-data';
import type { WardRisk, WeatherForecast, Horizon } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from '@/lib/location-context';
import { useI18n } from '@/lib/i18n-context';
import { LocationModal } from '@/components/ui/location-modal';
import { fetchWeatherForecast } from '@/lib/weather-service';
import { validateCoordinates, searchLocations, calculateDistanceKm } from '@/lib/location-service';
import { computeLocationRisk } from '@/lib/risk-service';
import { computeNearbyShelters, formatShelterDistance } from '@/lib/shelter-service';
import { evaluateDynamicAlerts } from '@/lib/alert-service';
import {
  LogIn,
  RefreshCw,
  AlertTriangle,
  Wind,
  Droplets,
  Thermometer,
  Calendar,
  ExternalLink,
} from 'lucide-react';

// ============================================================================
// RAIN CHART (inline mini-chart)
// ============================================================================
function MiniRainChart({ data }: { data: { time: string; rainfall: number }[] }) {
  const safeData = data && data.length > 0 ? data.slice(0, 24) : [];
  const max = Math.max(...safeData.map((d) => d.rainfall), 1);
  return (
    <div className="flex items-end gap-[2px] h-16">
      {safeData.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end">
          <div
            className="w-full rounded-t transition-all duration-300"
            style={{
              height: `${Math.max((d.rainfall / max) * 100, 2)}%`,
              backgroundColor:
                d.rainfall > 30
                  ? '#EF4444'
                  : d.rainfall > 15
                  ? '#F97316'
                  : d.rainfall > 5
                  ? '#0D9488'
                  : '#99F6E4',
            }}
            title={`${new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}: ${d.rainfall.toFixed(1)} mm`}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// TEMP CHART
// ============================================================================
function MiniTempChart({ data }: { data: { time: string; temperature: number }[] }) {
  const safeData = data && data.length > 0 ? data.slice(0, 24) : [];
  if (safeData.length === 0) return null;

  const max = Math.max(...safeData.map((d) => d.temperature));
  const min = Math.min(...safeData.map((d) => d.temperature));
  const range = max - min || 1;

  return (
    <div className="relative h-16">
      <svg
        className="w-full h-full"
        viewBox={`0 0 ${safeData.length * 10} 64`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D97706" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={
            safeData
              .map((d, i) => {
                const x = i * 10;
                const y = 64 - ((d.temperature - min) / range) * 56;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ') +
            ` L ${(safeData.length - 1) * 10} 64 L 0 64 Z`
          }
          fill="url(#tempGrad)"
        />
        <path
          d={safeData
            .map((d, i) => {
              const x = i * 10;
              const y = 64 - ((d.temperature - min) / range) * 56;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ')}
          fill="none"
          stroke="#D97706"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// WHY IS MY RISK HIGH COMPONENT (DYNAMIC RISK REASONING)
// ============================================================================
function RiskExplainer({
  floodFactors,
  heatFactors = [],
  locationName = 'Selected Area',
}: {
  floodFactors: Array<{ name: string; contribution: number; description: string; value: string }>;
  heatFactors?: Array<{ name: string; contribution: number; description: string; value: string }>;
  locationName?: string;
}) {
  const [activeHazard, setActiveHazard] = useState<'flood' | 'heat'>('flood');
  const [expanded, setExpanded] = useState(false);

  const factors = activeHazard === 'flood' ? floodFactors : heatFactors.length > 0 ? heatFactors : floodFactors;
  const topFactors = expanded ? factors : factors.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-base">🔍</span>
          <h3 className="font-semibold text-ink text-sm">
            Why is my {activeHazard} risk this level?
          </h3>
          <span className="text-ink-400 text-xs ml-1">{expanded ? '▲ Less' : '▼ More'}</span>
        </button>

        {heatFactors.length > 0 && (
          <div className="flex bg-sand-100 rounded-full p-0.5 text-[11px] font-medium shrink-0">
            <button
              onClick={() => setActiveHazard('flood')}
              className={`px-2 py-0.5 rounded-full transition-all ${
                activeHazard === 'flood'
                  ? 'bg-white text-teal shadow-xs font-semibold'
                  : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              🌧️ Flood
            </button>
            <button
              onClick={() => setActiveHazard('heat')}
              className={`px-2 py-0.5 rounded-full transition-all ${
                activeHazard === 'heat'
                  ? 'bg-white text-saffron shadow-xs font-semibold'
                  : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              ☀️ Heat
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        {topFactors.map((factor, i) => (
          <motion.div
            key={factor.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3"
          >
            <div className="shrink-0 mt-1">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor:
                    factor.contribution > 0.6
                      ? '#EF4444'
                      : factor.contribution > 0.3
                      ? '#F97316'
                      : '#0D9488',
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{factor.name}</span>
                <span className="text-xs text-ink-600 font-mono font-semibold shrink-0 bg-sand-100/70 px-1.5 py-0.5 rounded">
                  {factor.value}
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{factor.description}</p>
              <div className="w-full h-1 bg-sand-100 rounded-full mt-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(8, Math.abs(factor.contribution) * 100))}%` }}
                  transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor:
                      factor.contribution > 0.6
                        ? '#EF4444'
                        : factor.contribution > 0.3
                        ? '#F97316'
                        : '#0D9488',
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="text-[11px] text-ink-400 mt-3 pt-2.5 border-t border-sand-100 flex items-center justify-between">
        <span>ℹ️ Dynamic payload fused for {locationName}</span>
        <span className="font-mono text-[10px]">Open-Meteo + Sensors</span>
      </p>
    </div>
  );
}

// ============================================================================
// SAFETY CHECKLIST
// ============================================================================
function SafetyChecklist({ hazard, level }: { hazard: string; level: string }) {
  const guide = safetyGuidance.find(
    (g) =>
      g.hazard === hazard &&
      g.phase === (level === 'severe' || level === 'high' ? 'during' : 'before')
  );
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  if (!guide) return null;

  const toggleItem = (order: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft">
      <h3 className="font-semibold text-ink text-sm flex items-center gap-2 mb-3">
        <span className="text-base">✅</span>
        What to do now
      </h3>
      <ul className="space-y-2">
        {guide.steps
          .filter((s) => s.importance === 'critical')
          .map((step) => (
            <li key={step.order} className="flex items-start gap-3">
              <button
                onClick={() => toggleItem(step.order)}
                className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all mt-0.5 ${
                  checkedItems.has(step.order)
                    ? 'bg-teal border-teal text-white'
                    : 'border-ink-200 hover:border-teal'
                }`}
              >
                {checkedItems.has(step.order) && <span className="text-xs">✓</span>}
              </button>
              <span
                className={`text-sm ${
                  checkedItems.has(step.order) ? 'text-ink-300 line-through' : 'text-ink-600'
                }`}
              >
                {step.text}
              </span>
            </li>
          ))}
      </ul>
      <Link
        href="/guide"
        className="inline-flex items-center gap-1 mt-3 text-xs text-teal font-medium hover:text-teal-600 transition-colors"
      >
        View full safety guide →
      </Link>
    </div>
  );
}

// ============================================================================
// CITIZEN DASHBOARD CONTENT
// ============================================================================
function CitizenDashboardContent() {
  const { user, isAuthenticated } = useAuth();
  const { t, locale, tWeather, speak } = useI18n();
  const searchParams = useSearchParams();
  const {
    currentLocation,
    selectLocation,
  } = useLocation();

  const [selectedHorizon, setSelectedHorizon] = useState<string>('now');
  const [wardRisks, setWardRisks] = useState<WardRisk[]>([]);
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [weatherLoading, setWeatherLoading] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [isStaleWeather, setIsStaleWeather] = useState<boolean>(false);
  const [weatherSource, setWeatherSource] = useState<string>('Open-Meteo');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState<boolean>(false);
  const [userWard, setUserWard] = useState('w-001'); // Malakpet default
  const [showEmergency, setShowEmergency] = useState(false);

  // Sync search parameters from URL on initial load if provided
  useEffect(() => {
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const nameParam = searchParams.get('name');
    const wardParam = searchParams.get('ward');
    const areaParam = searchParams.get('area');

    if (latStr && lngStr) {
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const validation = validateCoordinates(lat, lng);
      if (validation.valid && validation.latitude !== undefined && validation.longitude !== undefined) {
        selectLocation({
          latitude: validation.latitude,
          longitude: validation.longitude,
          name: nameParam || areaParam || 'Selected Location',
          wardId: wardParam || undefined,
          isDeviceLocation: false,
          timestamp: Date.now(),
        });
        if (wardParam) setUserWard(wardParam);
      }
    } else if (areaParam) {
      searchLocations(areaParam)
        .then((results) => {
          if (results && results.length > 0) {
            const top = results[0];
            selectLocation(top);
            if (top.wardId) setUserWard(top.wardId);
          }
        })
        .catch((err) => {
          console.warn('Could not geocode area param:', err);
        });
    }
  }, [searchParams, selectLocation]);

  // Sync ward with user preference or selected location
  useEffect(() => {
    if (currentLocation?.wardId) {
      setUserWard(currentLocation.wardId);
    } else if (user?.ward_id) {
      setUserWard(user.ward_id);
    }
  }, [currentLocation, user]);

  // Load ward risk baseline
  useEffect(() => {
    setWardRisks(generateWardRisks());
  }, []);

  // Fetch real weather forecast from Open-Meteo whenever coordinates change
  const loadWeather = useCallback(
    async (lat: number, lng: number, forceRefresh = false) => {
      if (forceRefresh) {
        setIsRefreshing(true);
      } else {
        setWeatherLoading(true);
      }
      setWeatherError(null);

      try {
        const result = await fetchWeatherForecast(lat, lng, { forceRefresh });
        setForecast(result.forecast);
        setIsStaleWeather(result.isStale);
        setWeatherSource(result.source);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to retrieve weather data.';
        setWeatherError(msg);
      } finally {
        setWeatherLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!currentLocation) return;

    const controller = new AbortController();
    setWeatherLoading(true);
    setWeatherError(null);

    fetchWeatherForecast(currentLocation.latitude, currentLocation.longitude, {
      signal: controller.signal,
    })
      .then((result) => {
        setForecast(result.forecast);
        setIsStaleWeather(result.isStale);
        setWeatherSource(result.source);
        setWeatherLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setWeatherError(err.message || 'Failed to retrieve weather data.');
        setWeatherLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [currentLocation]);

  const handleRefreshWeather = () => {
    if (!currentLocation) return;
    loadWeather(currentLocation.latitude, currentLocation.longitude, true);
  };

  const currentWard =
    hyderabadWards.find((w) => w.id === (currentLocation?.wardId || userWard)) || {
      id: currentLocation?.wardId || 'custom',
      name: currentLocation?.name || 'Selected Location',
      zone: currentLocation?.zone || currentLocation?.admin1 || 'Location',
      subdivision: '',
      circle: '',
      population: 48000,
      slumPopulation: 0,
      areaKm2: 3.2,
      elevation: 525,
      drainageCapacityMmHr: 20,
      imperviousSurfacePct: 60,
      geometry: {
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [currentLocation?.longitude || 78.4867, currentLocation?.latitude || 17.385],
        },
        properties: {},
      },
    };

  // 1. DYNAMIC RISK REASONING & SCORING:
  // Re-evaluates instant terrain factors (elevation ASL, drainage condition) and live forecast
  // metrics (expected rainfall next 3h, heat index) whenever currentLocation, forecast, or horizon changes.
  const currentRisk = React.useMemo(() => {
    if (!currentLocation) return undefined;
    return computeLocationRisk(currentLocation, forecast, selectedHorizon as Horizon);
  }, [currentLocation, forecast, selectedHorizon]);

  // 2. DYNAMIC NEAREST EMERGENCY SHELTERS:
  // Computes real Haversine distance (in meters) and accurate walking/driving times relative to active coordinates.
  const nearbyShelters = React.useMemo(() => {
    if (!currentLocation) return [];
    return computeNearbyShelters(
      currentLocation.latitude,
      currentLocation.longitude,
      currentLocation.name,
      { limit: 3 }
    );
  }, [currentLocation]);

  // 3. DYNAMIC WEATHER & RISK WARNINGS:
  // Re-evaluates title, severity, description, actions, and affected micro-zones whenever active location
  // or live weather observations change, avoiding hardcoded city/Old City defaults.
  const activeAlerts = React.useMemo(() => {
    if (!currentLocation) return [];
    return evaluateDynamicAlerts(currentLocation, forecast, currentRisk || null);
  }, [currentLocation, forecast, currentRisk]);

  // Dynamic nearby reports based on proximity to active coordinates
  const nearbyReports = React.useMemo(() => {
    if (!currentLocation) return [];
    return [...mockReports]
      .map((r) => ({
        ...r,
        distanceKm: calculateDistanceKm(
          currentLocation.latitude,
          currentLocation.longitude,
          r.lat,
          r.lng
        ),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 3);
  }, [currentLocation]);

  const horizons = [
    { value: 'now', label: t('dashboard.now') },
    { value: '6h', label: t('dashboard.in6h') },
    { value: '24h', label: t('dashboard.in24h') },
    { value: '72h', label: t('dashboard.in72h') },
  ];

  const handleSpeak = (text: string) => {
    speak(text);
  };

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      {/* Advisory Banner */}
      <div className="bg-teal/5 border-b border-teal/10 px-4 py-1.5">
        <p className="text-center text-xs text-teal font-medium">
          ⓘ {t('common.advisory')}
        </p>
      </div>

      {/* Top Nav */}
      <nav className="sticky top-0 z-40 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🏘️</span>
            <span className="font-bold text-ink font-display">Nirvana</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="dropdown" className="text-xs" />
            <button
              onClick={() =>
                handleSpeak(
                  `Your current flood risk is ${currentRisk?.flood.level || 'low'} and temperature is ${
                    forecast ? Math.round(forecast.current.temperature) : 'thirty'
                  } degrees Celsius`
                )
              }
              className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-sm hover:bg-teal/20 transition-colors"
              title={t('common.listen')}
            >
              🔊
            </button>
            {isAuthenticated && user ? (
              <Link
                href="/settings"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-sand-200 hover:bg-sand-100 transition-colors text-xs font-semibold text-ink shadow-xs"
                title={t('nav.settings')}
              >
                <div className="w-5 h-5 rounded-full bg-teal text-white flex items-center justify-center text-[10px] font-bold">
                  {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="max-w-[70px] truncate hidden sm:inline">
                  {user.full_name.split(' ')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1 rounded-full bg-teal text-white text-xs font-semibold hover:bg-teal-600 transition-colors shadow-xs"
              >
                {t('nav.signIn')}
              </Link>
            )}
            <Link
              href="/settings"
              className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center text-sm hover:bg-sand-200 transition-colors"
              title={t('nav.settings')}
            >
              ⚙️
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Location Pill & Freshness Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-2"
        >
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-sand-200 shadow-soft hover:shadow-soft-md hover:border-teal-500/40 transition-all text-left max-w-[65%]"
            title="Click to change location or use GPS"
          >
            <span className="text-base shrink-0">
              {currentLocation?.isDeviceLocation ? '📱' : '📍'}
            </span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-ink truncate leading-tight">
                {currentLocation?.name || currentWard?.name || 'Select Location'}
              </span>
              <span className="text-[10px] text-ink-400 font-mono truncate">
                {currentLocation
                  ? `${currentLocation.latitude.toFixed(3)}°N, ${currentLocation.longitude.toFixed(3)}°E`
                  : 'Hyderabad'}
              </span>
            </div>
            <span className="text-ink-400 text-xs shrink-0 ml-1">▾</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleRefreshWeather}
              disabled={isRefreshing || weatherLoading}
              className="p-2 rounded-xl bg-white border border-sand-200 text-ink-500 hover:text-teal hover:bg-cream-50 transition-colors shadow-xs disabled:opacity-50"
              title="Refresh weather data"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-teal' : ''}`}
              />
            </button>
            <DataFreshness
              lastUpdated={forecast?.lastUpdated || currentRisk?.flood.computedAt || new Date().toISOString()}
              source="Open-Meteo"
            />
          </div>
        </motion.div>

        {/* Stale Cache Notice */}
        {isStaleWeather && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-xs"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Cached Weather</strong>: Displaying saved data due to temporary network failure.
              </span>
            </div>
            <button
              onClick={handleRefreshWeather}
              className="text-amber-800 font-bold hover:underline shrink-0"
            >
              Retry
            </button>
          </motion.div>
        )}

        {/* Weather Error Notice */}
        {weatherError && !forecast && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col gap-2 text-xs text-red-900 shadow-soft">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Weather Service Notice</span>
            </div>
            <p className="text-red-700">{weatherError}</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleRefreshWeather}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-xs"
              >
                Retry Request
              </button>
              <button
                onClick={() => setIsLocationModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-700 font-medium hover:bg-red-50 transition-colors"
              >
                Change Location
              </button>
            </div>
          </div>
        )}

        {/* Active Alert Banner */}
        {activeAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <AlertCard
              alert={activeAlerts[0]}
              onListen={() => handleSpeak(activeAlerts[0].message)}
              onShare={() => {
                if (navigator.share) {
                  navigator.share({ title: activeAlerts[0].title, text: activeAlerts[0].message });
                }
              }}
            />
          </motion.div>
        )}

        {/* Live Weather Overview Card (Open-Meteo Verified) */}
        {weatherLoading && !forecast ? (
          <CardSkeleton />
        ) : forecast ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-sand-200 p-5 shadow-soft relative overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-teal">
                  {t('weather.current')}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-ink font-display">
                    {forecast.current.temperature.toFixed(1)}°C
                  </span>
                  <span className="text-sm text-ink-500 font-medium">
                    Feels like {forecast.current.heatIndex.toFixed(1)}°C
                  </span>
                </div>
                <p className="text-sm text-ink-600 font-medium mt-0.5">
                  {tWeather(forecast.current.weatherCode).emoji} {tWeather(forecast.current.weatherCode).description}
                </p>
              </div>

              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-cream-200/80 text-ink-600 font-mono">
                  {currentLocation?.isDeviceLocation ? '🛰️ GPS' : '📍 Resolved'}
                </span>
                <p className="text-[10px] text-ink-400 mt-1">
                  Updated {new Date(forecast.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-sand-100">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-cream-50/60">
                <Droplets className="w-4 h-4 text-teal shrink-0" />
                <div>
                  <p className="text-[10px] text-ink-400">{t('weather.humidity')}</p>
                  <p className="text-xs font-semibold text-ink">{forecast.current.humidity}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-cream-50/60">
                <Wind className="w-4 h-4 text-teal shrink-0" />
                <div>
                  <p className="text-[10px] text-ink-400">{t('weather.wind')}</p>
                  <p className="text-xs font-semibold text-ink">
                    {forecast.current.windSpeed.toFixed(0)} km/h
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-cream-50/60">
                <Thermometer className="w-4 h-4 text-saffron shrink-0" />
                <div>
                  <p className="text-[10px] text-ink-400">{t('weather.rain')}</p>
                  <p className="text-xs font-semibold text-ink">
                    {forecast.current.rainfall.toFixed(1)} mm
                  </p>
                </div>
              </div>
            </div>

            {/* Attribution Link */}
            <div className="mt-3 flex items-center justify-between text-[10px] text-ink-400">
              <span>Model: Open-Meteo ECMWF / ICON</span>
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-teal flex items-center gap-0.5 underline"
              >
                Open-Meteo API
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </motion.div>
        ) : null}

        {/* Dual Risk Gauges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-sand-200 p-5 shadow-soft"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-ink">{t('dashboard.riskLevel')}</h2>
            <TimelineChips
              horizons={horizons}
              selected={selectedHorizon}
              onChange={setSelectedHorizon}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Flood Risk */}
            <div className="flex flex-col items-center relative">
              {currentRisk && currentRisk.flood.level !== 'low' && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                  {[25, 35, 48, 55, 62, 72, 40, 58].map((pos, i) => (
                    <div
                      key={i}
                      className="rain-particle"
                      style={{ left: `${pos}%`, animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </div>
              )}
              <RiskGauge
                level={currentRisk?.flood.level || 'low'}
                score={currentRisk?.flood.score || 0}
                hazard="flood"
                size="lg"
              />
              <p className="text-xs text-ink-400 mt-2">{t('dashboard.floodRisk')}</p>
              {currentRisk?.flood.depthBucket && (
                <span className="text-xs text-ink-300 mt-0.5">
                  Est. depth: {currentRisk.flood.depthBucket}
                </span>
              )}
            </div>

            {/* Heat Risk */}
            <div
              className={`flex flex-col items-center ${
                currentRisk?.heat.level === 'severe' ? 'sun-glow rounded-2xl' : ''
              }`}
            >
              <RiskGauge
                level={currentRisk?.heat.level || 'low'}
                score={currentRisk?.heat.score || 0}
                hazard="heat"
                size="lg"
              />
              <p className="text-xs text-ink-400 mt-2">{t('dashboard.heatRisk')}</p>
              {forecast && (
                <span className="text-xs text-ink-300 mt-0.5">
                  Feels like {forecast.current.heatIndex.toFixed(0)}°C
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-sand-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-ink-400">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
              Confidence: {((currentRisk?.flood.confidence || 0.85) * 100).toFixed(0)}%
            </div>
            <span className="text-xs text-ink-300">
              Updated{' '}
              {new Date(
                forecast?.lastUpdated || currentRisk?.flood.computedAt || ''
              ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </motion.div>

        {/* Safety Checklist */}
        {currentRisk &&
          (currentRisk.flood.level === 'high' || currentRisk.flood.level === 'severe') && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <SafetyChecklist hazard="flood" level={currentRisk.flood.level} />
            </motion.div>
          )}

        {/* Nearest Verified Shelter */}
        {nearbyShelters.length > 0 && nearbyShelters[0] && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-ink text-sm flex items-center gap-1.5">
                  <span>🛡️</span> {t('dashboard.nearestShelters')}
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium">
                  {formatShelterDistance(nearbyShelters[0].distance)} away • ~{nearbyShelters[0].walkingTime} min walk
                </span>
              </div>
              <Link
                href="/shelters"
                className="text-xs text-teal font-medium hover:text-teal-600 transition-colors"
              >
                {t('common.all')} →
              </Link>
            </div>
            <ShelterCard shelter={nearbyShelters[0]} />
          </motion.div>
        )}

        {/* 24-Hour Forecast Chart Card */}
        {forecast && forecast.hourly && forecast.hourly.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft"
          >
            <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
              <span>📊</span> 24-Hour Forecast (Open-Meteo)
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-ink-400">Rainfall (mm/hr)</span>
                  <span className="text-xs font-medium text-teal">
                    24h Sum:{' '}
                    {forecast.hourly
                      .slice(0, 24)
                      .reduce((sum, h) => sum + h.rainfall, 0)
                      .toFixed(1)}
                    mm
                  </span>
                </div>
                <MiniRainChart data={forecast.hourly.slice(0, 24)} />
                <div className="flex justify-between mt-1 text-[10px] text-ink-300 font-mono">
                  <span>Now</span>
                  <span>+6h</span>
                  <span>+12h</span>
                  <span>+18h</span>
                  <span>+24h</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-ink-400">Temperature (°C)</span>
                  <span className="text-xs font-medium text-saffron">
                    Peak:{' '}
                    {Math.max(...forecast.hourly.slice(0, 24).map((h) => h.temperature)).toFixed(0)}
                    °C
                  </span>
                </div>
                <MiniTempChart data={forecast.hourly.slice(0, 24)} />
              </div>
            </div>

            {/* 7-Day Outlook Strip */}
            {forecast.daily && forecast.daily.length > 0 && (
              <div className="mt-4 pt-3 border-t border-sand-100">
                <div className="flex items-center gap-1.5 mb-2.5 text-xs font-semibold text-ink">
                  <Calendar className="w-3.5 h-3.5 text-teal" />
                  <span>7-Day Outlook</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {forecast.daily.slice(0, 7).map((day, idx) => {
                    const dateObj = new Date(day.date);
                    const dayLabel = idx === 0 ? 'Today' : dateObj.toLocaleDateString([], { weekday: 'short' });
                    return (
                      <div
                        key={day.date}
                        className={`p-1.5 rounded-xl border ${
                          idx === 0
                            ? 'bg-teal-50/60 border-teal-200'
                            : 'bg-sand-50/50 border-sand-100'
                        }`}
                      >
                        <p className="text-[10px] font-semibold text-ink-600">{dayLabel}</p>
                        <p className="text-xs font-bold text-ink mt-0.5">
                          {Math.round(day.tempMax)}°
                        </p>
                        <p className="text-[10px] text-ink-400">
                          {Math.round(day.tempMin)}°
                        </p>
                        {day.rainfallTotal > 0 && (
                          <p className="text-[9px] text-teal font-semibold mt-0.5">
                            {day.rainfallTotal.toFixed(0)}m
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Risk Explainer (Dynamic Factors & Live Model Binding) */}
        {currentRisk && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <RiskExplainer
              floodFactors={currentRisk.flood.factors}
              heatFactors={currentRisk.heat.factors}
              locationName={currentLocation?.name}
            />
          </motion.div>
        )}

        {/* Nearby Reports */}
        {nearbyReports.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-ink text-sm flex items-center gap-2">
                <span>📋</span> Nearby Reports
              </h3>
              <Link
                href="/reports"
                className="text-xs text-teal font-medium hover:text-teal-600 transition-colors"
              >
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {nearbyReports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Emergency Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-3"
        >
          <Link
            href="/report"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-sand-200 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="text-2xl">📸</span>
            <span className="text-sm font-semibold text-ink">Report an Issue</span>
            <span className="text-xs text-ink-400">Waterlogging, drain blocked</span>
          </Link>
          <button
            onClick={() => setShowEmergency(true)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-sand-200 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="text-2xl">🆘</span>
            <span className="text-sm font-semibold text-risk-severe">I Need Help</span>
            <span className="text-xs text-ink-400">Emergency contacts</span>
          </button>
        </motion.div>

        {/* Quick Nav */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-4 gap-2"
        >
          {[
            { href: '/map', icon: '🗺️', label: 'Risk Map' },
            { href: '/alerts', icon: '🔔', label: 'Alerts' },
            { href: '/guide', icon: '📖', label: 'Safety' },
            { href: '/shelters', icon: '🛡️', label: 'Shelters' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-white border border-sand-200 hover:bg-sand-100 transition-colors"
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium text-ink-500">{item.label}</span>
            </Link>
          ))}
        </motion.div>
      </div>

      {/* Interactive Location Selection Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Emergency Contacts Bottom Sheet */}
      <AnimatePresence>
        {showEmergency && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-50"
              onClick={() => setShowEmergency(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="w-10 h-1 bg-sand-200 rounded-full mx-auto mb-6" />
                <h2 className="text-xl font-bold text-ink mb-1 font-display">Emergency Contacts</h2>
                <p className="text-sm text-ink-400 mb-6">Tap to call directly</p>
                <div className="space-y-3">
                  {emergencyContacts.map((contact) => (
                    <a
                      key={contact.number}
                      href={`tel:${contact.number}`}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-cream-100 border border-sand-200 hover:bg-sand-100 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-risk-severe/10 flex items-center justify-center text-xl">
                        📞
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-ink">{contact.name}</h4>
                        <p className="text-sm text-ink-400">{contact.description}</p>
                      </div>
                      <span className="font-bold text-teal font-mono">{contact.number}</span>
                    </a>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-2xl bg-saffron/10 border border-saffron/20">
                  <p className="text-sm text-saffron font-medium text-center">
                    ⚠️ If you are in immediate danger, call 112 immediately
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sand-200 z-40 no-print">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { href: '/dashboard', icon: '🏠', label: t('dashboard.title'), active: true },
            { href: '/map', icon: '🗺️', label: t('nav.map'), active: false },
            { href: '/alerts', icon: '🔔', label: t('nav.alerts'), active: false, badge: activeAlerts.length },
            { href: '/guide', icon: '📖', label: t('nav.guide'), active: false },
            { href: '/settings', icon: '👤', label: t('nav.settings'), active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                item.active ? 'text-teal' : 'text-ink-400 hover:text-ink-600'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 bg-risk-severe text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

// ============================================================================
// EXPORT DEFAULT WITH SUSPENSE (Protects useSearchParams from build errors)
// ============================================================================
export default function CitizenDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-cream-100">
          <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
            <CardSkeleton />
            <div className="grid grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        </div>
      }
    >
      <CitizenDashboardContent />
    </Suspense>
  );
}
