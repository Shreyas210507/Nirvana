'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn, getRiskColor } from '@/lib/utils';
import { RiskLevel, HazardType } from '@/lib/types';
import { useI18n } from '@/lib/i18n-context';
import { languages as defaultLanguages } from '@/lib/mock-data';

interface RiskGaugeProps {
  level: RiskLevel;
  score: number;
  hazard: HazardType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { width: 80, strokeWidth: 6, fontSize: '0.75rem', labelSize: '0.625rem' },
  md: { width: 120, strokeWidth: 8, fontSize: '1.125rem', labelSize: '0.75rem' },
  lg: { width: 160, strokeWidth: 10, fontSize: '1.5rem', labelSize: '0.875rem' },
};

export function RiskGauge({ level, score, hazard, size = 'md', showLabel = true, animated = true, className }: RiskGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const config = sizeMap[size];
  const radius = (config.width - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference * 0.75; // 270 degree arc
  const offset = halfCircumference - (animatedScore / 100) * halfCircumference;
  const color = getRiskColor(level);
  
  useEffect(() => {
    if (!animated) {
      setAnimatedScore(score);
      return;
    }
    let frame: number;
    const startTime = Date.now();
    const duration = 1500;
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setAnimatedScore(Math.round(score * eased));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score, animated]);

  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
  const hazardEmoji = hazard === 'flood' ? '🌊' : '🌡️';

  return (
    <div className={cn('relative flex flex-col items-center', className)}>
      <svg
        width={config.width}
        height={config.width}
        viewBox={`0 0 ${config.width} ${config.width}`}
        className="transform -rotate-[135deg]"
      >
        {/* Background arc */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={config.strokeWidth}
          strokeDasharray={`${halfCircumference} ${circumference}`}
          strokeLinecap="round"
        />
        {/* Score arc */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={config.strokeWidth}
          strokeDasharray={`${halfCircumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: size === 'sm' ? '4px' : '8px' }}>
        <span className="text-lg leading-none mb-0.5">{hazardEmoji}</span>
        <span className="font-bold text-ink" style={{ fontSize: config.fontSize }}>
          {animatedScore}
        </span>
        {showLabel && (
          <span
            className="font-semibold uppercase tracking-wider"
            style={{ fontSize: config.labelSize, color }}
          >
            {levelLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// RISK BADGE
// ============================================================================
interface RiskBadgeProps {
  level: RiskLevel;
  hazard?: HazardType;
  size?: 'sm' | 'md';
  className?: string;
}

export function RiskBadge({ level, hazard, size = 'md', className }: RiskBadgeProps) {
  const color = getRiskColor(level);
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
  const icon = level === 'severe' ? '⚠️' : level === 'high' ? '🔶' : level === 'moderate' ? '🟡' : '🟢';
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        level === 'severe' && 'severe-breathing',
        className
      )}
      style={{
        backgroundColor: `${color}15`,
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <span className="text-xs">{icon}</span>
      {hazard && <span className="capitalize">{hazard}</span>}
      {levelLabel}
    </span>
  );
}

// ============================================================================
// KPI CARD
// ============================================================================
interface KPICardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: { value: number; direction: 'up' | 'down' | 'stable' };
  color?: string;
  subtitle?: string;
  className?: string;
  delay?: number;
}

export function KPICard({ label, value, icon, trend, color = '#0D9488', subtitle, className, delay = 0 }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : 0;
  
  useEffect(() => {
    if (typeof value !== 'number') return;
    const startTime = Date.now();
    const duration = 1200;
    const frame = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(numericValue * eased));
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [numericValue, value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1, duration: 0.5 }}
      className={cn(
        'bg-white rounded-2xl p-5 border border-sand-200 shadow-soft',
        'hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>
        {trend && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full',
            trend.direction === 'up' ? 'bg-red-50 text-red-600' :
            trend.direction === 'down' ? 'bg-green-50 text-green-600' :
            'bg-gray-50 text-gray-500'
          )}>
            {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}
            {trend.value}%
          </div>
        )}
      </div>
      <div className="font-bold text-2xl text-ink mb-1" style={{ fontFamily: 'Outfit' }}>
        {typeof value === 'number' ? displayValue.toLocaleString() : value}
      </div>
      <div className="text-sm text-ink-400">{label}</div>
      {subtitle && <div className="text-xs text-ink-300 mt-1">{subtitle}</div>}
    </motion.div>
  );
}

// ============================================================================
// ALERT CARD
// ============================================================================
interface AlertCardProps {
  alert: {
    id: string;
    hazard: HazardType;
    severity: string;
    title: string;
    message: string;
    actions: string[];
    wardNames: string[];
    issuedAt: string;
    expiresAt: string;
  };
  compact?: boolean;
  className?: string;
  onListen?: () => void;
  onShare?: () => void;
}

export function AlertCard({ alert, compact = false, className, onListen, onShare }: AlertCardProps) {
  const severityColors: Record<string, string> = {
    emergency: '#EF4444',
    warning: '#F97316',
    watch: '#F59E0B',
    advisory: '#0D9488',
  };
  const color = severityColors[alert.severity] || '#0D9488';
  const timeAgo = getTimeAgo(alert.issuedAt);
  const icon = alert.hazard === 'flood' ? '🌧️' : '☀️';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        'bg-white rounded-2xl border overflow-hidden transition-all duration-300',
        'hover:shadow-soft-md',
        alert.severity === 'emergency' && 'severe-breathing',
        className
      )}
      style={{ borderColor: `${color}30`, borderLeftWidth: '4px', borderLeftColor: color }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div>
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color }}
              >
                {alert.severity} • {alert.hazard}
              </span>
              <h3 className="font-semibold text-ink text-sm leading-tight mt-0.5">{alert.title}</h3>
            </div>
          </div>
          <span className="text-xs text-ink-400 whitespace-nowrap">{timeAgo}</span>
        </div>
        
        {!compact && (
          <>
            <p className="text-sm text-ink-500 mb-3 leading-relaxed">{alert.message}</p>
            
            <div className="flex flex-wrap gap-1.5 mb-3">
              {alert.wardNames.map(ward => (
                <span key={ward} className="text-xs px-2 py-0.5 rounded-full bg-sand-100 text-ink-500 font-medium">
                  📍 {ward}
                </span>
              ))}
            </div>
            
            {alert.actions.length > 0 && (
              <div className="bg-cream-100/50 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-ink-500 mb-2 uppercase tracking-wider">What to do:</p>
                <ul className="space-y-1.5">
                  {alert.actions.map((action, i) => (
                    <li key={i} className="text-sm text-ink-600 flex items-start gap-2">
                      <span className="text-teal mt-0.5 shrink-0">✓</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {onListen && (
                <button
                  onClick={onListen}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal/10 text-teal text-xs font-medium hover:bg-teal/20 transition-colors"
                >
                  🔊 Listen
                </button>
              )}
              {onShare && (
                <button
                  onClick={onShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sand-100 text-ink-500 text-xs font-medium hover:bg-sand-200 transition-colors"
                >
                  📤 Share
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// SHELTER CARD
// ============================================================================
interface ShelterCardProps {
  shelter: {
    id: string;
    name: string;
    type: string;
    address: string;
    capacity: number;
    currentOccupancy: number;
    verificationStatus: string;
    floodSafe: boolean;
    distance?: number;
    walkingTime?: number;
    facilities: {
      water: boolean;
      toilets: boolean;
      power: boolean;
      medical: boolean;
      accessible: boolean;
    };
    contact?: string;
  };
  compact?: boolean;
  className?: string;
}

export function ShelterCard({ shelter, compact = false, className }: ShelterCardProps) {
  const typeIcons: Record<string, string> = {
    school: '🏫', community_hall: '🏛️', relief_camp: '⛺', cooling_centre: '❄️',
    hospital: '🏥', place_of_worship: '🕌', other: '🏠',
  };
  const icon = typeIcons[shelter.type] || '🏠';
  const isVerified = shelter.verificationStatus === 'verified_municipality' || shelter.verificationStatus === 'verified_volunteer';
  const occupancyPercent = Math.round((shelter.currentOccupancy / shelter.capacity) * 100);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-2xl border border-sand-200 p-4 shadow-soft',
        'hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-300',
        !isVerified && 'opacity-75',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center text-xl shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-ink text-sm truncate">{shelter.name}</h4>
            {isVerified ? (
              <span className="text-xs text-teal">✓ Verified</span>
            ) : (
              <span className="text-xs text-saffron">⚠ Unverified</span>
            )}
          </div>
          <p className="text-xs text-ink-400 mb-2 truncate">{shelter.address}</p>
          
          {!compact && (
            <>
              <div className="flex items-center gap-3 mb-2">
                {shelter.distance && (
                  <span className="text-xs text-ink-500">
                    📍 {shelter.distance < 1000 ? `${shelter.distance}m` : `${(shelter.distance / 1000).toFixed(1)}km`}
                  </span>
                )}
                {shelter.walkingTime && (
                  <span className="text-xs text-ink-500">🚶 {shelter.walkingTime} min</span>
                )}
                {shelter.floodSafe && (
                  <span className="text-xs text-risk-low font-medium">🛡️ Flood safe</span>
                )}
              </div>
              
              {/* Capacity bar */}
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-400">Capacity</span>
                  <span className="font-medium text-ink-500">{shelter.currentOccupancy}/{shelter.capacity}</span>
                </div>
                <div className="w-full h-1.5 bg-sand-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${occupancyPercent}%`,
                      backgroundColor: occupancyPercent > 80 ? '#EF4444' : occupancyPercent > 50 ? '#F59E0B' : '#10B981',
                    }}
                  />
                </div>
              </div>
              
              {/* Facilities */}
              <div className="flex gap-2 flex-wrap">
                {shelter.facilities.water && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">💧</span>}
                {shelter.facilities.toilets && <span className="text-xs px-1.5 py-0.5 rounded bg-gray-50 text-gray-600">🚻</span>}
                {shelter.facilities.power && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600">⚡</span>}
                {shelter.facilities.medical && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-600">🏥</span>}
                {shelter.facilities.accessible && <span className="text-xs px-1.5 py-0.5 rounded bg-teal-50 text-teal-600">♿</span>}
              </div>
            </>
          )}
          
          {shelter.contact && !compact && (
            <a
              href={`tel:${shelter.contact}`}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal text-white text-xs font-medium hover:bg-teal-600 transition-colors"
            >
              📞 Call
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// DATA FRESHNESS INDICATOR
// ============================================================================
interface DataFreshnessProps {
  lastUpdated: string;
  source?: string;
  className?: string;
}

export function DataFreshness({ lastUpdated, source, className }: DataFreshnessProps) {
  const { label, status } = getDataFreshness(lastUpdated);
  const statusColors = {
    fresh: 'text-risk-low',
    stale: 'text-risk-moderate',
    outdated: 'text-risk-high',
  };
  
  return (
    <div className={cn('flex items-center gap-1.5 text-xs', className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', {
        'bg-risk-low': status === 'fresh',
        'bg-risk-moderate': status === 'stale',
        'bg-risk-high': status === 'outdated',
      })} />
      <span className={cn('font-medium', statusColors[status])}>
        {label}
      </span>
      {source && <span className="text-ink-300">• {source}</span>}
    </div>
  );
}

// ============================================================================
// SKELETON SHIMMER
// ============================================================================
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('shimmer rounded-lg', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

// ============================================================================
// LANGUAGE SELECTOR
// ============================================================================
interface LanguageSelectorProps {
  languages?: Array<{ code: string; nativeName: string; name: string }>;
  selected?: string;
  onChange?: (code: string) => void;
  variant?: 'chips' | 'dropdown';
  className?: string;
  ariaLabel?: string;
}

function useI18nSafe() {
  try {
    return useI18n();
  } catch {
    return null;
  }
}

export function LanguageSelector({
  languages: propLanguages,
  selected: propSelected,
  onChange: propOnChange,
  variant = 'chips',
  className,
  ariaLabel = 'Select language',
}: LanguageSelectorProps) {
  const i18n = useI18nSafe();
  const languages = propLanguages || i18n?.languages || defaultLanguages;
  const selected = propSelected || i18n?.locale || 'en';
  const onChange = propOnChange || (i18n ? ((code: string) => i18n.setLocale(code as any)) : () => {});

  if (variant === 'chips') {
    return (
      <div
        role="group"
        aria-label={ariaLabel}
        className={cn('flex flex-wrap gap-2', className)}
      >
        {languages.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onChange(lang.code)}
              aria-pressed={isSelected}
              aria-label={`${lang.nativeName} (${lang.name})`}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal/40',
                isSelected
                  ? 'bg-teal text-white shadow-glow-teal font-semibold scale-102'
                  : 'bg-sand-100 text-ink-500 hover:bg-sand-200 hover:text-ink'
              )}
            >
              <span>{lang.nativeName}</span>
              {isSelected && <span className="sr-only"> (Selected)</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <label htmlFor="language-selector-dropdown" className="sr-only">
        {ariaLabel}
      </label>
      <select
        id="language-selector-dropdown"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className={cn(
          'px-3 py-2 rounded-xl bg-white border border-sand-200 text-sm text-ink font-medium shadow-xs',
          'focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal cursor-pointer',
          className
        )}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// TIMELINE CHIP SELECTOR
// ============================================================================
interface TimelineChipsProps {
  horizons: Array<{ value: string; label: string }>;
  selected: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimelineChips({ horizons, selected, onChange, className }: TimelineChipsProps) {
  return (
    <div className={cn('inline-flex bg-sand-100 rounded-full p-1', className)}>
      {horizons.map(h => (
        <button
          key={h.value}
          onClick={() => onChange(h.value)}
          className={cn(
            'relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300',
            selected === h.value
              ? 'bg-white text-teal shadow-soft'
              : 'text-ink-400 hover:text-ink-600'
          )}
        >
          {h.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// REPORT CARD
// ============================================================================
interface ReportCardProps {
  report: {
    id: string;
    type: string;
    severity: string;
    description: string;
    wardName: string;
    status: string;
    confirmations: number;
    submittedAt: string;
  };
  className?: string;
}

export function ReportCard({ report, className }: ReportCardProps) {
  const typeIcons: Record<string, string> = {
    waterlogging: '🌊', blocked_drain: '🚧', heat_stress: '🥵', power_cut: '⚡', other: '📋',
  };
  const statusColors: Record<string, string> = {
    submitted: '#F59E0B', confirmed: '#10B981', under_review: '#0D9488', resolved: '#94A3B8', rejected: '#EF4444',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-2xl border border-sand-200 p-4 shadow-soft',
        'hover:shadow-soft-md transition-all duration-300',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl">{typeIcons[report.type] || '📋'}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: `${statusColors[report.status]}15`,
                color: statusColors[report.status],
              }}
            >
              {report.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-ink-400">📍 {report.wardName}</span>
          </div>
          <p className="text-sm text-ink-600 line-clamp-2 mb-2">{report.description}</p>
          <div className="flex items-center gap-3 text-xs text-ink-400">
            <span>👥 {report.confirmations} confirmed</span>
            <span>{getTimeAgo(report.submittedAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================
function getTimeAgo(dateStr: string): string {
  if (typeof window === 'undefined') return '';
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getDataFreshness(lastUpdated: string) {
  if (typeof window === 'undefined') return { label: 'Loading...', status: 'fresh' as const };
  const now = Date.now();
  const updated = new Date(lastUpdated).getTime();
  const minutes = Math.floor((now - updated) / 60000);
  if (minutes < 30) return { label: `Updated ${minutes}m ago`, status: 'fresh' as const };
  if (minutes < 120) return { label: `Updated ${Math.floor(minutes / 60)}h ago`, status: 'stale' as const };
  return { label: `Updated ${Math.floor(minutes / 1440)}d ago`, status: 'outdated' as const };
}

