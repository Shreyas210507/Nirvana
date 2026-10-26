'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { RiskBadge, TimelineChips, DataFreshness, LanguageSelector } from '@/components/ui';
import { useI18n } from '@/lib/i18n-context';
import { generateWardRisks, hyderabadWards } from '@/lib/mock-data';
import { getRiskColor } from '@/lib/utils';
import type { WardRisk } from '@/lib/types';
import { InteractiveMap } from '@/components/map/interactive-map';
import { Layers } from 'lucide-react';


// ============================================================================
// WARD DETAIL PANEL
// ============================================================================
function WardDetailPanel({ ward, onClose }: { ward: WardRisk; onClose: () => void }) {
  const wardData = hyderabadWards.find((w) => w.id === ward.wardId);

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 250 }}
      className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white/95 backdrop-blur-md border-l border-sand-200 shadow-soft-xl z-30 overflow-y-auto"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-ink font-display">{ward.wardName}</h3>
            {wardData && (
              <p className="text-xs text-ink-400">
                {wardData.nameLocal} • {wardData.zone} Zone
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 text-ink-500 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Risk levels */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-xl border border-sand-200 bg-teal-50/30">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">🌊</span>
              <span className="text-xs text-ink-400 font-medium">Flood Risk</span>
            </div>
            <RiskBadge level={ward.flood.level} />
            <p className="text-xs text-ink-400 mt-1">Score: {ward.flood.score}/100</p>
          </div>
          <div className="p-3 rounded-xl border border-sand-200 bg-amber-50/30">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">🌡️</span>
              <span className="text-xs text-ink-400 font-medium">Heat Risk</span>
            </div>
            <RiskBadge level={ward.heat.level} />
            <p className="text-xs text-ink-400 mt-1">Score: {ward.heat.score}/100</p>
          </div>
        </div>

        {/* Ward Stats */}
        {wardData && (
          <div className="space-y-3 mb-4">
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Ward Statistics</h4>
            <div className="space-y-2 text-xs">
              {[
                { label: 'Population', value: wardData.population.toLocaleString(), icon: '👥' },
                { label: 'Area', value: `${wardData.area} km²`, icon: '📐' },
                { label: 'Avg. Elevation', value: `${wardData.avgElevation}m`, icon: '⛰️' },
                { label: 'Drainage Condition', value: wardData.drainageCondition, icon: '🚰' },
                { label: 'Impervious Surface', value: `${(wardData.imperviousFraction * 100).toFixed(0)}%`, icon: '🏗️' },
                { label: 'Green Cover', value: `${(wardData.greenCoverFraction * 100).toFixed(0)}%`, icon: '🌿' },
                { label: 'Informal Settlement', value: `${(wardData.informalSettlementFraction * 100).toFixed(0)}%`, icon: '🏠' },
                { label: 'Elderly Population', value: `${(wardData.elderlyPopulationFraction * 100).toFixed(0)}%`, icon: '👵' },
                { label: 'Outdoor Workers', value: `${(wardData.outdoorWorkerFraction * 100).toFixed(0)}%`, icon: '👷' },
                { label: 'Historical Floods', value: `${wardData.historicalFloodFrequency} events`, icon: '📊' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-1 border-b border-sand-100">
                  <span className="text-ink-400 flex items-center gap-1.5">
                    <span>{stat.icon}</span>
                    {stat.label}
                  </span>
                  <span className="font-semibold text-ink capitalize">{stat.value}</span>
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
              <span className="text-sm font-semibold text-ink capitalize">Risk Trend: {ward.trend}</span>
              <p className="text-[11px] text-ink-400">Projected trend based on weather radar</p>
            </div>
          </div>
        </div>

        {/* Contributing Factors */}
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Key Hazard Factors</h4>
          <div className="space-y-2">
            {ward.flood.factors.slice(0, 3).map((factor) => (
              <div key={factor.name} className="flex items-start gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: getRiskColor(ward.flood.level) }}
                />
                <span className="text-ink-500 leading-snug">{factor.description}</span>
              </div>
            ))}
          </div>
        </div>

        <DataFreshness lastUpdated={ward.flood.computedAt} source="Open-Meteo + Copernicus DEM" className="mb-4" />
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAP PAGE INNER COMPONENT (WITH URL PARAMS)
// ============================================================================
function MapPageContent() {
  const searchParams = useSearchParams();
  const [wardRisks, setWardRisks] = useState<WardRisk[]>([]);
  const [hazardView, setHazardView] = useState<'flood' | 'heat'>('flood');
  const [selectedHorizon, setSelectedHorizon] = useState('now');
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [activeLayers, setActiveLayers] = useState<Set<string>>(new Set(['flood', 'shelters', 'wards', 'reports']));
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationRainfall, setSimulationRainfall] = useState(30);

  const { t } = useI18n();

  useEffect(() => {
    setWardRisks(generateWardRisks());
    const wardParam = searchParams.get('ward');
    if (wardParam) {
      setSelectedWard(wardParam);
    }
  }, [searchParams]);

  // Dynamic simulation scaling
  const displayWardRisks = useMemo(() => {
    if (!simulationActive) return wardRisks;

    return wardRisks.map((ward) => {
      if (hazardView !== 'flood') return ward;
      const factor = simulationRainfall / 30;
      const boostedScore = Math.min(100, Math.round(ward.flood.score * (0.8 + factor * 0.4)));
      const boostedLevel: 'low' | 'moderate' | 'high' | 'severe' =
        boostedScore >= 80 ? 'severe' : boostedScore >= 65 ? 'high' : boostedScore >= 45 ? 'moderate' : 'low';

      return {
        ...ward,
        flood: {
          ...ward.flood,
          score: boostedScore,
          level: boostedLevel,
          factors: [
            {
              name: 'Simulated Rain',
              contribution: 0.85,
              description: `Projected heavy deluge: ${simulationRainfall} mm/hr for 3 hours`,
              value: `${simulationRainfall} mm/hr`,
            },
            ...ward.flood.factors.slice(1),
          ],
        },
      };
    });
  }, [wardRisks, simulationActive, simulationRainfall, hazardView]);

  const toggleLayer = (layer: string) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      return next;
    });
  };

  const selectedWardData = selectedWard ? displayWardRisks.find((w) => w.wardId === selectedWard) : null;

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
    { id: 'reports', label: t('nav.report'), icon: '📋', color: '#F97316' },
    { id: 'wards', label: 'Ward Boundaries', icon: '🏘️', color: '#64748B' },
  ];

  return (
    <div className="h-screen flex flex-col bg-cream-100 overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-sand-200/80 px-4 py-2.5 z-20 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="text-xl">🏘️</span>
              <span className="font-bold text-ink font-display text-base">Nirvana</span>
            </Link>
            <span className="text-sand-300">|</span>
            <h1 className="text-xs sm:text-sm font-semibold text-ink flex items-center gap-1.5">
              <span>🗺️</span>
              <span>Interactive GIS Risk Map</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSelector variant="dropdown" className="text-xs hidden sm:block" />

            {/* Hazard view toggle */}
            <div className="inline-flex bg-sand-100 rounded-full p-0.5">
              <button
                onClick={() => {
                  setHazardView('flood');
                  setActiveLayers((prev) => {
                    const n = new Set(prev);
                    n.delete('heat');
                    n.add('flood');
                    return n;
                  });
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  hazardView === 'flood' ? 'bg-teal text-white shadow-soft' : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                🌊 <span className="hidden sm:inline">{t('dashboard.floodRisk')}</span>
              </button>
              <button
                onClick={() => {
                  setHazardView('heat');
                  setActiveLayers((prev) => {
                    const n = new Set(prev);
                    n.delete('flood');
                    n.add('heat');
                    return n;
                  });
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  hazardView === 'heat' ? 'bg-saffron text-white shadow-soft' : 'text-ink-400 hover:text-ink-600'
                }`}
              >
                🌡️ <span className="hidden sm:inline">{t('dashboard.heatRisk')}</span>
              </button>
            </div>

            <TimelineChips horizons={horizons} selected={selectedHorizon} onChange={setSelectedHorizon} />
          </div>
        </div>
      </div>

      {/* Main Map Body */}
      <div className="flex-1 relative overflow-hidden">
        <InteractiveMap
          wardRisks={displayWardRisks}
          activeLayers={activeLayers}
          selectedWard={selectedWard}
          onWardSelect={setSelectedWard}
          hazardView={hazardView}
          className="w-full h-full"
        />

        {/* Layer Controls Button & Drawer - Top Left Below GPS */}
        <div className="absolute top-16 left-3.5 z-10">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-md rounded-xl border border-sand-200 shadow-soft hover:shadow-soft-md transition-all text-xs font-semibold text-ink"
          >
            <Layers className="w-4 h-4 text-teal" />
            <span>Layers ({activeLayers.size})</span>
          </button>

          <AnimatePresence>
            {showLayerPanel && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                className="mt-2 bg-white/95 backdrop-blur-md rounded-2xl border border-sand-200 shadow-soft-xl p-3 w-56"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-bold text-ink-400 uppercase tracking-wider">Active Layers</p>
                  <button
                    onClick={() => setShowLayerPanel(false)}
                    className="text-ink-400 hover:text-ink-600 text-xs p-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-1">
                  {layerOptions.map((layer) => (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        activeLayers.has(layer.id)
                          ? 'bg-cream-100 font-semibold text-ink'
                          : 'text-ink-400 hover:bg-cream-100/50'
                      }`}
                    >
                      <span className="text-sm">{layer.icon}</span>
                      <span>{layer.label}</span>
                      {activeLayers.has(layer.id) && (
                        <span
                          className="ml-auto w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold"
                          style={{ backgroundColor: `${layer.color}25`, color: layer.color }}
                        >
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

        {/* Map Legend - Top Right Below Controls */}
        <div className="absolute top-28 right-3.5 z-10 hidden sm:block">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-sand-200 shadow-soft p-3">
            <p className="text-[10px] font-bold text-ink-400 mb-2 uppercase tracking-wider">
              {hazardView === 'flood' ? 'Flood' : 'Heat'} Severity
            </p>
            <div className="space-y-1.5 text-xs">
              {(['severe', 'high', 'moderate', 'low'] as const).map((level) => (
                <div key={level} className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-3.5 rounded-md shrink-0 shadow-xs"
                    style={{ backgroundColor: `${getRiskColor(level)}90`, border: `1.5px solid ${getRiskColor(level)}` }}
                  />
                  <span className="capitalize text-ink-600 font-medium">{level}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simulation Controls - Bottom Bar */}
        <div className="absolute bottom-10 left-4 right-4 z-10 pointer-events-none">
          <div className="max-w-md mx-auto pointer-events-auto">
            {!simulationActive ? (
              <button
                onClick={() => setSimulationActive(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-md rounded-2xl border border-sand-200 shadow-soft-lg hover:shadow-soft-xl hover:-translate-y-0.5 transition-all text-xs sm:text-sm font-bold text-teal"
              >
                <span>🎬 Run Heavy Rain Simulation Scenario</span>
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/95 backdrop-blur-md rounded-2xl border border-sand-200 shadow-soft-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs sm:text-sm font-bold text-ink flex items-center gap-2">
                    <span>🎬 Simulation Mode</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal/10 text-teal">
                      Active
                    </span>
                  </h3>
                  <button
                    onClick={() => setSimulationActive(false)}
                    className="text-xs text-ink-400 hover:text-rose-600 font-semibold transition-colors"
                  >
                    Reset & Close ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-ink-400">Rainfall Deluge Intensity</span>
                      <span className="font-bold text-teal font-mono">{simulationRainfall} mm/hr</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={140}
                      value={simulationRainfall}
                      onChange={(e) => setSimulationRainfall(Number(e.target.value))}
                      className="w-full h-2 bg-sand-200 rounded-full appearance-none cursor-pointer accent-teal"
                    />
                    <div className="flex justify-between text-[10px] text-ink-300 mt-1 font-medium">
                      <span>Moderate (20mm)</span>
                      <span>Heavy (60mm)</span>
                      <span>Extreme (120mm+)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-ink-500 bg-cream-100 rounded-xl p-2 border border-sand-200">
                    ⚡ Watch real-time flood risk polygons update as rainfall surges past drainage limits.
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Ward Detail Slide-in Panel */}
        <AnimatePresence>
          {selectedWardData && (
            <WardDetailPanel ward={selectedWardData} onClose={() => setSelectedWard(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function MapPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full flex items-center justify-center bg-cream-100">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-teal/20 border-t-teal rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-medium text-ink-500">Initializing GIS Engine...</p>
          </div>
        </div>
      }
    >
      <MapPageContent />
    </Suspense>
  );
}
