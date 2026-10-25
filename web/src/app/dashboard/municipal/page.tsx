'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { KPICard, RiskBadge, AlertCard, ShelterCard, ReportCard, DataFreshness, TimelineChips, LanguageSelector } from '@/components/ui';
import { generateWardRisks, generateDashboardKPIs, mockAlerts, hyderabadShelters, mockReports, hyderabadWards, dataSourceStatuses, simulationScenarios } from '@/lib/mock-data';
import { getRiskColor } from '@/lib/utils';
import type { WardRisk, DashboardKPIs } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { LogOut } from 'lucide-react';

// ============================================================================
// SIDEBAR NAV
// ============================================================================
function Sidebar({ activeTab, onTabChange }: { activeTab: string; onTabChange: (tab: string) => void }) {
  const { user, logout, isAuthenticated } = useAuth();
  const tabs = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'map', icon: '🗺️', label: 'Live Map' },
    { id: 'wards', icon: '🏘️', label: 'Wards' },
    { id: 'alerts', icon: '📣', label: 'Alerts' },
    { id: 'shelters', icon: '🛡️', label: 'Shelters' },
    { id: 'reports', icon: '📋', label: 'Reports' },
    { id: 'resources', icon: '🚒', label: 'Resources' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'admin', icon: '⚙️', label: 'Admin' },
  ];

  return (
    <aside className="w-60 bg-white border-r border-sand-200 flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-sand-200">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center shadow-glow-teal">
            <span className="text-white text-sm">🏘️</span>
          </div>
          <div>
            <span className="font-bold text-ink font-display text-sm block leading-tight">Nirvana</span>
            <span className="text-[10px] text-ink-400 font-medium">Command Dashboard</span>
          </div>
        </Link>
      </div>
      
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-teal/10 text-teal font-semibold'
                : 'text-ink-400 hover:bg-cream-100 hover:text-ink-600'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.id === 'reports' && (
              <span className="ml-auto w-5 h-5 rounded-full bg-risk-severe/10 text-risk-severe text-[10px] font-bold flex items-center justify-center">
                {mockReports.filter(r => r.status !== 'resolved').length}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-sand-200">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👮'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-ink truncate">
              {user?.full_name || 'GHMC Officer'}
            </p>
            <p className="text-[10px] text-amber-700 font-medium capitalize truncate">
              {user?.role === 'municipal' ? 'Command Officer' : user?.role || 'Operator'}
            </p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="text-ink-300 hover:text-rose-600 transition-colors p-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

// ============================================================================
// WARD RANKING TABLE
// ============================================================================
function WardRankingTable({ wardRisks, hazardView }: { wardRisks: WardRisk[]; hazardView: 'flood' | 'heat' }) {
  const sorted = [...wardRisks].sort((a, b) => {
    const aScore = hazardView === 'flood' ? a.flood.score : a.heat.score;
    const bScore = hazardView === 'flood' ? b.flood.score : b.heat.score;
    return bScore - aScore;
  });

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-cream-100/50">
              <th className="text-left px-4 py-3 font-semibold text-ink-400 text-xs uppercase tracking-wider">#</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-400 text-xs uppercase tracking-wider">Ward</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-400 text-xs uppercase tracking-wider">Risk</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-400 text-xs uppercase tracking-wider">Score</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-400 text-xs uppercase tracking-wider">Population</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-400 text-xs uppercase tracking-wider">Vulnerability</th>
              <th className="text-left px-4 py-3 font-semibold text-ink-400 text-xs uppercase tracking-wider">Trend</th>
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, 15).map((ward, i) => {
              const risk = hazardView === 'flood' ? ward.flood : ward.heat;
              return (
                <motion.tr
                  key={ward.wardId}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-sand-100 hover:bg-cream-100/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-ink-400 font-mono text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">{ward.wardName}</span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge level={risk.level} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold" style={{ color: getRiskColor(risk.level) }}>
                      {risk.score}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{ward.population.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-sand-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${ward.vulnerabilityIndex * 100}%`,
                            backgroundColor: ward.vulnerabilityIndex > 0.6 ? '#EF4444' : ward.vulnerabilityIndex > 0.4 ? '#F59E0B' : '#10B981',
                          }}
                        />
                      </div>
                      <span className="text-xs text-ink-400">{(ward.vulnerabilityIndex * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${ward.trend === 'rising' ? 'text-risk-severe' : ward.trend === 'falling' ? 'text-risk-low' : 'text-ink-400'}`}>
                      {ward.trend === 'rising' ? '↑' : ward.trend === 'falling' ? '↓' : '→'}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// ALERT COMPOSER (simplified)
// ============================================================================
function AlertComposer({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [selectedWards, setSelectedWards] = useState<string[]>([]);
  const [hazard, setHazard] = useState<'flood' | 'heat'>('flood');
  const [severity, setSeverity] = useState('warning');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-3xl shadow-soft-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-sand-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-ink font-display">Compose Alert</h2>
              <p className="text-sm text-ink-400 mt-1">Step {step} of 3</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200">
              ✕
            </button>
          </div>
          {/* Step indicator */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-teal' : 'bg-sand-200'}`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">Hazard Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHazard('flood')}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${hazard === 'flood' ? 'border-teal bg-teal/5' : 'border-sand-200'}`}
                  >
                    <span className="text-2xl block mb-1">🌊</span>
                    <span className="text-sm font-medium">Flood</span>
                  </button>
                  <button
                    onClick={() => setHazard('heat')}
                    className={`flex-1 p-3 rounded-xl border-2 transition-all ${hazard === 'heat' ? 'border-saffron bg-saffron/5' : 'border-sand-200'}`}
                  >
                    <span className="text-2xl block mb-1">🌡️</span>
                    <span className="text-sm font-medium">Heat</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['advisory', 'watch', 'warning', 'emergency'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={`p-2 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                        severity === s ? 'border-teal bg-teal/5 text-teal' : 'border-sand-200 text-ink-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">Select Wards</label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {hyderabadWards.map(ward => (
                    <button
                      key={ward.id}
                      onClick={() => setSelectedWards(prev =>
                        prev.includes(ward.id) ? prev.filter(w => w !== ward.id) : [...prev, ward.id]
                      )}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedWards.includes(ward.id)
                          ? 'bg-teal text-white'
                          : 'bg-sand-100 text-ink-500 hover:bg-sand-200'
                      }`}
                    >
                      {ward.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">Alert Title</label>
                <input
                  type="text"
                  defaultValue={`${hazard === 'flood' ? 'Heavy Rain' : 'Heat Wave'} ${severity.charAt(0).toUpperCase() + severity.slice(1)} — ${selectedWards.length} Ward(s)`}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">Message</label>
                <textarea
                  rows={4}
                  defaultValue={hazard === 'flood' 
                    ? 'Heavy rainfall expected in the next few hours. Low-lying areas may experience waterlogging. Move valuables to higher ground and avoid underpasses.'
                    : 'Extreme heat conditions expected. Stay indoors between 11 AM and 4 PM. Drink water frequently. Visit nearest cooling centre if feeling unwell.'}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink mb-2 block">Channels</label>
                <div className="flex flex-wrap gap-2">
                  {['In-App', 'Push', 'SMS', 'WhatsApp', 'Voice'].map(ch => (
                    <label key={ch} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sand-100 text-sm cursor-pointer hover:bg-sand-200 transition-colors">
                      <input type="checkbox" defaultChecked={['In-App', 'Push'].includes(ch)} className="accent-teal" />
                      {ch}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-cream-100 rounded-2xl p-4 border border-sand-200">
                <h3 className="text-sm font-semibold text-ink mb-3">📊 Impact Preview</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-ink font-display">{selectedWards.length}</div>
                    <div className="text-xs text-ink-400">Wards</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-teal font-display">~{(selectedWards.length * 45000).toLocaleString()}</div>
                    <div className="text-xs text-ink-400">People Reached</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-saffron font-display">3</div>
                    <div className="text-xs text-ink-400">Languages</div>
                  </div>
                </div>
              </div>
              <div className="bg-saffron/10 rounded-xl p-3 border border-saffron/20">
                <p className="text-sm text-saffron font-medium text-center">
                  {severity === 'emergency' 
                    ? '⚠️ Emergency alerts require two-person approval before sending'
                    : '✓ Alert will be sent after your confirmation'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-sand-200 flex justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl bg-sand-100 text-ink-500 text-sm font-medium hover:bg-sand-200 transition-colors"
            >
              ← Back
            </button>
          ) : <div />}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors"
            >
              ✓ Send Alert
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// MAIN MUNICIPAL DASHBOARD
// ============================================================================
export default function MunicipalDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [wardRisks, setWardRisks] = useState<WardRisk[]>([]);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [hazardView, setHazardView] = useState<'flood' | 'heat'>('flood');
  const [showComposer, setShowComposer] = useState(false);
  const [simulationActive, setSimulationActive] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setWardRisks(generateWardRisks());
      setKpis(generateDashboardKPIs());
      setLoading(false);
    }, 500);
  }, []);

  return (
    <ProtectedRoute
      requiredRole="municipal"
      fallbackTitle="Municipal Command Portal"
      fallbackMessage="Access to the Municipal Emergency Response Dashboard requires authorized responder or officer credentials. Please sign in with your municipal account to coordinate alerts and shelters."
    >
      <div className="flex h-screen bg-cream-100">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-ink font-display capitalize">{activeTab}</h1>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-risk-low/10 text-risk-low text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse" />
                Live
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector variant="dropdown" className="text-xs" />
              {/* Simulation button */}
              <button
                onClick={() => setSimulationActive(!simulationActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  simulationActive ? 'bg-saffron text-white' : 'bg-sand-100 text-ink-500 hover:bg-sand-200'
                }`}
              >
                🎬 {simulationActive ? 'Simulation Running' : 'Demo Scenario'}
              </button>
              <button
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors shadow-glow-teal"
              >
                📣 Compose Alert
              </button>
              <DataFreshness lastUpdated={'2026-10-25T19:15:00.000Z'} source="Auto-refresh" />
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Advisory banner */}
          <div className="mb-4 p-3 rounded-xl bg-saffron/10 border border-saffron/20">
            <p className="text-xs text-saffron font-medium text-center">
              ⚠️ All data is synthetic/illustrative for demonstration. Advisory platform — complements official IMD/NDMA/TSDMA warnings.
            </p>
          </div>

          {/* ========== OVERVIEW TAB ========== */}
          {activeTab === 'overview' && kpis && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  label="Wards at Severe"
                  value={kpis.wardsAtSevere}
                  icon={<span className="text-lg">⚠️</span>}
                  color="#EF4444"
                  trend={{ value: 50, direction: 'up' }}
                  delay={0}
                />
                <KPICard
                  label="People in High Risk"
                  value={kpis.peopleInHighRisk}
                  icon={<span className="text-lg">👥</span>}
                  color="#F97316"
                  trend={{ value: 12, direction: 'up' }}
                  delay={1}
                />
                <KPICard
                  label="Shelters Open"
                  value={`${kpis.sheltersOpen} / ${hyderabadShelters.length}`}
                  icon={<span className="text-lg">🛡️</span>}
                  color="#10B981"
                  subtitle={`${kpis.shelterCapacityUsed} / ${kpis.shelterCapacityTotal} capacity used`}
                  delay={2}
                />
                <KPICard
                  label="Active Reports"
                  value={kpis.activeReports}
                  icon={<span className="text-lg">📋</span>}
                  color="#0D9488"
                  trend={{ value: 8, direction: 'stable' }}
                  delay={3}
                />
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Ward ranking */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-ink flex items-center gap-2">
                      🏘️ Ward Risk Ranking
                    </h2>
                    <div className="inline-flex bg-sand-100 rounded-full p-0.5">
                      <button
                        onClick={() => setHazardView('flood')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${hazardView === 'flood' ? 'bg-teal text-white' : 'text-ink-400'}`}
                      >
                        🌊 Flood
                      </button>
                      <button
                        onClick={() => setHazardView('heat')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${hazardView === 'heat' ? 'bg-saffron text-white' : 'text-ink-400'}`}
                      >
                        🌡️ Heat
                      </button>
                    </div>
                  </div>
                  <WardRankingTable wardRisks={wardRisks} hazardView={hazardView} />
                </div>

                {/* Right column */}
                <div className="space-y-4">
                  {/* Active Alerts */}
                  <div>
                    <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">📣 Active Alerts</h3>
                    <div className="space-y-2">
                      {mockAlerts.filter(a => a.isActive).map(alert => (
                        <AlertCard key={alert.id} alert={alert} compact />
                      ))}
                    </div>
                  </div>

                  {/* Recent Reports */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-ink text-sm flex items-center gap-2">📋 Recent Reports</h3>
                      <button
                        onClick={() => setActiveTab('reports')}
                        className="text-xs text-teal font-medium hover:text-teal-600 transition-colors"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="space-y-2">
                      {mockReports.slice(0, 3).map(report => (
                        <ReportCard key={report.id} report={report} />
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft">
                    <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
                      🧠 AI Recommendations
                    </h3>
                    <div className="space-y-2">
                      {[
                        { icon: '🚒', text: 'Pre-position 2 pumps at Ward 14 (Malakpet) by 6 PM — high flood probability', urgency: 'high' },
                        { icon: '🛡️', text: 'Open Cooling Centre in Falaknuma — heat index exceeding 48°C for 3 days', urgency: 'high' },
                        { icon: '🚧', text: 'Clear blocked drain at Chaderghat Bridge — 8 confirmed reports', urgency: 'moderate' },
                        { icon: '📣', text: 'Send heat advisory to outdoor workers in Charminar zone', urgency: 'moderate' },
                      ].map((rec, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg ${
                            rec.urgency === 'high' ? 'bg-risk-severe/5 border border-risk-severe/10' : 'bg-cream-100'
                          }`}
                        >
                          <span className="text-sm shrink-0 mt-0.5">{rec.icon}</span>
                          <p className="text-xs text-ink-600 leading-relaxed">{rec.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Data Source Health */}
                  <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft">
                    <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
                      🔌 Data Sources
                    </h3>
                    <div className="space-y-2">
                      {dataSourceStatuses.map(ds => (
                        <div key={ds.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              ds.status === 'healthy' ? 'bg-risk-low' :
                              ds.status === 'degraded' ? 'bg-risk-moderate' :
                              'bg-risk-severe'
                            }`} />
                            <span className="text-xs text-ink-500">{ds.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {ds.isMock && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-saffron/10 text-saffron font-medium">Mock</span>
                            )}
                            <span className="text-[10px] text-ink-300">{new Date(ds.lastSuccess).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== WARDS TAB ========== */}
          {activeTab === 'wards' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">All Wards ({hyderabadWards.length})</h2>
                <div className="inline-flex bg-sand-100 rounded-full p-0.5">
                  <button
                    onClick={() => setHazardView('flood')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${hazardView === 'flood' ? 'bg-teal text-white' : 'text-ink-400'}`}
                  >
                    🌊 Flood
                  </button>
                  <button
                    onClick={() => setHazardView('heat')}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${hazardView === 'heat' ? 'bg-saffron text-white' : 'text-ink-400'}`}
                  >
                    🌡️ Heat
                  </button>
                </div>
              </div>
              <WardRankingTable wardRisks={wardRisks} hazardView={hazardView} />
            </div>
          )}

          {/* ========== ALERTS TAB ========== */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">Alert Management</h2>
                <button
                  onClick={() => setShowComposer(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors"
                >
                  + Compose Alert
                </button>
              </div>
              <div className="space-y-3">
                {mockAlerts.map(alert => (
                  <div key={alert.id} className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft">
                    <AlertCard alert={alert} />
                    {alert.deliveryStats && (
                      <div className="mt-3 pt-3 border-t border-sand-100 grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-ink font-display">{alert.deliveryStats.sent.toLocaleString()}</div>
                          <div className="text-xs text-ink-400">Sent</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-teal font-display">{alert.deliveryStats.delivered.toLocaleString()}</div>
                          <div className="text-xs text-ink-400">Delivered</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-saffron font-display">{alert.deliveryStats.read.toLocaleString()}</div>
                          <div className="text-xs text-ink-400">Read</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== SHELTERS TAB ========== */}
          {activeTab === 'shelters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">Shelter Management ({hyderabadShelters.length})</h2>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors">
                  + Add Shelter
                </button>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {hyderabadShelters.map((shelter, i) => (
                  <ShelterCard key={shelter.id} shelter={{
                    ...shelter,
                    distance: 500 + ((i * 397) % 3500),
                    walkingTime: 5 + ((i * 7) % 25),
                  }} />
                ))}
              </div>
            </div>
          )}

          {/* ========== REPORTS TAB ========== */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-ink">Community Reports ({mockReports.length})</h2>
                <div className="flex gap-2">
                  {['All', 'Submitted', 'Confirmed', 'Under Review'].map(filter => (
                    <button
                      key={filter}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-sand-100 text-ink-500 hover:bg-sand-200 transition-colors"
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {mockReports.map(report => (
                  <div key={report.id} className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft">
                    <ReportCard report={report} />
                    <div className="mt-3 pt-3 border-t border-sand-100 flex gap-2">
                      <button className="px-3 py-1.5 rounded-lg bg-risk-low/10 text-risk-low text-xs font-semibold hover:bg-risk-low/20 transition-colors">
                        ✓ Verify
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-teal/10 text-teal text-xs font-semibold hover:bg-teal/20 transition-colors">
                        🔄 Assign Team
                      </button>
                      <button className="px-3 py-1.5 rounded-lg bg-sand-100 text-ink-500 text-xs font-semibold hover:bg-sand-200 transition-colors">
                        ⊘ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========== ANALYTICS TAB ========== */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h2 className="font-semibold text-ink">Analytics & Insights</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
                  <h3 className="font-semibold text-ink text-sm mb-4">Alert Reach by Channel</h3>
                  <div className="space-y-3">
                    {[
                      { channel: 'In-App', sent: 340000, delivered: 310000, color: '#0D9488' },
                      { channel: 'SMS', sent: 280000, delivered: 265000, color: '#10B981' },
                      { channel: 'Push', sent: 250000, delivered: 220000, color: '#D97706' },
                      { channel: 'WhatsApp', sent: 180000, delivered: 175000, color: '#25D366' },
                    ].map(ch => (
                      <div key={ch.channel}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-ink">{ch.channel}</span>
                          <span className="text-ink-400">{(ch.delivered / ch.sent * 100).toFixed(0)}% delivered</span>
                        </div>
                        <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${ch.delivered / ch.sent * 100}%`, backgroundColor: ch.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
                  <h3 className="font-semibold text-ink text-sm mb-4">Equity View — Alert Coverage</h3>
                  <div className="space-y-3">
                    {[
                      { group: 'Informal Settlements', coverage: 72, target: 90 },
                      { group: 'Elderly Residents', coverage: 65, target: 85 },
                      { group: 'Outdoor Workers', coverage: 58, target: 80 },
                      { group: 'Low-Lying Areas', coverage: 82, target: 95 },
                    ].map(g => (
                      <div key={g.group}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-ink">{g.group}</span>
                          <span className={g.coverage < g.target ? 'text-risk-severe' : 'text-risk-low'}>
                            {g.coverage}% / {g.target}% target
                          </span>
                        </div>
                        <div className="relative w-full h-2 bg-sand-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${g.coverage}%`,
                              backgroundColor: g.coverage >= g.target ? '#10B981' : g.coverage >= g.target * 0.8 ? '#F59E0B' : '#EF4444',
                            }}
                          />
                          <div
                            className="absolute top-0 h-full w-0.5 bg-ink-300"
                            style={{ left: `${g.target}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-ink-300 mt-3">🎯 Dotted line = coverage target</p>
                </div>
              </div>
            </div>
          )}

          {/* ========== ADMIN TAB ========== */}
          {activeTab === 'admin' && (
            <div className="space-y-6">
              <h2 className="font-semibold text-ink">Administration</h2>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { icon: '👥', title: 'User Management', desc: 'Manage roles, permissions, and user accounts', count: '5 users' },
                  { icon: '📐', title: 'Ward Data Import', desc: 'Import GeoJSON/CSV ward boundaries and data', count: '22 wards' },
                  { icon: '🎚️', title: 'Risk Thresholds', desc: 'Configure alert thresholds per hazard and city', count: '8 rules' },
                  { icon: '📝', title: 'Alert Templates', desc: 'Manage alert templates in all languages', count: '24 templates' },
                  { icon: '🔌', title: 'Data Source Config', desc: 'Configure API adapters and fixture fallbacks', count: '7 sources' },
                  { icon: '📊', title: 'Audit Logs', desc: 'View all alert sends, data changes, and actions', count: '156 entries' },
                ].map(item => (
                  <div
                    key={item.title}
                    className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                  >
                    <span className="text-3xl block mb-3">{item.icon}</span>
                    <h3 className="font-semibold text-ink mb-1">{item.title}</h3>
                    <p className="text-xs text-ink-400 mb-2">{item.desc}</p>
                    <span className="text-xs text-teal font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {['map', 'resources'].includes(activeTab) && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <span className="text-5xl block mb-4">🚧</span>
                <h2 className="text-xl font-semibold text-ink mb-2 font-display">
                  {activeTab === 'map' ? 'Live Risk Map' : 'Resource Planning'}
                </h2>
                <p className="text-sm text-ink-400">
                  Full {activeTab === 'map' ? 'MapLibre GL interactive map' : 'resource management with drag-and-drop'} view coming in next build phase
                </p>
                <Link href="/map" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors">
                  {activeTab === 'map' ? '🗺️ Open Full Map' : '📋 View Overview'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Alert Composer Modal */}
      <AnimatePresence>
        {showComposer && <AlertComposer onClose={() => setShowComposer(false)} />}
      </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
