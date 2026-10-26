'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker, Popup, GeoJSONSource, StyleSpecification } from 'maplibre-gl';



import 'maplibre-gl/dist/maplibre-gl.css';
import { hyderabadWards, hyderabadShelters, mockReports } from '@/lib/mock-data';
import { getRiskColor } from '@/lib/utils';
import type { WardRisk, Shelter, CommunityReport } from '@/lib/types';
import { useLocation } from '@/lib/location-context';
import { searchLocations, LocationData } from '@/lib/location-service';
import { computeNearbyShelters } from '@/lib/shelter-service';
import {
  Crosshair,
  Compass,
  Layers,
  Search,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Check,
  X,
  Shield,
  Loader2,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// STYLES & FALLBACKS
// ============================================================================
const DEFAULT_MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE || 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

const OSM_RASTER_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'osm-raster-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: 'osm-raster-layer',
      type: 'raster',
      source: 'osm-raster-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

const DEFAULT_LAT = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LAT) || 17.385;
const DEFAULT_LNG = Number(process.env.NEXT_PUBLIC_MAP_CENTER_LNG) || 78.4867;
const DEFAULT_ZOOM = Number(process.env.NEXT_PUBLIC_MAP_ZOOM) || 11.5;

interface InteractiveMapProps {
  wardRisks?: WardRisk[];
  reports?: CommunityReport[];
  activeLayers?: Set<string>;
  selectedWard?: string | null;
  onWardSelect?: (wardId: string | null) => void;
  hazardView?: 'flood' | 'heat';
  onLocationSelect?: (loc: LocationData) => void;
  className?: string;
  initialCenter?: [number, number];
  initialZoom?: number;
  interactive?: boolean;
}

export function InteractiveMap({
  wardRisks = [],
  reports,
  activeLayers = new Set(['flood', 'shelters', 'wards']),
  selectedWard = null,
  onWardSelect,
  hazardView = 'flood',
  onLocationSelect,
  className = 'w-full h-full min-h-[500px]',
  initialCenter,
  initialZoom,
  interactive = true,
}: InteractiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // Markers refs for cleanup
  const gpsMarkerRef = useRef<Marker | null>(null);
  const selectedMarkerRef = useRef<Marker | null>(null);
  const shelterMarkersRef = useRef<Marker[]>([]);
  const reportMarkersRef = useRef<Marker[]>([]);

  // State
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [locationNotice, setLocationNotice] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  const { currentLocation, requestDeviceLocation, selectCoordinates, selectLocation } = useLocation();

  // Helper to build GeoJSON FeatureCollection for Wards
  const buildWardsGeoJSON = useCallback(() => {
    const features = hyderabadWards
      .map((ward) => {
        const riskData = wardRisks.find((r) => r.wardId === ward.id);
        const risk = hazardView === 'flood' ? riskData?.flood : riskData?.heat;
        const level = risk?.level || 'low';
        const score = risk?.score || 25;
        const color = getRiskColor(level);
        const isSelected = selectedWard === ward.id;

        if (!ward.geometry || !ward.geometry.geometry) return null;

        return {
          type: 'Feature',
          id: ward.id,
          geometry: ward.geometry.geometry,
          properties: {
            wardId: ward.id,
            wardName: ward.name,
            nameLocal: ward.nameLocal || ward.name,
            zone: ward.zone,
            population: ward.population,
            level,
            score,
            color,
            isSelected,
          },
        };
      })
      .filter(Boolean);

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [wardRisks, hazardView, selectedWard]);

  // ==========================================================================
  // INITIALIZE MAP
  // ==========================================================================
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;
    const startCenter: [number, number] = initialCenter || [
      currentLocation?.longitude || DEFAULT_LNG,
      currentLocation?.latitude || DEFAULT_LAT,
    ];
    const startZoom = initialZoom || DEFAULT_ZOOM;

    const initMap = (styleToUse: string | StyleSpecification, isFallback = false) => {
      try {
        const map = new maplibregl.Map({
          container: containerRef.current!,
          style: styleToUse,
          center: startCenter,
          zoom: startZoom,
          attributionControl: false,
          interactive: interactive,
        });

        // Add standard navigation control (zoom in/out, compass)
        if (interactive) {
          map.addControl(
            new maplibregl.NavigationControl({
              showCompass: true,
              showZoom: true,
              visualizePitch: true,
            }),
            'top-right'
          );

          map.addControl(
            new maplibregl.AttributionControl({
              compact: true,
            }),
            'bottom-right'
          );
        }

        map.on('load', () => {
          if (!isMounted) return;
          mapRef.current = map;
          setMapLoaded(true);
          setUsingFallback(isFallback);
          setMapError(null);

          // Force a resize calculation to avoid container boundary issues
          setTimeout(() => map.resize(), 100);

          // Add Wards Vector/GeoJSON Source
          const geojson = buildWardsGeoJSON();
          map.addSource('wards-source', {
            type: 'geojson',
            data: geojson as any,
          });

          // Wards Fill Layer
          map.addLayer({
            id: 'wards-fill',
            type: 'fill',
            source: 'wards-source',
            paint: {
              'fill-color': ['get', 'color'],
              'fill-opacity': [
                'case',
                ['boolean', ['get', 'isSelected'], false],
                0.55,
                0.35,
              ],
            },
          });

          // Wards Outline Layer
          map.addLayer({
            id: 'wards-outline',
            type: 'line',
            source: 'wards-source',
            paint: {
              'line-color': [
                'case',
                ['boolean', ['get', 'isSelected'], false],
                '#0D9488',
                ['get', 'color'],
              ],
              'line-width': [
                'case',
                ['boolean', ['get', 'isSelected'], false],
                3.5,
                1.5,
              ],
            },
          });

          // Wards Text Labels
          map.addLayer({
            id: 'wards-labels',
            type: 'symbol',
            source: 'wards-source',
            layout: {
              'text-field': ['get', 'wardName'],
              'text-size': 11,
              'text-anchor': 'center',
              'text-offset': [0, 0],
              'text-allow-overlap': false,
            },
            paint: {
              'text-color': '#0F172A',
              'text-halo-color': '#FFFFFF',
              'text-halo-width': 1.5,
            },
          });

          // Hover cursor behavior
          map.on('mouseenter', 'wards-fill', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'wards-fill', () => {
            map.getCanvas().style.cursor = '';
          });

          // Ward click interaction
          map.on('click', 'wards-fill', (e) => {
            if (e.features && e.features[0]) {
              const clickedWardId = e.features[0].properties?.wardId;
              if (clickedWardId && onWardSelect) {
                onWardSelect(clickedWardId);
              }
            }
          });

          // General map click for manual coordinates inspection / location select
          map.on('click', (e) => {
            // Check if clicked directly on a ward feature
            const features = map.queryRenderedFeatures(e.point, { layers: ['wards-fill'] });
            if (features.length === 0) {
              const { lng, lat } = e.lngLat;
              handleMapClickCoordinate(lat, lng);
            }
          });
        });

        // Error handling on style loading
        map.on('error', (e) => {
          console.warn('MapLibre error encountered:', e.error);
          if (!isFallback && !mapLoaded) {
            console.log('Switching to OpenStreetMap raster fallback style...');
            try {
              map.remove();
            } catch {}
            initMap(OSM_RASTER_FALLBACK_STYLE, true);
          }
        });
      } catch (err: any) {
        console.error('Failed to create MapLibre instance:', err);
        if (!isFallback) {
          initMap(OSM_RASTER_FALLBACK_STYLE, true);
        } else {
          setMapError(err?.message || 'Failed to initialize map.');
        }
      }
    };

    // Attempt primary style
    initMap(DEFAULT_MAP_STYLE, false);

    // Resize observer to ensure responsive map container rendering
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // ==========================================================================
  // UPDATE WARDS DATA WHEN RISKS / SELECTION / HAZARD VIEW CHANGE
  // ==========================================================================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('wards-source') as GeoJSONSource | undefined;
    if (source) {
      const geojson = buildWardsGeoJSON();
      source.setData(geojson as any);
    }

    // Update fill layer visibility based on activeLayers
    const showHazard = activeLayers.has(hazardView);
    if (mapRef.current.getLayer('wards-fill')) {
      mapRef.current.setLayoutProperty(
        'wards-fill',
        'visibility',
        showHazard ? 'visible' : 'none'
      );
    }
    if (mapRef.current.getLayer('wards-outline')) {
      mapRef.current.setLayoutProperty(
        'wards-outline',
        'visibility',
        activeLayers.has('wards') || showHazard ? 'visible' : 'none'
      );
    }
    if (mapRef.current.getLayer('wards-labels')) {
      mapRef.current.setLayoutProperty(
        'wards-labels',
        'visibility',
        activeLayers.has('wards') ? 'visible' : 'none'
      );
    }
  }, [wardRisks, hazardView, selectedWard, activeLayers, mapLoaded, buildWardsGeoJSON]);

  // ==========================================================================
  // HANDLE USER CURRENT LOCATION (GPS) MARKER
  // ==========================================================================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (currentLocation && currentLocation.isDeviceLocation) {
      const { longitude, latitude, accuracy, name } = currentLocation;

      if (!gpsMarkerRef.current) {
        // Create custom pulsing GPS DOM element
        const el = document.createElement('div');
        el.className = 'gps-pulse-marker';
        el.innerHTML = `
          <div class="gps-pulse-ring"></div>
          <div class="gps-pulse-dot" title="Your Current Location"></div>
        `;

        const popup = new maplibregl.Popup({ offset: 15, closeButton: false }).setHTML(`
          <div style="font-size: 12px; line-height: 1.4;">
            <strong style="color: #0D9488;">📍 Your Current Location</strong><br/>
            <span>${name || 'GPS Signal'}</span><br/>
            <span style="color: #64748B; font-size: 10px;">${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E ${accuracy ? `(±${Math.round(accuracy)}m)` : ''}</span>
          </div>
        `);

        gpsMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(mapRef.current);
      } else {
        gpsMarkerRef.current.setLngLat([longitude, latitude]);
      }
    } else if (gpsMarkerRef.current) {
      gpsMarkerRef.current.remove();
      gpsMarkerRef.current = null;
    }
  }, [currentLocation, mapLoaded]);

  // ==========================================================================
  // HANDLE SELECTED LOCATION MARKER
  // ==========================================================================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    if (currentLocation && !currentLocation.isDeviceLocation) {
      const { longitude, latitude, name, zone } = currentLocation;

      if (!selectedMarkerRef.current) {
        const el = document.createElement('div');
        el.className = 'selected-loc-pin';
        el.innerHTML = `
          <div style="background: #D97706; color: white; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.4); border: 2px solid #FFFFFF;">
            <span style="transform: rotate(45deg); font-size: 13px;">📍</span>
          </div>
        `;

        const popup = new maplibregl.Popup({ offset: 18, closeButton: true }).setHTML(`
          <div style="font-size: 12px; line-height: 1.4;">
            <strong style="color: #D97706;">Selected Location</strong><br/>
            <span style="font-weight: 600;">${name}</span> ${zone ? `<span style="color: #64748B;">(${zone})</span>` : ''}<br/>
            <span style="color: #64748B; font-size: 10px;">${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E</span>
          </div>
        `);

        selectedMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([longitude, latitude])
          .setPopup(popup)
          .addTo(mapRef.current);
      } else {
        selectedMarkerRef.current.setLngLat([longitude, latitude]);
      }
    } else if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }
  }, [currentLocation, mapLoaded]);

  // ==========================================================================
  // RENDER SHELTER MARKERS
  // ==========================================================================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing shelter markers
    shelterMarkersRef.current.forEach((m) => m.remove());
    shelterMarkersRef.current = [];

    if (!activeLayers.has('shelters')) return;

    const sheltersToDisplay = currentLocation
      ? computeNearbyShelters(currentLocation.latitude, currentLocation.longitude, currentLocation.name)
      : hyderabadShelters;

    sheltersToDisplay.forEach((shelter) => {
      const el = document.createElement('div');
      el.className = 'shelter-map-marker';
      const icon =
        shelter.type === 'school'
          ? '🏫'
          : shelter.type === 'hospital'
          ? '🏥'
          : shelter.type === 'cooling_centre'
          ? '❄️'
          : shelter.type === 'relief_camp'
          ? '⛺'
          : '🛡️';

      el.innerHTML = `<span>${icon}</span>`;
      el.title = `${shelter.name} (${shelter.type})`;

      const distStr = shelter.distance
        ? shelter.distance < 1000
          ? `${shelter.distance}m`
          : `${(shelter.distance / 1000).toFixed(1)} km`
        : '';
      const walkStr = shelter.walkingTime ? `~${shelter.walkingTime} min walk` : '';

      const popup = new maplibregl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(`
        <div style="font-size: 12px; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${shelter.verificationStatus === 'illustrative_demo' ? '#FEF3C7' : shelter.verificationStatus.includes('verified') ? '#CCFBF1' : '#F1F5F9'}; color: ${shelter.verificationStatus === 'illustrative_demo' ? '#D97706' : shelter.verificationStatus.includes('verified') ? '#0F766E' : '#475569'}; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 10px;">
              ${shelter.verificationStatus === 'illustrative_demo' ? '⚠️ Demo Shelter' : shelter.verificationStatus.includes('verified') ? '🛡️ Verified' : 'Community'}
            </span>
            <span style="font-size: 10px; color: #64748B; text-transform: capitalize;">${shelter.type.replace('_', ' ')}</span>
          </div>
          <strong style="color: #0F172A; font-size: 13px; display: block; margin-bottom: 2px;">${shelter.name}</strong>
          <span style="color: #64748B; font-size: 11px; display: block; margin-bottom: 4px;">${shelter.address}</span>
          ${distStr ? `<div style="color: #0F766E; font-size: 11px; font-weight: 600; margin-bottom: 6px;">📍 ${distStr} ${walkStr ? `(${walkStr})` : ''}</div>` : ''}
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; color: #475569; border-top: 1px solid #E2E8F0; padding-top: 6px;">
            <span>👥 Capacity: <strong>${shelter.capacity}</strong></span>
            <span>💧 Safe: <strong>${shelter.floodSafe ? 'Yes' : 'Low'}</strong></span>
            ${shelter.contact ? `<span style="grid-column: span 2;">📞 <a href="tel:${shelter.contact}" style="color: #0D9488; font-weight: 600;">${shelter.contact}</a></span>` : ''}
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([shelter.lng, shelter.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      shelterMarkersRef.current.push(marker);
    });
  }, [activeLayers, mapLoaded, currentLocation]);

  // ==========================================================================
  // RENDER REPORT MARKERS
  // ==========================================================================
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing report markers
    reportMarkersRef.current.forEach((m) => m.remove());
    reportMarkersRef.current = [];

    if (!activeLayers.has('reports')) return;

    const reportsToRender = reports && reports.length > 0 ? reports : mockReports;

    reportsToRender.forEach((report) => {
      const el = document.createElement('div');
      el.className = 'report-map-marker';
      const bgColor =
        report.type === 'waterlogging'
          ? '#0D9488'
          : report.type === 'heat_stress'
          ? '#D97706'
          : report.type === 'blocked_drain'
          ? '#E11D48'
          : '#4F46E5';

      el.style.backgroundColor = bgColor;

      const icon =
        report.type === 'waterlogging'
          ? '🌊'
          : report.type === 'heat_stress'
          ? '🥵'
          : report.type === 'blocked_drain'
          ? '🚧'
          : '⚡';

      el.innerHTML = `<span>${icon}</span>`;
      el.title = report.description;

      const popup = new maplibregl.Popup({ offset: 15, maxWidth: '280px' }).setHTML(`
        <div style="font-size: 12px; line-height: 1.4;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: ${bgColor}20; color: ${bgColor}; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; text-transform: uppercase;">
              ${report.type.replace('_', ' ')}
            </span>
            <span style="font-size: 10px; color: #64748B;">👍 ${report.confirmations} confirmed</span>
          </div>
          <p style="color: #0F172A; font-size: 12px; margin: 4px 0 6px 0;">${report.description}</p>
          <div style="font-size: 10px; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 4px; display: flex; justify-content: space-between;">
            <span>Ward: <strong>${report.wardName}</strong></span>
            <span style="text-transform: capitalize;">${report.status.replace('_', ' ')}</span>
          </div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([report.lng, report.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      reportMarkersRef.current.push(marker);
    });
  }, [activeLayers, mapLoaded, reports]);

  // ==========================================================================
  // GPS TRIGGER HANDLER
  // ==========================================================================
  const handleUseMyLocation = async () => {
    setLocationNotice(null);
    setLocatingUser(true);

    try {
      const loc = await requestDeviceLocation();
      setLocatingUser(false);
      setLocationNotice({
        type: 'success',
        message: `Centered on your location: ${loc.name}`,
      });

      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [loc.longitude, loc.latitude],
          zoom: 14,
          speed: 1.4,
          curve: 1.2,
          essential: true,
        });
      }

      if (onLocationSelect) {
        onLocationSelect(loc);
      }
    } catch (err: any) {
      setLocatingUser(false);
      const msg =
        err?.message ||
        'Location access was denied or unavailable. Please enable permissions or pick your locality on the map.';
      setLocationNotice({
        type: 'error',
        message: msg,
      });
    }
  };

  // ==========================================================================
  // MAP CLICK COORDINATE SELECTION
  // ==========================================================================
  const handleMapClickCoordinate = async (lat: number, lng: number) => {
    try {
      const loc = await selectCoordinates(lat, lng);
      if (onLocationSelect) {
        onLocationSelect(loc);
      }
      setLocationNotice({
        type: 'success',
        message: `Selected: ${loc.name}`,
      });
    } catch (err: any) {
      console.warn('Coordinates selection error:', err);
    }
  };

  // ==========================================================================
  // RECENTER MAP
  // ==========================================================================
  const handleRecenter = () => {
    if (!mapRef.current) return;
    const center: [number, number] = [
      currentLocation?.longitude || DEFAULT_LNG,
      currentLocation?.latitude || DEFAULT_LAT,
    ];
    mapRef.current.flyTo({
      center,
      zoom: DEFAULT_ZOOM,
      speed: 1.2,
      essential: true,
    });
  };

  // ==========================================================================
  // SEARCH HANDLER
  // ==========================================================================
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery.trim());
        setSearchResults(results);
        setShowSearchDropdown(results.length > 0);
      } catch (err) {
        console.warn('Search locations failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSearchResult = (item: LocationData) => {
    selectLocation(item);
    setSearchQuery('');
    setShowSearchDropdown(false);

    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [item.longitude, item.latitude],
        zoom: item.wardId ? 13.5 : 12,
        speed: 1.4,
        essential: true,
      });
    }

    if (item.wardId && onWardSelect) {
      onWardSelect(item.wardId);
    }

    if (onLocationSelect) {
      onLocationSelect(item);
    }
  };

  return (
    <div className={`relative ${className} overflow-hidden rounded-2xl bg-cream-100`}>
      {/* Map DOM Element */}
      <div ref={containerRef} className="w-full h-full" style={{ minHeight: '100%' }} />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 bg-cream-100/80 backdrop-blur-xs flex items-center justify-center z-20">
          <div className="text-center bg-white/95 p-6 rounded-2xl border border-sand-200 shadow-soft-lg max-w-xs">
            <div className="w-10 h-10 border-3 border-teal/20 border-t-teal rounded-full animate-spin mx-auto mb-3" />
            <h4 className="text-sm font-bold text-ink">Loading Geographic Map</h4>
            <p className="text-xs text-ink-400 mt-1">Fetching streets, landmarks, and terrain tiles...</p>
          </div>
        </div>
      )}

      {/* Fatal Map Error State */}
      {mapError && (
        <div className="absolute inset-0 bg-cream-100 flex items-center justify-center p-6 z-30">
          <div className="text-center bg-white p-8 rounded-3xl border border-sand-200 shadow-soft-xl max-w-md">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 text-2xl">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-lg text-ink font-display">Map Failed to Load</h3>
            <p className="text-sm text-ink-400 mt-2">{mapError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors shadow-glow-teal"
            >
              Retry Loading Map
            </button>
          </div>
        </div>
      )}

      {/* Search Bar HUD - top center */}
      {interactive && (
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-10 w-[92%] sm:w-80 max-w-sm">
          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl border border-sand-200 shadow-soft-md flex items-center px-3.5 py-2">
            <Search className="w-4 h-4 text-ink-400 mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowSearchDropdown(true)}
              placeholder="Search ward, street, or city..."
              className="w-full text-xs sm:text-sm bg-transparent focus:outline-none text-ink placeholder:text-ink-400"
            />
            {isSearching ? (
              <Loader2 className="w-4 h-4 text-teal animate-spin shrink-0" />
            ) : searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchDropdown(false);
                }}
                className="text-ink-400 hover:text-ink-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-sand-200 shadow-soft-xl max-h-60 overflow-y-auto z-30 divide-y divide-sand-100">
              {searchResults.map((item, idx) => (
                <button
                  key={`${item.name}-${idx}`}
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full px-3.5 py-2.5 text-left flex items-start gap-2.5 hover:bg-cream-100 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate">{item.name}</p>
                    <p className="text-[10px] text-ink-400 truncate">
                      {item.zone ? `${item.zone} Zone • ` : ''}
                      {item.admin1 ? `${item.admin1}, ` : ''}
                      {item.country || 'India'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Floating GPS & Action Controls - top left */}
      {interactive && (
        <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-2">
          {/* Geolocation Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={locatingUser}
            title="Use My Current GPS Location"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border border-sand-200 bg-white/95 backdrop-blur-md shadow-soft hover:shadow-soft-md transition-all text-xs font-semibold text-ink ${
              locatingUser ? 'opacity-70 cursor-wait' : 'hover:border-teal/50'
            }`}
          >
            {locatingUser ? (
              <Loader2 className="w-4 h-4 text-teal animate-spin" />
            ) : (
              <Crosshair className="w-4 h-4 text-teal" />
            )}
            <span className="hidden sm:inline">Use My Location</span>
          </button>

          {/* Recenter Button */}
          <button
            onClick={handleRecenter}
            title="Recenter Map"
            className="w-8 h-8 rounded-xl border border-sand-200 bg-white/95 backdrop-blur-md shadow-soft hover:shadow-soft-md flex items-center justify-center text-ink-500 hover:text-ink transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Location Status Notice Toast */}
      {locationNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md animate-fade-up">
          <div
            className={`px-3.5 py-2.5 rounded-xl border shadow-soft-lg flex items-center justify-between gap-2 text-xs font-medium ${
              locationNotice.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-teal-50 text-teal-800 border-teal-200'
            }`}
          >
            <span>{locationNotice.message}</span>
            <button
              onClick={() => setLocationNotice(null)}
              className="p-1 rounded-md hover:bg-black/5 text-ink-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Map Attribution / Fallback Notice - bottom left */}
      <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-sand-200 text-[10px] text-ink-400 shadow-soft">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>
          {usingFallback ? 'OpenStreetMap Standard Tiles' : 'CARTO Positron Vector Base • Live Navigation'}
        </span>
      </div>
    </div>
  );
}
