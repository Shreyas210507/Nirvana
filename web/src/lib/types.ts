// ============================================================================
// Nirvana Core Types
// ============================================================================

// Risk Types
export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';
export type HazardType = 'flood' | 'heat';
export type Horizon = 'now' | '6h' | '24h' | '72h';

export interface RiskScore {
  hazard: HazardType;
  level: RiskLevel;
  score: number; // 0-100
  probability: number; // 0-1
  confidence: number; // 0-1
  horizon: Horizon;
  factors: RiskFactor[];
  depthBucket?: '< 10cm' | '10-30cm' | '30cm+';
  computedAt: string;
  dataFreshness: string;
}

export interface RiskFactor {
  name: string;
  contribution: number; // -1 to 1 (SHAP-like)
  description: string;
  value: string;
}

export interface CellRisk {
  cellId: string; // H3 cell ID
  lat: number;
  lng: number;
  flood: RiskScore;
  heat: RiskScore;
  wardId: string;
  wardName: string;
}

export interface WardRisk {
  wardId: string;
  wardName: string;
  flood: RiskScore;
  heat: RiskScore;
  population: number;
  vulnerabilityIndex: number;
  geometry: GeoJSON.Feature;
  trend: 'rising' | 'stable' | 'falling';
}

// Weather Types
export interface WeatherForecast {
  lat: number;
  lng: number;
  current: WeatherSnapshot;
  hourly: WeatherSnapshot[];
  daily: DailyForecast[];
  source: string;
  lastUpdated: string;
}

export interface WeatherSnapshot {
  time: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  heatIndex: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  cloudCover: number;
  weatherCode: number;
  weatherDescription: string;
}

export interface DailyForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  rainfallTotal: number;
  rainfallProbability: number;
  heatIndexMax: number;
  weatherCode: number;
  weatherDescription: string;
}

// Ward & Geography
export interface Ward {
  id: string;
  name: string;
  nameLocal?: string;
  zone: string;
  population: number;
  area: number; // sq km
  geometry: GeoJSON.Feature;
  drainageDensity: number;
  drainageCondition: 'good' | 'partial' | 'poor' | 'unknown';
  avgElevation: number;
  imperviousFraction: number;
  greenCoverFraction: number;
  informalSettlementFraction: number;
  elderlyPopulationFraction: number;
  outdoorWorkerFraction: number;
  historicalFloodFrequency: number;
  historicalHeatwaveDays: number;
}

export interface DrainageSegment {
  id: string;
  geometry: GeoJSON.LineString;
  condition: 'clear' | 'partially_blocked' | 'blocked' | 'unknown';
  lastInspected?: string;
  wardId: string;
}

// Shelter Types
export type ShelterType = 'school' | 'community_hall' | 'relief_camp' | 'cooling_centre' | 'hospital' | 'place_of_worship' | 'other';
export type VerificationStatus = 'verified_municipality' | 'verified_volunteer' | 'community_submitted' | 'unverified';

export interface Shelter {
  id: string;
  name: string;
  nameLocal?: string;
  type: ShelterType;
  lat: number;
  lng: number;
  address: string;
  contact?: string;
  capacity: number;
  currentOccupancy: number;
  facilities: ShelterFacilities;
  operatingHours?: string;
  floodSafe: boolean;
  elevationM: number;
  verificationStatus: VerificationStatus;
  lastVerified?: string;
  verifiedBy?: string;
  distance?: number; // meters from user, computed
  walkingTime?: number; // minutes, computed
}

export interface ShelterFacilities {
  water: boolean;
  toilets: boolean;
  power: boolean;
  medical: boolean;
  accessible: boolean;
  womenSafe: boolean;
  petFriendly: boolean;
}

// Alert Types
export type AlertSeverity = 'advisory' | 'watch' | 'warning' | 'emergency';
export type AlertChannel = 'in_app' | 'push' | 'sms' | 'whatsapp' | 'voice' | 'loudspeaker';

export interface Alert {
  id: string;
  hazard: HazardType;
  severity: AlertSeverity;
  title: string;
  message: string;
  actions: string[];
  wardIds: string[];
  wardNames: string[];
  issuedAt: string;
  expiresAt: string;
  isActive: boolean;
  language: string;
  nearestShelter?: Shelter;
  channels: AlertChannel[];
  sentBy?: string;
  approvedBy?: string;
  estimatedReach: number;
  deliveryStats?: {
    sent: number;
    delivered: number;
    read: number;
  };
}

// Report Types
export type ReportType = 'waterlogging' | 'blocked_drain' | 'heat_stress' | 'power_cut' | 'other';
export type ReportStatus = 'submitted' | 'confirmed' | 'under_review' | 'resolved' | 'rejected';

export interface CommunityReport {
  id: string;
  type: ReportType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  lat: number;
  lng: number;
  wardId: string;
  wardName: string;
  photoUrl?: string;
  voiceNoteUrl?: string;
  status: ReportStatus;
  confirmations: number;
  submittedAt: string;
  submittedBy?: string;
  language: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

// User Types
export type UserRole = 'citizen' | 'vulnerable_citizen' | 'volunteer' | 'operator' | 'admin';
export type VulnerableProfile = 'outdoor_worker' | 'elderly' | 'low_lying' | 'informal_housing' | 'mobility_needs';

export interface User {
  id: string;
  phone?: string;
  email?: string;
  name?: string;
  role: UserRole;
  language: string;
  location?: {
    lat: number;
    lng: number;
    wardId: string;
  };
  vulnerableProfiles: VulnerableProfile[];
  alertChannels: AlertChannel[];
  quietHoursStart?: string; // HH:MM
  quietHoursEnd?: string; // HH:MM
  consentGiven: boolean;
  createdAt: string;
}

// Dashboard KPIs
export interface DashboardKPIs {
  wardsAtSevere: number;
  wardsAtHigh: number;
  peopleInHighRisk: number;
  sheltersOpen: number;
  shelterCapacityUsed: number;
  shelterCapacityTotal: number;
  activeReports: number;
  alertsSentToday: number;
  lastUpdated: string;
}

// Data Source Status
export interface DataSourceStatus {
  id: string;
  name: string;
  type: 'weather' | 'rainfall' | 'elevation' | 'drainage' | 'satellite' | 'historical' | 'vulnerability';
  status: 'healthy' | 'degraded' | 'error' | 'offline';
  lastFetch: string;
  lastSuccess: string;
  nextFetch: string;
  errorMessage?: string;
  reliability: number;
  isMock: boolean;
}

// Guidance
export interface SafetyGuidance {
  id: string;
  hazard: HazardType;
  phase: 'before' | 'during' | 'after';
  persona?: VulnerableProfile;
  title: string;
  titleLocal?: string;
  steps: GuidanceStep[];
  audioUrl?: string;
  lastUpdated: string;
  version: number;
}

export interface GuidanceStep {
  order: number;
  text: string;
  textLocal?: string;
  icon?: string;
  importance: 'critical' | 'important' | 'helpful';
}

// Language
export type SupportedLanguage = 'en' | 'hi' | 'te' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn' | 'gu' | 'or' | 'pa' | 'ur';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  rtl: boolean;
  fontFamily: string;
}

// Simulation
export interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  type: 'heavy_rain' | 'heatwave' | 'custom';
  durationMinutes: number;
  parameters: Record<string, number>;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    version: string;
    source: string;
    confidence?: number;
    dataFreshness?: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
}

// Audit Log
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
}

// Emergency Contacts
export interface EmergencyContact {
  name: string;
  number: string;
  description: string;
  icon: string;
}
