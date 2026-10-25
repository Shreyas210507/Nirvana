import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRiskLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

export function getRiskColor(level: string): string {
  const colors: Record<string, string> = {
    low: '#10B981',
    moderate: '#F59E0B',
    high: '#F97316',
    severe: '#EF4444',
  };
  return colors[level.toLowerCase()] || colors.low;
}

export function getRiskBgClass(level: string): string {
  const classes: Record<string, string> = {
    low: 'bg-risk-low/10 text-risk-low',
    moderate: 'bg-risk-moderate/10 text-risk-moderate',
    high: 'bg-risk-high/10 text-risk-high',
    severe: 'bg-risk-severe/10 text-risk-severe',
  };
  return classes[level.toLowerCase()] || classes.low;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

export function formatWalkingTime(meters: number): string {
  const minutes = Math.round(meters / 80); // ~80m/min walking speed
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min walk`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m walk`;
}

export function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatDataFreshness(lastUpdated: string | Date): {
  label: string;
  status: 'fresh' | 'stale' | 'outdated';
} {
  const now = new Date();
  const updated = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated;
  const minutes = Math.floor((now.getTime() - updated.getTime()) / 60000);
  
  if (minutes < 30) return { label: `Updated ${minutes}m ago`, status: 'fresh' };
  if (minutes < 120) return { label: `Updated ${Math.floor(minutes / 60)}h ago`, status: 'stale' };
  return { label: `Updated ${Math.floor(minutes / 1440)}d ago`, status: 'outdated' };
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}
