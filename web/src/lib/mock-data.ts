// ============================================================================
// Nirvana Mock Data - Hyderabad Pilot
// All data is synthetic/illustrative for demonstration purposes
// ============================================================================

import {
  Ward, Shelter, Alert, CommunityReport, WardRisk, RiskScore,
  WeatherForecast, WeatherSnapshot, DailyForecast, DashboardKPIs,
  DataSourceStatus, SafetyGuidance, GuidanceStep, EmergencyContact,
  LanguageOption, SimulationScenario, User, RiskFactor
} from './types';

// ============================================================================
// LANGUAGES
// ============================================================================
export const languages: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latin', rtl: false, fontFamily: 'Inter' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari', rtl: false, fontFamily: 'Noto Sans Devanagari' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu', rtl: false, fontFamily: 'Noto Sans Telugu' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil', rtl: false, fontFamily: 'Noto Sans Tamil' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada', rtl: false, fontFamily: 'Noto Sans Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam', rtl: false, fontFamily: 'Noto Sans Malayalam' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari', rtl: false, fontFamily: 'Noto Sans Devanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali', rtl: false, fontFamily: 'Noto Sans Bengali' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati', rtl: false, fontFamily: 'Noto Sans Gujarati' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Oriya', rtl: false, fontFamily: 'Noto Sans Oriya' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi', rtl: false, fontFamily: 'Noto Sans Gurmukhi' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic', rtl: true, fontFamily: 'Noto Nastaliq Urdu' },
];

// ============================================================================
// EMERGENCY CONTACTS
// ============================================================================
export const emergencyContacts: EmergencyContact[] = [
  { name: 'National Emergency', number: '112', description: 'All emergencies', icon: 'phone' },
  { name: 'Ambulance', number: '108', description: 'Medical emergency', icon: 'ambulance' },
  { name: 'Police', number: '100', description: 'Police assistance', icon: 'shield' },
  { name: 'Fire', number: '101', description: 'Fire & rescue', icon: 'flame' },
  { name: 'GHMC Control Room', number: '040-21111111', description: 'Municipal emergency', icon: 'building' },
  { name: 'Disaster Helpline', number: '1070', description: 'NDMA disaster helpline', icon: 'alert-triangle' },
  { name: 'TSDMA', number: '040-23456789', description: 'Telangana State Disaster Management', icon: 'shield-alert' },
  { name: 'Women Helpline', number: '181', description: 'Women in distress', icon: 'heart' },
];

// ============================================================================
// WARDS - Hyderabad (20+ realistic wards with synthetic data)
// ============================================================================
export const hyderabadWards: Ward[] = [
  {
    id: 'w-001', name: 'Malakpet', nameLocal: 'మలక్‌పేట', zone: 'Charminar',
    population: 48000, area: 3.2,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.502, 17.365], [78.515, 17.365], [78.515, 17.375], [78.502, 17.375], [78.502, 17.365]]] }, properties: {} },
    drainageDensity: 0.6, drainageCondition: 'poor', avgElevation: 512, imperviousFraction: 0.78,
    greenCoverFraction: 0.08, informalSettlementFraction: 0.22, elderlyPopulationFraction: 0.12,
    outdoorWorkerFraction: 0.35, historicalFloodFrequency: 8, historicalHeatwaveDays: 15,
  },
  {
    id: 'w-002', name: 'Chaderghat', nameLocal: 'చాదర్‌ఘాట్', zone: 'Charminar',
    population: 35000, area: 2.1,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.490, 17.370], [78.502, 17.370], [78.502, 17.380], [78.490, 17.380], [78.490, 17.370]]] }, properties: {} },
    drainageDensity: 0.4, drainageCondition: 'poor', avgElevation: 505, imperviousFraction: 0.82,
    greenCoverFraction: 0.05, informalSettlementFraction: 0.30, elderlyPopulationFraction: 0.14,
    outdoorWorkerFraction: 0.40, historicalFloodFrequency: 12, historicalHeatwaveDays: 18,
  },
  {
    id: 'w-003', name: 'Falaknuma', nameLocal: 'ఫలక్‌నుమా', zone: 'Charminar',
    population: 52000, area: 4.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.465, 17.340], [78.485, 17.340], [78.485, 17.360], [78.465, 17.360], [78.465, 17.340]]] }, properties: {} },
    drainageDensity: 0.5, drainageCondition: 'partial', avgElevation: 535, imperviousFraction: 0.65,
    greenCoverFraction: 0.12, informalSettlementFraction: 0.35, elderlyPopulationFraction: 0.15,
    outdoorWorkerFraction: 0.38, historicalFloodFrequency: 6, historicalHeatwaveDays: 20,
  },
  {
    id: 'w-004', name: 'Moosarambagh', nameLocal: 'మూసారాంబాగ్', zone: 'LB Nagar',
    population: 42000, area: 3.8,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.510, 17.360], [78.530, 17.360], [78.530, 17.375], [78.510, 17.375], [78.510, 17.360]]] }, properties: {} },
    drainageDensity: 0.45, drainageCondition: 'poor', avgElevation: 508, imperviousFraction: 0.75,
    greenCoverFraction: 0.10, informalSettlementFraction: 0.18, elderlyPopulationFraction: 0.11,
    outdoorWorkerFraction: 0.30, historicalFloodFrequency: 10, historicalHeatwaveDays: 14,
  },
  {
    id: 'w-005', name: 'Hafiz Baba Nagar', nameLocal: 'హఫీజ్ బాబా నగర్', zone: 'Charminar',
    population: 38000, area: 2.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.515, 17.355], [78.530, 17.355], [78.530, 17.365], [78.515, 17.365], [78.515, 17.355]]] }, properties: {} },
    drainageDensity: 0.35, drainageCondition: 'poor', avgElevation: 502, imperviousFraction: 0.80,
    greenCoverFraction: 0.06, informalSettlementFraction: 0.28, elderlyPopulationFraction: 0.13,
    outdoorWorkerFraction: 0.42, historicalFloodFrequency: 11, historicalHeatwaveDays: 16,
  },
  {
    id: 'w-006', name: 'Musheerabad', nameLocal: 'ముషీరాబాద్', zone: 'Musheerabad',
    population: 55000, area: 4.2,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.485, 17.395], [78.505, 17.395], [78.505, 17.415], [78.485, 17.415], [78.485, 17.395]]] }, properties: {} },
    drainageDensity: 0.55, drainageCondition: 'partial', avgElevation: 530, imperviousFraction: 0.72,
    greenCoverFraction: 0.14, informalSettlementFraction: 0.15, elderlyPopulationFraction: 0.10,
    outdoorWorkerFraction: 0.28, historicalFloodFrequency: 5, historicalHeatwaveDays: 12,
  },
  {
    id: 'w-007', name: 'Charminar', nameLocal: 'చార్మినార్', zone: 'Charminar',
    population: 62000, area: 3.0,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.470, 17.355], [78.490, 17.355], [78.490, 17.375], [78.470, 17.375], [78.470, 17.355]]] }, properties: {} },
    drainageDensity: 0.40, drainageCondition: 'partial', avgElevation: 518, imperviousFraction: 0.85,
    greenCoverFraction: 0.04, informalSettlementFraction: 0.20, elderlyPopulationFraction: 0.16,
    outdoorWorkerFraction: 0.32, historicalFloodFrequency: 7, historicalHeatwaveDays: 22,
  },
  {
    id: 'w-008', name: 'Begumpet', nameLocal: 'బేగంపేట్', zone: 'Secunderabad',
    population: 45000, area: 5.0,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.460, 17.435], [78.480, 17.435], [78.480, 17.450], [78.460, 17.450], [78.460, 17.435]]] }, properties: {} },
    drainageDensity: 0.65, drainageCondition: 'good', avgElevation: 545, imperviousFraction: 0.70,
    greenCoverFraction: 0.18, informalSettlementFraction: 0.05, elderlyPopulationFraction: 0.08,
    outdoorWorkerFraction: 0.15, historicalFloodFrequency: 2, historicalHeatwaveDays: 10,
  },
  {
    id: 'w-009', name: 'Ameerpet', nameLocal: 'అమీర్‌పేట్', zone: 'Serilingampally',
    population: 58000, area: 4.0,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.440, 17.430], [78.460, 17.430], [78.460, 17.445], [78.440, 17.445], [78.440, 17.430]]] }, properties: {} },
    drainageDensity: 0.55, drainageCondition: 'partial', avgElevation: 540, imperviousFraction: 0.75,
    greenCoverFraction: 0.12, informalSettlementFraction: 0.08, elderlyPopulationFraction: 0.09,
    outdoorWorkerFraction: 0.20, historicalFloodFrequency: 4, historicalHeatwaveDays: 14,
  },
  {
    id: 'w-010', name: 'Kukatpally', nameLocal: 'కూకట్‌పల్లి', zone: 'Kukatpally',
    population: 72000, area: 8.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.380, 17.480], [78.410, 17.480], [78.410, 17.500], [78.380, 17.500], [78.380, 17.480]]] }, properties: {} },
    drainageDensity: 0.50, drainageCondition: 'partial', avgElevation: 555, imperviousFraction: 0.68,
    greenCoverFraction: 0.15, informalSettlementFraction: 0.10, elderlyPopulationFraction: 0.07,
    outdoorWorkerFraction: 0.22, historicalFloodFrequency: 5, historicalHeatwaveDays: 16,
  },
  {
    id: 'w-011', name: 'Secunderabad', nameLocal: 'సికింద్రాబాద్', zone: 'Secunderabad',
    population: 68000, area: 7.0,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.490, 17.430], [78.510, 17.430], [78.510, 17.450], [78.490, 17.450], [78.490, 17.430]]] }, properties: {} },
    drainageDensity: 0.60, drainageCondition: 'good', avgElevation: 550, imperviousFraction: 0.65,
    greenCoverFraction: 0.20, informalSettlementFraction: 0.06, elderlyPopulationFraction: 0.10,
    outdoorWorkerFraction: 0.18, historicalFloodFrequency: 3, historicalHeatwaveDays: 11,
  },
  {
    id: 'w-012', name: 'Tolichowki', nameLocal: 'తోలిచౌకి', zone: 'Charminar',
    population: 46000, area: 4.8,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.420, 17.380], [78.445, 17.380], [78.445, 17.400], [78.420, 17.400], [78.420, 17.380]]] }, properties: {} },
    drainageDensity: 0.48, drainageCondition: 'partial', avgElevation: 525, imperviousFraction: 0.72,
    greenCoverFraction: 0.10, informalSettlementFraction: 0.14, elderlyPopulationFraction: 0.11,
    outdoorWorkerFraction: 0.25, historicalFloodFrequency: 4, historicalHeatwaveDays: 13,
  },
  {
    id: 'w-013', name: 'Mehdipatnam', nameLocal: 'మెహదీపట్నం', zone: 'Charminar',
    population: 51000, area: 3.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.435, 17.385], [78.455, 17.385], [78.455, 17.400], [78.435, 17.400], [78.435, 17.385]]] }, properties: {} },
    drainageDensity: 0.52, drainageCondition: 'partial', avgElevation: 530, imperviousFraction: 0.74,
    greenCoverFraction: 0.09, informalSettlementFraction: 0.12, elderlyPopulationFraction: 0.10,
    outdoorWorkerFraction: 0.28, historicalFloodFrequency: 5, historicalHeatwaveDays: 15,
  },
  {
    id: 'w-014', name: 'LB Nagar', nameLocal: 'ఎల్.బి. నగర్', zone: 'LB Nagar',
    population: 65000, area: 6.2,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.540, 17.340], [78.565, 17.340], [78.565, 17.360], [78.540, 17.360], [78.540, 17.340]]] }, properties: {} },
    drainageDensity: 0.45, drainageCondition: 'partial', avgElevation: 520, imperviousFraction: 0.70,
    greenCoverFraction: 0.13, informalSettlementFraction: 0.15, elderlyPopulationFraction: 0.09,
    outdoorWorkerFraction: 0.30, historicalFloodFrequency: 6, historicalHeatwaveDays: 17,
  },
  {
    id: 'w-015', name: 'ECIL', nameLocal: 'ఈసీఐఎల్', zone: 'Malkajgiri',
    population: 48000, area: 5.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.535, 17.460], [78.560, 17.460], [78.560, 17.480], [78.535, 17.480], [78.535, 17.460]]] }, properties: {} },
    drainageDensity: 0.55, drainageCondition: 'good', avgElevation: 560, imperviousFraction: 0.60,
    greenCoverFraction: 0.22, informalSettlementFraction: 0.08, elderlyPopulationFraction: 0.08,
    outdoorWorkerFraction: 0.18, historicalFloodFrequency: 2, historicalHeatwaveDays: 18,
  },
  {
    id: 'w-016', name: 'Malkajgiri', nameLocal: 'మల్కాజ్‌గిరి', zone: 'Malkajgiri',
    population: 55000, area: 5.8,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.510, 17.450], [78.535, 17.450], [78.535, 17.470], [78.510, 17.470], [78.510, 17.450]]] }, properties: {} },
    drainageDensity: 0.50, drainageCondition: 'partial', avgElevation: 548, imperviousFraction: 0.65,
    greenCoverFraction: 0.18, informalSettlementFraction: 0.10, elderlyPopulationFraction: 0.09,
    outdoorWorkerFraction: 0.20, historicalFloodFrequency: 3, historicalHeatwaveDays: 13,
  },
  {
    id: 'w-017', name: 'Dilsukhnagar', nameLocal: 'దిల్‌సుఖ్‌నగర్', zone: 'LB Nagar',
    population: 60000, area: 3.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.520, 17.355], [78.540, 17.355], [78.540, 17.370], [78.520, 17.370], [78.520, 17.355]]] }, properties: {} },
    drainageDensity: 0.42, drainageCondition: 'partial', avgElevation: 515, imperviousFraction: 0.80,
    greenCoverFraction: 0.07, informalSettlementFraction: 0.16, elderlyPopulationFraction: 0.10,
    outdoorWorkerFraction: 0.32, historicalFloodFrequency: 7, historicalHeatwaveDays: 15,
  },
  {
    id: 'w-018', name: 'Jubilee Hills', nameLocal: 'జూబ్లీ హిల్స్', zone: 'Serilingampally',
    population: 35000, area: 8.0,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.400, 17.420], [78.430, 17.420], [78.430, 17.440], [78.400, 17.440], [78.400, 17.420]]] }, properties: {} },
    drainageDensity: 0.70, drainageCondition: 'good', avgElevation: 575, imperviousFraction: 0.45,
    greenCoverFraction: 0.35, informalSettlementFraction: 0.02, elderlyPopulationFraction: 0.12,
    outdoorWorkerFraction: 0.08, historicalFloodFrequency: 1, historicalHeatwaveDays: 6,
  },
  {
    id: 'w-019', name: 'Banjara Hills', nameLocal: 'బంజారా హిల్స్', zone: 'Serilingampally',
    population: 32000, area: 6.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.430, 17.410], [78.460, 17.410], [78.460, 17.430], [78.430, 17.430], [78.430, 17.410]]] }, properties: {} },
    drainageDensity: 0.68, drainageCondition: 'good', avgElevation: 570, imperviousFraction: 0.50,
    greenCoverFraction: 0.30, informalSettlementFraction: 0.03, elderlyPopulationFraction: 0.11,
    outdoorWorkerFraction: 0.10, historicalFloodFrequency: 1, historicalHeatwaveDays: 7,
  },
  {
    id: 'w-020', name: 'Nampally', nameLocal: 'నాంపల్లి', zone: 'Charminar',
    population: 44000, area: 2.8,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.465, 17.385], [78.485, 17.385], [78.485, 17.400], [78.465, 17.400], [78.465, 17.385]]] }, properties: {} },
    drainageDensity: 0.50, drainageCondition: 'partial', avgElevation: 535, imperviousFraction: 0.78,
    greenCoverFraction: 0.10, informalSettlementFraction: 0.12, elderlyPopulationFraction: 0.13,
    outdoorWorkerFraction: 0.25, historicalFloodFrequency: 4, historicalHeatwaveDays: 14,
  },
  {
    id: 'w-021', name: 'Hussain Sagar Area', nameLocal: 'హుస్సేన్ సాగర్ ప్రాంతం', zone: 'Secunderabad',
    population: 28000, area: 4.0,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.470, 17.415], [78.495, 17.415], [78.495, 17.435], [78.470, 17.435], [78.470, 17.415]]] }, properties: {} },
    drainageDensity: 0.72, drainageCondition: 'good', avgElevation: 515, imperviousFraction: 0.55,
    greenCoverFraction: 0.28, informalSettlementFraction: 0.04, elderlyPopulationFraction: 0.09,
    outdoorWorkerFraction: 0.12, historicalFloodFrequency: 3, historicalHeatwaveDays: 9,
  },
  {
    id: 'w-022', name: 'Uppal', nameLocal: 'ఉప్పల్', zone: 'LB Nagar',
    population: 56000, area: 5.5,
    geometry: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[78.555, 17.395], [78.580, 17.395], [78.580, 17.415], [78.555, 17.415], [78.555, 17.395]]] }, properties: {} },
    drainageDensity: 0.48, drainageCondition: 'partial', avgElevation: 530, imperviousFraction: 0.68,
    greenCoverFraction: 0.15, informalSettlementFraction: 0.14, elderlyPopulationFraction: 0.08,
    outdoorWorkerFraction: 0.28, historicalFloodFrequency: 5, historicalHeatwaveDays: 16,
  },
];

// ============================================================================
// RISK GENERATION HELPERS
// ============================================================================
function makeRiskScore(hazard: 'flood' | 'heat', level: 'low' | 'moderate' | 'high' | 'severe', horizon: 'now' | '6h' | '24h' | '72h'): RiskScore {
  const scoreMap = { low: 22, moderate: 48, high: 72, severe: 88 };
  const probMap = { low: 0.15, moderate: 0.45, high: 0.72, severe: 0.90 };
  const confMap = { low: 0.85, moderate: 0.78, high: 0.82, severe: 0.88 };
  
  const floodFactors: RiskFactor[] = [
    { name: 'Rainfall Forecast', contribution: level === 'severe' ? 0.85 : level === 'high' ? 0.65 : 0.3, description: hazard === 'flood' ? `${level === 'severe' ? '70mm' : level === 'high' ? '45mm' : '15mm'} rain expected in next 3h` : '', value: level === 'severe' ? '70mm/3h' : level === 'high' ? '45mm/3h' : '15mm/3h' },
    { name: 'Elevation', contribution: level === 'severe' ? 0.7 : level === 'high' ? 0.5 : 0.1, description: 'Low-lying area near Musi river', value: '502m ASL' },
    { name: 'Drainage Condition', contribution: level === 'severe' ? 0.6 : 0.2, description: level === 'severe' ? 'Drain blocked nearby' : 'Drain partially clear', value: level === 'severe' ? 'Blocked' : 'Partial' },
    { name: 'Historical Flooding', contribution: 0.4, description: 'Area has flooded 8 times in 5 years', value: '8 events' },
    { name: 'Impervious Surface', contribution: 0.3, description: '78% concrete/paved surface', value: '78%' },
  ];
  
  const heatFactors: RiskFactor[] = [
    { name: 'Temperature Forecast', contribution: level === 'severe' ? 0.9 : level === 'high' ? 0.7 : 0.3, description: `Max temp ${level === 'severe' ? '44°C' : level === 'high' ? '41°C' : '36°C'} expected`, value: level === 'severe' ? '44°C' : level === 'high' ? '41°C' : '36°C' },
    { name: 'Heat Index', contribution: level === 'severe' ? 0.85 : 0.4, description: `Feels like ${level === 'severe' ? '49°C' : '38°C'} with humidity`, value: level === 'severe' ? '49°C' : '38°C' },
    { name: 'Green Cover', contribution: level === 'severe' ? 0.5 : 0.2, description: 'Low vegetation cover increases heat', value: '6%' },
    { name: 'Built-up Density', contribution: 0.4, description: 'Dense built-up area traps heat', value: '82%' },
    { name: 'Outdoor Workers', contribution: level === 'severe' ? 0.6 : 0.3, description: '42% population works outdoors', value: '42%' },
  ];
  
  return {
    hazard,
    level,
    score: scoreMap[level] + Math.floor(Math.random() * 8),
    probability: probMap[level] + (Math.random() * 0.1 - 0.05),
    confidence: confMap[level],
    horizon,
    factors: hazard === 'flood' ? floodFactors : heatFactors,
    depthBucket: hazard === 'flood' ? (level === 'severe' ? '30cm+' : level === 'high' ? '10-30cm' : '< 10cm') : undefined,
    computedAt: new Date().toISOString(),
    dataFreshness: new Date(Date.now() - 12 * 60000).toISOString(),
  };
}

export function generateWardRisks(): WardRisk[] {
  const riskLevels: Record<string, { flood: 'low' | 'moderate' | 'high' | 'severe'; heat: 'low' | 'moderate' | 'high' | 'severe' }> = {
    'w-001': { flood: 'severe', heat: 'high' },
    'w-002': { flood: 'severe', heat: 'high' },
    'w-003': { flood: 'high', heat: 'severe' },
    'w-004': { flood: 'high', heat: 'moderate' },
    'w-005': { flood: 'severe', heat: 'high' },
    'w-006': { flood: 'moderate', heat: 'moderate' },
    'w-007': { flood: 'high', heat: 'severe' },
    'w-008': { flood: 'low', heat: 'moderate' },
    'w-009': { flood: 'moderate', heat: 'moderate' },
    'w-010': { flood: 'moderate', heat: 'high' },
    'w-011': { flood: 'low', heat: 'moderate' },
    'w-012': { flood: 'moderate', heat: 'moderate' },
    'w-013': { flood: 'moderate', heat: 'high' },
    'w-014': { flood: 'high', heat: 'high' },
    'w-015': { flood: 'low', heat: 'high' },
    'w-016': { flood: 'low', heat: 'moderate' },
    'w-017': { flood: 'high', heat: 'high' },
    'w-018': { flood: 'low', heat: 'low' },
    'w-019': { flood: 'low', heat: 'low' },
    'w-020': { flood: 'moderate', heat: 'moderate' },
    'w-021': { flood: 'moderate', heat: 'low' },
    'w-022': { flood: 'moderate', heat: 'high' },
  };
  
  return hyderabadWards.map(ward => ({
    wardId: ward.id,
    wardName: ward.name,
    flood: makeRiskScore('flood', riskLevels[ward.id]?.flood || 'low', 'now'),
    heat: makeRiskScore('heat', riskLevels[ward.id]?.heat || 'low', 'now'),
    population: ward.population,
    vulnerabilityIndex: ward.informalSettlementFraction * 0.3 + ward.elderlyPopulationFraction * 0.25 + ward.outdoorWorkerFraction * 0.25 + (1 - ward.greenCoverFraction) * 0.2,
    geometry: ward.geometry,
    trend: ward.historicalFloodFrequency > 7 ? 'rising' : ward.historicalFloodFrequency > 4 ? 'stable' : 'falling',
  }));
}

// ============================================================================
// SHELTERS
// ============================================================================
export const hyderabadShelters: Shelter[] = [
  {
    id: 's-001', name: 'Govt. Boys High School, Malakpet', nameLocal: 'ప్రభుత్వ బాలుర ఉన్నత పాఠశాల',
    type: 'school', lat: 17.370, lng: 78.508, address: 'Malakpet Main Road, Hyderabad',
    contact: '040-24567890', capacity: 300, currentOccupancy: 0,
    facilities: { water: true, toilets: true, power: true, medical: false, accessible: true, womenSafe: true, petFriendly: false },
    operatingHours: 'During emergencies', floodSafe: true, elevationM: 520,
    verificationStatus: 'verified_municipality', lastVerified: '2026-10-20T10:00:00Z', verifiedBy: 'GHMC Ward Officer',
  },
  {
    id: 's-002', name: 'Community Hall, Chaderghat', nameLocal: 'సామాజిక భవనం, చాదర్‌ఘాట్',
    type: 'community_hall', lat: 17.375, lng: 78.496, address: 'Near Chaderghat Bridge, Hyderabad',
    contact: '040-24567891', capacity: 200, currentOccupancy: 0,
    facilities: { water: true, toilets: true, power: true, medical: false, accessible: false, womenSafe: true, petFriendly: false },
    operatingHours: 'During emergencies', floodSafe: false, elevationM: 506,
    verificationStatus: 'verified_volunteer', lastVerified: '2026-10-18T14:00:00Z', verifiedBy: 'Volunteer Ravi K.',
  },
  {
    id: 's-003', name: 'Cooling Centre, Falaknuma', nameLocal: 'శీతలీకరణ కేంద్రం, ఫలక్‌నుమా',
    type: 'cooling_centre', lat: 17.350, lng: 78.475, address: 'Falaknuma Palace Road, Hyderabad',
    contact: '040-24567892', capacity: 150, currentOccupancy: 45,
    facilities: { water: true, toilets: true, power: true, medical: true, accessible: true, womenSafe: true, petFriendly: false },
    operatingHours: '10:00 AM - 6:00 PM', floodSafe: true, elevationM: 540,
    verificationStatus: 'verified_municipality', lastVerified: '2026-10-22T09:00:00Z', verifiedBy: 'GHMC Health Dept.',
  },
  {
    id: 's-004', name: 'Relief Camp, Musheerabad Stadium', nameLocal: 'సహాయ శిబిరం, ముషీరాబాద్',
    type: 'relief_camp', lat: 17.405, lng: 78.495, address: 'Sports Complex, Musheerabad, Hyderabad',
    contact: '040-24567893', capacity: 500, currentOccupancy: 0,
    facilities: { water: true, toilets: true, power: true, medical: true, accessible: true, womenSafe: true, petFriendly: true },
    operatingHours: '24/7 during emergencies', floodSafe: true, elevationM: 535,
    verificationStatus: 'verified_municipality', lastVerified: '2026-10-21T16:00:00Z', verifiedBy: 'GHMC Disaster Cell',
  },
  {
    id: 's-005', name: 'Osmania General Hospital', nameLocal: 'ఉస్మానియా జనరల్ ఆసుపత్రి',
    type: 'hospital', lat: 17.385, lng: 78.480, address: 'Afzal Gunj, Hyderabad',
    contact: '040-24600146', capacity: 1000, currentOccupancy: 650,
    facilities: { water: true, toilets: true, power: true, medical: true, accessible: true, womenSafe: true, petFriendly: false },
    operatingHours: '24/7', floodSafe: true, elevationM: 530,
    verificationStatus: 'verified_municipality', lastVerified: '2026-10-24T08:00:00Z', verifiedBy: 'Health Dept.',
  },
  {
    id: 's-006', name: 'Masjid-e-Shahi, Charminar', nameLocal: 'మస్జిద్-ఎ-షాహీ',
    type: 'place_of_worship', lat: 17.362, lng: 78.474, address: 'Near Charminar, Hyderabad',
    contact: '040-24567895', capacity: 250, currentOccupancy: 0,
    facilities: { water: true, toilets: true, power: true, medical: false, accessible: false, womenSafe: true, petFriendly: false },
    operatingHours: 'During emergencies', floodSafe: true, elevationM: 522,
    verificationStatus: 'verified_volunteer', lastVerified: '2026-10-15T11:00:00Z', verifiedBy: 'Volunteer Ahmed S.',
  },
  {
    id: 's-007', name: 'Govt. School, Dilsukhnagar', nameLocal: 'ప్రభుత్వ పాఠశాల, దిల్‌సుఖ్‌నగర్',
    type: 'school', lat: 17.362, lng: 78.530, address: 'Main Road, Dilsukhnagar, Hyderabad',
    contact: '040-24567896', capacity: 350, currentOccupancy: 0,
    facilities: { water: true, toilets: true, power: true, medical: false, accessible: true, womenSafe: true, petFriendly: false },
    operatingHours: 'During emergencies', floodSafe: true, elevationM: 525,
    verificationStatus: 'verified_municipality', lastVerified: '2026-10-19T13:00:00Z', verifiedBy: 'GHMC Ward Officer',
  },
  {
    id: 's-008', name: 'Community Cooling Centre, Kukatpally', nameLocal: 'శీతలీకరణ కేంద్రం, కూకట్‌పల్లి',
    type: 'cooling_centre', lat: 17.490, lng: 78.395, address: 'KPHB Colony, Kukatpally, Hyderabad',
    contact: '040-24567897', capacity: 120, currentOccupancy: 30,
    facilities: { water: true, toilets: true, power: true, medical: false, accessible: true, womenSafe: true, petFriendly: false },
    operatingHours: '9:00 AM - 8:00 PM', floodSafe: true, elevationM: 558,
    verificationStatus: 'verified_municipality', lastVerified: '2026-10-23T10:00:00Z', verifiedBy: 'GHMC Health Dept.',
  },
  {
    id: 's-009', name: 'Temple Hall, LB Nagar', nameLocal: 'ఆలయ మందిరం, ఎల్.బి. నగర్',
    type: 'place_of_worship', lat: 17.348, lng: 78.550, address: 'LB Nagar Circle, Hyderabad',
    capacity: 180, currentOccupancy: 0,
    facilities: { water: true, toilets: true, power: true, medical: false, accessible: false, womenSafe: true, petFriendly: false },
    operatingHours: 'During emergencies', floodSafe: true, elevationM: 525,
    verificationStatus: 'community_submitted', lastVerified: undefined, verifiedBy: undefined,
  },
  {
    id: 's-010', name: 'GHMC Relief Centre, Uppal', nameLocal: 'GHMC సహాయ కేంద్రం, ఉప్పల్',
    type: 'relief_camp', lat: 17.405, lng: 78.565, address: 'Uppal Bus Depot Area, Hyderabad',
    contact: '040-24567899', capacity: 400, currentOccupancy: 0,
    facilities: { water: true, toilets: true, power: true, medical: true, accessible: true, womenSafe: true, petFriendly: true },
    operatingHours: '24/7 during emergencies', floodSafe: true, elevationM: 535,
    verificationStatus: 'verified_municipality', lastVerified: '2026-10-24T07:00:00Z', verifiedBy: 'GHMC Disaster Cell',
  },
];

// ============================================================================
// ACTIVE ALERTS
// ============================================================================
export const mockAlerts: Alert[] = [
  {
    id: 'a-001', hazard: 'flood', severity: 'warning',
    title: 'Heavy Rain Warning — Musi River Corridor',
    message: 'Heavy rainfall of 60-80mm expected in next 6 hours across Malakpet, Chaderghat, Hafiz Baba Nagar and Moosarambagh areas. Low-lying areas along Musi river may experience waterlogging of 10-30cm. Move valuables to higher ground. Avoid underpasses and flooded roads.',
    actions: ['Move valuables above knee height', 'Avoid underpasses and low-lying roads', 'Keep emergency numbers saved', 'If water enters home, move to nearest shelter'],
    wardIds: ['w-001', 'w-002', 'w-004', 'w-005'],
    wardNames: ['Malakpet', 'Chaderghat', 'Moosarambagh', 'Hafiz Baba Nagar'],
    issuedAt: '2026-10-25T18:30:00.000Z',
    expiresAt: '2026-10-25T23:45:00.000Z',
    isActive: true, language: 'en',
    nearestShelter: hyderabadShelters[0],
    channels: ['in_app', 'push', 'sms', 'whatsapp'],
    sentBy: 'Operator Vijay K.', approvedBy: 'Admin Priya S.',
    estimatedReach: 163000,
    deliveryStats: { sent: 142000, delivered: 128500, read: 87200 },
  },
  {
    id: 'a-002', hazard: 'heat', severity: 'warning',
    title: 'Heat Wave Alert — Old City & Southern Zones',
    message: 'Maximum temperature expected to reach 43-44°C with heat index over 48°C. Outdoor workers and elderly residents should avoid direct sun exposure between 11 AM and 4 PM. Drink water frequently. Visit nearest cooling centre if feeling unwell.',
    actions: ['Stay indoors 11 AM - 4 PM', 'Drink water every 20 minutes if outdoors', 'Visit nearest cooling centre if feeling dizzy or nauseous', 'Check on elderly neighbours'],
    wardIds: ['w-003', 'w-007', 'w-010', 'w-013', 'w-014', 'w-015', 'w-022'],
    wardNames: ['Falaknuma', 'Charminar', 'Kukatpally', 'Mehdipatnam', 'LB Nagar', 'ECIL', 'Uppal'],
    issuedAt: '2026-10-25T16:00:00.000Z',
    expiresAt: '2026-10-26T03:00:00.000Z',
    isActive: true, language: 'en',
    channels: ['in_app', 'push', 'sms'],
    sentBy: 'Operator Ananya R.',
    estimatedReach: 345000,
    deliveryStats: { sent: 298000, delivered: 275000, read: 195000 },
  },
  {
    id: 'a-003', hazard: 'flood', severity: 'advisory',
    title: 'Rain Watch — Western Hyderabad',
    message: 'Moderate rainfall of 20-30mm expected over next 24 hours in Tolichowki, Mehdipatnam, Banjara Hills areas. Monitor weather updates. No major flooding expected but some surface waterlogging possible in low spots.',
    actions: ['Carry an umbrella if going out', 'Avoid parking in low-lying areas', 'Report any waterlogging to helpline'],
    wardIds: ['w-012', 'w-013', 'w-019'],
    wardNames: ['Tolichowki', 'Mehdipatnam', 'Banjara Hills'],
    issuedAt: '2026-10-25T18:00:00.000Z',
    expiresAt: '2026-10-26T18:00:00.000Z',
    isActive: true, language: 'en',
    channels: ['in_app'],
    sentBy: 'System (Auto)',
    estimatedReach: 129000,
    deliveryStats: { sent: 110000, delivered: 98000, read: 52000 },
  },
];

// ============================================================================
// COMMUNITY REPORTS
// ============================================================================
export const mockReports: CommunityReport[] = [
  {
    id: 'r-001', type: 'waterlogging', severity: 'high',
    description: 'Knee-deep water on Malakpet main road near railway underpass. Vehicles stranded. Water not draining.',
    lat: 17.368, lng: 78.506, wardId: 'w-001', wardName: 'Malakpet',
    status: 'confirmed', confirmations: 12,
    submittedAt: '2026-10-25T17:00:00.000Z',
    language: 'en',
  },
  {
    id: 'r-002', type: 'blocked_drain', severity: 'high',
    description: 'Main nala completely blocked with garbage and construction debris near Chaderghat bridge. Water overflowing onto road.',
    lat: 17.373, lng: 78.494, wardId: 'w-002', wardName: 'Chaderghat',
    status: 'under_review', confirmations: 8,
    submittedAt: '2026-10-25T15:00:00.000Z',
    language: 'en',
  },
  {
    id: 'r-003', type: 'heat_stress', severity: 'medium',
    description: 'Construction workers at building site showing signs of heat exhaustion. No shade or water provided by contractor.',
    lat: 17.353, lng: 78.478, wardId: 'w-003', wardName: 'Falaknuma',
    status: 'confirmed', confirmations: 5,
    submittedAt: '2026-10-25T13:00:00.000Z',
    language: 'en',
  },
  {
    id: 'r-004', type: 'waterlogging', severity: 'medium',
    description: 'Ankle-deep water accumulating in colony near Moosarambagh bus stop. Drain seems clogged.',
    lat: 17.367, lng: 78.520, wardId: 'w-004', wardName: 'Moosarambagh',
    status: 'submitted', confirmations: 3,
    submittedAt: '2026-10-25T18:00:00.000Z',
    language: 'te',
  },
  {
    id: 'r-005', type: 'power_cut', severity: 'medium',
    description: 'Power cut since morning in Hafiz Baba Nagar colony. Transformer flooded. No response from electricity board.',
    lat: 17.360, lng: 78.522, wardId: 'w-005', wardName: 'Hafiz Baba Nagar',
    status: 'under_review', confirmations: 15,
    submittedAt: '2026-10-25T11:00:00.000Z',
    language: 'hi',
  },
  {
    id: 'r-006', type: 'waterlogging', severity: 'high',
    description: 'Road completely submerged near Dilsukhnagar bus station. Traffic diverted. Some shops flooded.',
    lat: 17.360, lng: 78.532, wardId: 'w-017', wardName: 'Dilsukhnagar',
    status: 'confirmed', confirmations: 22,
    submittedAt: '2026-10-25T18:30:00.000Z',
    language: 'en',
  },
];

// ============================================================================
// WEATHER FORECAST (Mock - simulating Open-Meteo response)
// ============================================================================
export function generateMockForecast(lat: number = 17.385, lng: number = 78.4867): WeatherForecast {
  const now = new Date();
  const hourly: WeatherSnapshot[] = [];
  
  for (let i = 0; i < 72; i++) {
    const time = new Date(now.getTime() + i * 3600000);
    const hour = time.getHours();
    const isDay = hour >= 6 && hour <= 18;
    const baseTemp = isDay ? 35 + Math.sin((hour - 6) * Math.PI / 12) * 7 : 28 + Math.random() * 3;
    const rainfall = i < 8 ? Math.max(0, 15 + Math.random() * 25 - 10) : Math.max(0, Math.random() * 10 - 5);
    const humidity = 65 + Math.random() * 25;
    
    hourly.push({
      time: time.toISOString(),
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.round(humidity),
      rainfall: Math.round(rainfall * 10) / 10,
      heatIndex: Math.round((baseTemp + (humidity - 40) * 0.15) * 10) / 10,
      windSpeed: Math.round((5 + Math.random() * 15) * 10) / 10,
      windDirection: Math.round(Math.random() * 360),
      pressure: Math.round(1008 + Math.random() * 8),
      cloudCover: Math.round(40 + Math.random() * 50),
      weatherCode: rainfall > 10 ? 65 : rainfall > 2 ? 61 : isDay ? 2 : 1,
      weatherDescription: rainfall > 10 ? 'Heavy rain' : rainfall > 2 ? 'Light rain' : isDay ? 'Partly cloudy' : 'Clear',
    });
  }
  
  const daily: DailyForecast[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(now.getTime() + d * 86400000);
    daily.push({
      date: date.toISOString().split('T')[0],
      tempMax: 38 + Math.round(Math.random() * 6),
      tempMin: 25 + Math.round(Math.random() * 4),
      rainfallTotal: d < 2 ? Math.round(30 + Math.random() * 40) : Math.round(Math.random() * 15),
      rainfallProbability: d < 2 ? 0.8 + Math.random() * 0.2 : 0.2 + Math.random() * 0.3,
      heatIndexMax: 42 + Math.round(Math.random() * 5),
      weatherCode: d < 2 ? 65 : 2,
      weatherDescription: d < 2 ? 'Heavy rain' : 'Partly cloudy',
    });
  }
  
  return {
    lat, lng,
    current: hourly[0],
    hourly,
    daily,
    source: 'Open-Meteo (Mock)',
    lastUpdated: now.toISOString(),
  };
}

// ============================================================================
// DASHBOARD KPIs
// ============================================================================
export function generateDashboardKPIs(): DashboardKPIs {
  return {
    wardsAtSevere: 3,
    wardsAtHigh: 5,
    peopleInHighRisk: 285000,
    sheltersOpen: 6,
    shelterCapacityUsed: 725,
    shelterCapacityTotal: 3450,
    activeReports: mockReports.filter(r => r.status !== 'resolved').length,
    alertsSentToday: 3,
    lastUpdated: '2026-10-25T19:00:00.000Z',
  };
}

// ============================================================================
// DATA SOURCE STATUS
// ============================================================================
export const dataSourceStatuses: DataSourceStatus[] = [
  { id: 'ds-001', name: 'Open-Meteo Weather', type: 'weather', status: 'healthy', lastFetch: '2026-10-25T18:45:00.000Z', lastSuccess: '2026-10-25T18:45:00.000Z', nextFetch: '2026-10-25T19:00:00.000Z', reliability: 0.99, isMock: false },
  { id: 'ds-002', name: 'IMD Rainfall (Mock)', type: 'rainfall', status: 'healthy', lastFetch: '2026-10-25T18:30:00.000Z', lastSuccess: '2026-10-25T18:30:00.000Z', nextFetch: '2026-10-25T19:00:00.000Z', reliability: 0.95, isMock: true },
  { id: 'ds-003', name: 'SRTM Elevation', type: 'elevation', status: 'healthy', lastFetch: '2026-10-18T12:00:00.000Z', lastSuccess: '2026-10-18T12:00:00.000Z', nextFetch: '2026-11-18T12:00:00.000Z', reliability: 1.0, isMock: false },
  { id: 'ds-004', name: 'OSM Drainage', type: 'drainage', status: 'healthy', lastFetch: '2026-10-24T18:00:00.000Z', lastSuccess: '2026-10-24T18:00:00.000Z', nextFetch: '2026-10-25T18:00:00.000Z', reliability: 0.92, isMock: false },
  { id: 'ds-005', name: 'Sentinel-2 NDVI (Mock)', type: 'satellite', status: 'degraded', lastFetch: '2026-10-22T12:00:00.000Z', lastSuccess: '2026-10-20T12:00:00.000Z', nextFetch: '2026-10-26T12:00:00.000Z', errorMessage: 'Cloud cover too high for last 2 passes', reliability: 0.75, isMock: true },
  { id: 'ds-006', name: 'Historical Events CSV', type: 'historical', status: 'healthy', lastFetch: '2026-10-24T12:00:00.000Z', lastSuccess: '2026-10-24T12:00:00.000Z', nextFetch: '2026-11-01T12:00:00.000Z', reliability: 1.0, isMock: true },
  { id: 'ds-007', name: 'Census Vulnerability', type: 'vulnerability', status: 'healthy', lastFetch: '2026-09-25T12:00:00.000Z', lastSuccess: '2026-09-25T12:00:00.000Z', nextFetch: '2027-01-25T12:00:00.000Z', reliability: 0.88, isMock: true },
];

// ============================================================================
// SAFETY GUIDANCE
// ============================================================================
export const safetyGuidance: SafetyGuidance[] = [
  {
    id: 'g-001', hazard: 'flood', phase: 'before', title: 'Before Flooding',
    steps: [
      { order: 1, text: 'Move important documents and valuables above knee height or to upper floors', icon: 'arrow-up', importance: 'critical' },
      { order: 2, text: 'Charge your phone and keep a power bank ready', icon: 'battery-charging', importance: 'critical' },
      { order: 3, text: 'Store 3 days of drinking water and dry food', icon: 'droplet', importance: 'critical' },
      { order: 4, text: 'Know your nearest shelter location and safest route there', icon: 'map-pin', importance: 'critical' },
      { order: 5, text: 'Keep emergency numbers saved: 112, 108, 1070', icon: 'phone', importance: 'important' },
      { order: 6, text: 'Turn off electrical appliances at the mains if water approaches', icon: 'zap-off', importance: 'important' },
      { order: 7, text: 'Inform a family member or neighbour of your plan', icon: 'users', importance: 'helpful' },
    ],
    lastUpdated: '2026-10-01T00:00:00Z', version: 2,
  },
  {
    id: 'g-002', hazard: 'flood', phase: 'during', title: 'During Flooding',
    steps: [
      { order: 1, text: 'Never walk or drive through flowing water — 15cm can knock you over', icon: 'alert-triangle', importance: 'critical' },
      { order: 2, text: 'If water is rising in your home, move to the highest floor immediately', icon: 'arrow-up', importance: 'critical' },
      { order: 3, text: 'Avoid underpasses, bridges and riverbanks', icon: 'x-circle', importance: 'critical' },
      { order: 4, text: 'If stranded, call 112 or 1070 and stay visible. Wave a cloth.', icon: 'phone', importance: 'critical' },
      { order: 5, text: 'Do not touch electrical fittings or wires in or near water', icon: 'zap-off', importance: 'critical' },
      { order: 6, text: 'Help elderly neighbours and persons with disabilities if safe to do so', icon: 'heart', importance: 'important' },
    ],
    lastUpdated: '2026-10-01T00:00:00Z', version: 2,
  },
  {
    id: 'g-003', hazard: 'flood', phase: 'after', title: 'After Flooding',
    steps: [
      { order: 1, text: 'Do not return home until authorities confirm it is safe', icon: 'shield', importance: 'critical' },
      { order: 2, text: 'Boil drinking water or use sealed bottles — floodwater contaminates supplies', icon: 'droplet', importance: 'critical' },
      { order: 3, text: 'Watch for snakes, insects and structural damage before entering buildings', icon: 'alert-triangle', importance: 'critical' },
      { order: 4, text: 'Document damage with photos for insurance and relief claims', icon: 'camera', importance: 'important' },
      { order: 5, text: 'Report blocked drains and damage to GHMC helpline 040-21111111', icon: 'phone', importance: 'important' },
    ],
    lastUpdated: '2026-10-01T00:00:00Z', version: 2,
  },
  {
    id: 'g-004', hazard: 'heat', phase: 'before', title: 'Before a Heatwave',
    steps: [
      { order: 1, text: 'Stock up on ORS (oral rehydration salts), water, and buttermilk/chaas', icon: 'droplet', importance: 'critical' },
      { order: 2, text: 'Know the nearest cooling centre location and timings', icon: 'map-pin', importance: 'critical' },
      { order: 3, text: 'Plan outdoor work for early morning (before 10 AM) or evening (after 5 PM)', icon: 'clock', importance: 'critical' },
      { order: 4, text: 'Arrange shade or wet cloth cover for outdoor work areas', icon: 'sun', importance: 'important' },
      { order: 5, text: 'Check that fans, coolers and water supply are working', icon: 'wind', importance: 'helpful' },
    ],
    lastUpdated: '2026-10-01T00:00:00Z', version: 2,
  },
  {
    id: 'g-005', hazard: 'heat', phase: 'during', title: 'During a Heatwave',
    steps: [
      { order: 1, text: 'Drink water every 20 minutes even if not thirsty', icon: 'droplet', importance: 'critical' },
      { order: 2, text: 'Stay indoors between 11 AM and 4 PM', icon: 'home', importance: 'critical' },
      { order: 3, text: 'Wear light-coloured, loose cotton clothes and a hat or umbrella', icon: 'shirt', importance: 'critical' },
      { order: 4, text: 'If feeling dizzy, nauseous, or having rapid heartbeat — move to shade, drink water, and call 108', icon: 'alert-triangle', importance: 'critical' },
      { order: 5, text: 'Check on elderly and ill neighbours twice a day', icon: 'heart', importance: 'important' },
      { order: 6, text: 'Keep animals in shade with water access', icon: 'heart', importance: 'helpful' },
    ],
    lastUpdated: '2026-10-01T00:00:00Z', version: 2,
  },
  {
    id: 'g-006', hazard: 'heat', phase: 'after', title: 'After a Heatwave',
    steps: [
      { order: 1, text: 'Continue hydrating well for 2-3 days as body recovers', icon: 'droplet', importance: 'critical' },
      { order: 2, text: 'Seek medical help if symptoms like headache, confusion, or no sweating persist', icon: 'hospital', importance: 'critical' },
      { order: 3, text: 'Gradually return to normal outdoor activity — avoid sudden exertion', icon: 'activity', importance: 'important' },
    ],
    lastUpdated: '2026-10-01T00:00:00Z', version: 2,
  },
];

// ============================================================================
// SIMULATION SCENARIOS
// ============================================================================
export const simulationScenarios: SimulationScenario[] = [
  {
    id: 'sim-001', name: 'Heavy Rain Event', type: 'heavy_rain',
    description: 'Simulates 3-hour heavy rainfall build-up (60-100mm) across Musi river corridor, causing progressive flooding in low-lying wards. Triggers alerts, shelter activations, and community reports.',
    durationMinutes: 15, // compressed demo time
    parameters: { peakRainfallMmHr: 80, durationHours: 3, affectedWards: 8 },
  },
  {
    id: 'sim-002', name: 'Heatwave Scenario', type: 'heatwave',
    description: 'Simulates 3-day severe heatwave with temperatures reaching 44-46°C in Old City and southern zones. Progressive heat stress alerts and cooling centre activations.',
    durationMinutes: 10,
    parameters: { peakTempC: 45, durationDays: 3, heatIndexPeak: 52, affectedWards: 10 },
  },
];

// ============================================================================
// DEMO USERS
// ============================================================================
export const demoUsers: User[] = [
  {
    id: 'u-citizen', phone: '+91-9876543210', name: 'Rahul Kumar',
    role: 'citizen', language: 'en',
    location: { lat: 17.370, lng: 78.506, wardId: 'w-001' },
    vulnerableProfiles: [], alertChannels: ['in_app', 'push', 'sms'],
    consentGiven: true, createdAt: '2026-09-01T00:00:00Z',
  },
  {
    id: 'u-vulnerable', phone: '+91-9876543211', name: 'Lakshmi Devi',
    role: 'vulnerable_citizen', language: 'te',
    location: { lat: 17.355, lng: 78.475, wardId: 'w-003' },
    vulnerableProfiles: ['elderly', 'low_lying'],
    alertChannels: ['in_app', 'push', 'sms', 'whatsapp', 'voice'],
    consentGiven: true, createdAt: '2026-08-15T00:00:00Z',
  },
  {
    id: 'u-worker', phone: '+91-9876543212', name: 'Mohammed Ismail',
    role: 'vulnerable_citizen', language: 'hi',
    location: { lat: 17.362, lng: 78.474, wardId: 'w-007' },
    vulnerableProfiles: ['outdoor_worker', 'informal_housing'],
    alertChannels: ['in_app', 'sms'],
    consentGiven: true, createdAt: '2026-09-10T00:00:00Z',
  },
  {
    id: 'u-operator', email: 'operator@nw.gov', name: 'Vijay Kumar',
    role: 'operator', language: 'en',
    alertChannels: ['in_app'], consentGiven: true,
    vulnerableProfiles: [],
    createdAt: '2026-07-01T00:00:00Z',
  },
  {
    id: 'u-admin', email: 'admin@nw.gov', name: 'Priya Sharma',
    role: 'admin', language: 'en',
    alertChannels: ['in_app'], consentGiven: true,
    vulnerableProfiles: [],
    createdAt: '2026-06-01T00:00:00Z',
  },
];
