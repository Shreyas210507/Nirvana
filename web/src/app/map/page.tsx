'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { RiskBadge, TimelineChips, DataFreshness, ShelterCard, LanguageSelector } from '@/components/ui';
import { useI18n } from '@/lib/i18n-context';
import { generateWardRisks, hyderabadWards, hyderabadShelters, mockReports } from '@/lib/mock-data';
import { getRiskColor } from '@/lib/utils';
import type { WardRisk } from '@/lib/types';

// ============================================================================
// MAP COMPONENT (MapLibre GL placeholder with styled fallback)
// ============================================================================
function RiskMap({ 
  wardRisks, 
  activeLayers, 
  selectedWard, 
  onWardSelect, 
  hazardView 
}: {
  wardRisks: WardRisk[];
  activeLayers: Set<string>;
  selectedWard: string | null;
  onWardSelect: (wardId: string | null) => void;
  hazardView: 'flood' | 'heat';
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setMapLoaded(true), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={mapRef} className="relative w-full h-full bg-cream-100 rounded-2xl overflow-hidden">
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-teal/20 border-t-teal rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-ink-400">Loading map...</p>
          </div>
        </div>
      )}
      
      {mapLoaded && (
        <div className="absolute inset-0">
          {/* Styled SVG map of Hyderabad wards */}
          <svg className="w-full h-full" viewBox="78.36 17.32 0.24 0.20" preserveAspectRatio="xMidYMid meet">
            {/* Background */}
            <rect x="78.36" y="17.32" width="0.24" height="0.20" fill="#F8FAFC" />
            
            {/* Ward polygons */}
            {wardRisks.map(ward => {
              const wardData = hyderabadWards.find(w => w.id === ward.wardId);
              if (!wardData?.geometry?.geometry) return null;
              const coords = (wardData.geometry.geometry as any).coordinates[0];
              if (!coords) return null;
              
              const risk = hazardView === 'flood' ? ward.flood : ward.heat;
              const color = getRiskColor(risk.level);
              const isSelected = selectedWard === ward.wardId;
              
              const pointsStr = coords.map((c: number[]) => `${c[0]},${c[1]}`).join(' ');
              
              return (
                <g key={ward.wardId}>
                  <polygon
                    points={pointsStr}
                    fill={activeLayers.has(hazardView) ? `${color}40` : '#E2E8F080'}
                    stroke={isSelected ? color : '#CBD5E1'}
                    strokeWidth={isSelected ? 0.001 : 0.0004}
                    className="cursor-pointer transition-all duration-300"
                    onClick={() => onWardSelect(isSelected ? null : ward.wardId)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.fill = activeLayers.has(hazardView) ? `${color}60` : '#E2E8F0cc';
                      e.currentTarget.style.strokeWidth = '0.0008';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.fill = activeLayers.has(hazardView) ? `${color}40` : '#E2E8F080';
                      e.currentTarget.style.strokeWidth = isSelected ? '0.001' : '0.0004';
                    }}
                  />
                  {/* Ward label */}
                  <text
                    x={coords.reduce((sum: number, c: number[]) => sum + c[0], 0) / coords.length}
                    y={coords.reduce((sum: number, c: number[]) => sum + c[1], 0) / coords.length}
                    textAnchor="middle"
                    fontSize="0.004"
                    fill="#0F172A"
                    fontWeight="600"
                    fontFamily="Inter, sans-serif"
                    className="pointer-events-none select-none"
                  >
                    {ward.wardName}
                  </text>
                </g>
              );
            })}
            
            {/* Shelter markers */}
            {activeLayers.has('shelters') && hyderabadShelters.map(shelter => (
              <g key={shelter.id}>
                <circle
                  cx={shelter.lng}
                  cy={shelter.lat}
                  r={0.002}
                  fill={shelter.verificationStatus.includes('verified') ? '#0D9488' : '#94A3B8'}
                  stroke="white"
                  strokeWidth={0.0005}
                  className="cursor-pointer"
                />
                <text
                  x={shelter.lng}
                  y={shelter.lat - 0.003}
                  textAnchor="middle"
                  fontSize="0.003"
                  fill="#0D9488"
                  fontWeight="600"
                  className="pointer-events-none"
                >
                  🛡️
                </text>
              </g>
            ))}
            
            {/* Report markers */}
            {activeLayers.has('reports') && mockReports.map(report => (
              <g key={report.id}>
                <circle
                  cx={report.lng}
                  cy={report.lat}
                  r={0.0015}
                  fill={report.type === 'waterlogging' ? '#0D9488' : report.type === 'heat_stress' ? '#D97706' : '#F97316'}
                  stroke="white"
                  strokeWidth={0.0004}
                  opacity={0.8}
                  className="cursor-pointer"
                />
              </g>
            ))}
          </svg>

          {/* Map note */}
          <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 border border-sand-200 shadow-soft">
            <p className="text-[10px] text-ink-400">
              📌 Simplified ward view • Full MapLibre GL map loads with tile server
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// WARD DETAIL PANEL
// ============================================================================
function WardDetailPanel({ ward, onClose }: { ward: WardRisk; onClose: () => void }) {
  const wardData = hyderabadWards.find(w => w.id === ward.wardId);
  
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="absolute top-0 right-0 bottom-0 w-80 bg-white border-l border-sand-200 shadow-soft-xl z-20 overflow-y-auto"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-ink font-display">{ward.wardName}</h3>
            {wardData && <p className="text-xs text-ink-400">{wardData.nameLocal} • {wardData.zone}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">
            ✕
          </button>
        </div>

        {/* Risk levels */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl border border-sand-200">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">🌊</span>
              <span className="text-xs text-ink-400">Flood</span>
            </div>
            <RiskBadge level={ward.flood.level} />
            <p className="text-xs text-ink-300 mt-1">Score: {ward.flood.score}/100</p>
          </div>
          <div className="p-3 rounded-xl border border-sand-200">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">🌡️</span>
              <span className="text-xs text-ink-400">Heat</span>
            </div>
            <RiskBadge level={ward.heat.level} />
            <p className="text-xs text-ink-300 mt-1">Score: {ward.heat.score}/100</p>
          </div>
        </div>

        {/* Ward Stats */}
        {wardData && (
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Ward Data</h4>
            <div className="space-y-2">
              {[
                { label: 'Population', value: wardData.population.toLocaleString(), icon: '👥' },
                { label: 'Area', value: `${wardData.area} km²`, icon: '📐' },
                { label: 'Avg. Elevation', value: `${wardData.avgElevation}m`, icon: '⛰️' },
                { label: 'Drainage', value: wardData.drainageCondition, icon: '🚰' },
                { label: 'Impervious %', value: `${(wardData.imperviousFraction * 100).toFixed(0)}%`, icon: '🏗️' },
                { label: 'Green Cover', value: `${(wardData.greenCoverFraction * 100).toFixed(0)}%`, icon: '🌿' },
                { label: 'Informal Settlement', value: `${(wardData.informalSettlementFraction * 100).toFixed(0)}%`, icon: '🏠' },
                { label: 'Elderly Population', value: `${(wardData.elderlyPopulationFraction * 100).toFixed(0)}%`, icon: '👵' },
                { label: 'Outdoor Workers', value: `${(wardData.outdoorWorkerFraction * 100).toFixed(0)}%`, icon: '👷' },
                { label: 'Historical Floods', value: `${wardData.historicalFloodFrequency} events`, icon: '📊' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between py-1">
                  <span className="text-sm text-ink-400 flex items-center gap-1.5">
                    <span className="text-xs">{stat.icon}</span>
                    {stat.label}
                  </span>
                  <span className="text-sm font-medium text-ink">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Trend */}
        <div className="p-3 rounded-xl bg-cream-100 border border-sand-200 mb-4">
          <div className="flex items-center gap-2">
            <span className={`text-lg ${ward.trend === 'rising' ? '📈' : ward.trend === 'falling' ? '📉' : '➡️'}`}>
              {ward.trend === 'rising' ? '📈' : ward.trend === 'falling' ? '📉' : '➡️'}
            </span>
            <div>
              <span className="text-sm font-medium text-ink capitalize">Risk {ward.trend}</span>
              <p className="text-xs text-ink-400">Compared to last 24 hours</p>
            </div>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Top Risk Factors</h4>
          <div className="space-y-2">
            {ward.flood.factors.slice(0, 3).map(factor => (
              <div key={factor.name} className="flex items-center gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: getRiskColor(ward.flood.level) }}
                />
                <span className="text-xs text-ink-500">{factor.description}</span>
              </div>
            ))}
          </div>
        </div>

        <DataFreshness lastUpdated={ward.flood.computedAt} source="Open-Meteo + SRTM" className="mb-4" />
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN MAP PAGE
// ============================================================================
export default function MapPage() {
  const [wardRisks, setWardRisks] = useState<WardRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [hazardView, setHazardView] = useState<'flood' | 'heat'>('flood');
  const [selectedHorizon, setSelectedHorizon] = useState('now');
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['flood', 'shelters']));
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationRainfall, setSimulationRainfall] = useState(30);

  useEffect(() => {
    setTimeout(() => {
      setWardRisks(generateWardRisks());
      setLoading(false);
    }, 600);
  }, []);

  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const { t } = useI18n();
  const selectedWardData = selectedWard ? wardRisks.find(w => w.wardId === selectedWard) : null;

  const horizons = [
    { value: 'now', label: t('dashboard.now') },
    { value: '6h', label: t('dashboard.in6h') },
    { value: '24h', label: t('dashboard.in24h') },
    { value: '72h', label: t('dashboard.in72h') },
  ];

  const layerOptions = [
    { id: 'flood', label: t('dashboard.floodRisk'), icon: '🌊', color: '#0D9488' },
    { id: 'heat', label: t('dashboard.heatRisk'), icon: '🌡️', color: '#D97706' },
    { id: 'shelters', label: t('nav.shelters'), icon: '🛡️', color: '#10B981' },
    { id: 'drains', label: 'Drainage', icon: '🚰', color: '#475569' },
    { id: 'reports', label: t('nav.report'), icon: '📋', color: '#F97316' },
    { id: 'elevation', label: 'Elevation', icon: '⛰️', color: '#64748B' },
  ];

  return (
    <div className="h-screen flex flex-col bg-cream-100">
      {/* Top bar */}
      <div className="bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-2 z-30 relative">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-lg">🏘️</span>
              <span className="font-bold text-ink font-display">Nirvana</span>
            </Link>
            <span className="text-ink-200">|</span>
            <h1 className="text-sm font-semibold text-ink">{t('nav.map')}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageSelector variant="dropdown" className="text-xs" />
            {/* Hazard toggle */}
            <div className="inline-flex bg-sand-100 rounded-full p-0.5">
              <button
                onClick={() => { setHazardView('flood'); setActiveLayers(prev => { const n = new Set(prev); n.delete('heat'); n.add('flood'); return n; }); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  hazardView === 'flood' ? 'bg-teal text-white' : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                🌊 {t('dashboard.floodRisk')}
              </button>
              <button
                onClick={() => { setHazardView('heat'); setActiveLayers(prev => { const n = new Set(prev); n.delete('flood'); n.add('heat'); return n; }); }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  hazardView === 'heat' ? 'bg-saffron text-white' : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                🌡️ {t('dashboard.heatRisk')}
              </button>
            </div>
            
            <TimelineChips horizons={horizons} selected={selectedHorizon} onChange={setSelectedHorizon} />
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <RiskMap
          wardRisks={wardRisks}
          activeLayers={activeLayers}
          selectedWard={selectedWard}
          onWardSelect={setSelectedWard}
          hazardView={hazardView}
        />

        {/* Layer Controls - left side */}
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-sand-200 shadow-soft hover:shadow-soft-md transition-all text-sm font-medium text-ink"
          >
            🗂️ Layers
          </button>
          
          <AnimatePresence>
            {showLayerPanel && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-2xl border border-sand-200 shadow-soft-md p-3 w-52"
              >
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Map Layers</p>
                <div className="space-y-1">
                  {layerOptions.map(layer => (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeLayers.has(layer.id) ? 'bg-cream-100 font-medium text-ink' : 'text-ink-400 hover:bg-cream-100/50'
                      }`}
                    >
                      <span className="text-base">{layer.icon}</span>
                      <span>{layer.label}</span>
                      {activeLayers.has(layer.id) && (
                        <span className="ml-auto w-4 h-4 rounded-sm flex items-center justify-center text-xs" style={{ backgroundColor: `${layer.color}20`, color: layer.color }}>
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Simulation Controls - bottom */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="max-w-md mx-auto">
            {!simulationActive ? (
              <button
                onClick={() => setSimulationActive(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white rounded-2xl border border-sand-200 shadow-soft-md hover:shadow-soft-lg transition-all text-sm font-semibold text-teal"
              >
                🎬 Run Demo Scenario — Simulate Heavy Rain Event
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-sand-200 shadow-soft-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                    🎬 Simulation Mode
                  </h3>
                  <button
                    onClick={() => setSimulationActive(false)}
                    className="text-xs text-ink-400 hover:text-risk-severe transition-colors"
                  >
                    Stop ✕
                  </button>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ink-400">Rainfall Intensity</span>
                      <span className="font-medium text-ink">{simulationRainfall} mm/hr</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={150}
                      value={simulationRainfall}
                      onChange={e => setSimulationRainfall(Number(e.target.value))}
                      className="w-full h-1.5 bg-sand-100 rounded-full appearance-none cursor-pointer accent-teal"
                    />
                    <div className="flex justify-between text-[10px] text-ink-300 mt-0.5">
                      <span>Light</span>
                      <span>Moderate</span>
                      <span>Heavy</span>
                      <span>Extreme</span>
                    </div>
                  </div>
                  <p className="text-xs text-ink-400 bg-cream-100 rounded-lg p-2">
                    ⚡ What-if: See projected risk if {simulationRainfall}mm/hr falls for 3 hours
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Map Legend */}
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-white rounded-xl border border-sand-200 shadow-soft p-3">
            <p className="text-xs font-semibold text-ink-400 mb-2 uppercase tracking-wider">
              {hazardView === 'flood' ? 'Flood' : 'Heat'} Risk
            </p>
            <div className="space-y-1.5">
              {(['severe', 'high', 'moderate', 'low'] as const).map(level => (
                <div key={level} className="flex items-center gap-2">
                  <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: `${getRiskColor(level)}60` }} />
                  <span className="text-xs text-ink-500 capitalize">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-white rounded-xl border border-sand-200 shadow-soft-md flex items-center px-3 py-2 w-72">
            <span className="text-ink-300 mr-2">🔍</span>
            <input
              type="text"
              placeholder="Search ward or area..."
              className="flex-1 text-sm bg-transparent focus:outline-none text-ink placeholder:text-ink-300"
            />
          </div>
        </div>

        {/* Ward Detail Panel */}
        <AnimatePresence>
          {selectedWardData && (
            <WardDetailPanel
              ward={selectedWardData}
              onClose={() => setSelectedWard(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
