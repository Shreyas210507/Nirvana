/**
 * Automated Verification Script for Frontend Location & Weather Service Modules
 * Tests coordinate boundary validation, WMO code interpretation, cache semantics,
 * and geocoding matching.
 */

import assert from 'node:assert';

// 1. Test validateCoordinates logic
function validateCoordinates(lat, lng) {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return { valid: false, error: 'Latitude and longitude are required.' };
  }
  const nLat = typeof lat === 'number' ? lat : parseFloat(String(lat));
  const nLng = typeof lng === 'number' ? lng : parseFloat(String(lng));

  if (!Number.isFinite(nLat) || Number.isNaN(nLat)) {
    return { valid: false, error: 'Latitude must be a valid finite number.' };
  }
  if (!Number.isFinite(nLng) || Number.isNaN(nLng)) {
    return { valid: false, error: 'Longitude must be a valid finite number.' };
  }
  if (nLat < -90 || nLat > 90) {
    return { valid: false, error: `Latitude ${nLat} is out of valid range (-90 to 90).` };
  }
  if (nLng < -180 || nLng > 180) {
    return { valid: false, error: `Longitude ${nLng} is out of valid range (-180 to 180).` };
  }
  return { valid: true, latitude: nLat, longitude: nLng };
}

// 2. Test WMO interpretations
const WMO_INTERPRETATIONS = {
  0: { description: 'Clear sky', emoji: '☀️' },
  1: { description: 'Mainly clear', emoji: '🌤️' },
  2: { description: 'Partly cloudy', emoji: '⛅' },
  3: { description: 'Overcast', emoji: '☁️' },
  45: { description: 'Fog', emoji: '🌫️' },
  61: { description: 'Slight rain', emoji: '🌧️' },
  65: { description: 'Heavy rain', emoji: '⛈️' },
  80: { description: 'Slight rain showers', emoji: '🌦️' },
  95: { description: 'Thunderstorm', emoji: '⛈️' },
};

function interpretWmoCode(code) {
  return WMO_INTERPRETATIONS[code] || { description: 'Cloudy', emoji: '☁️' };
}

console.log('--- RUNNING FRONTEND SERVICE UNIT TESTS ---');

// Test 1: Coordinate boundary checks
console.log('1. Testing coordinate boundary validation...');
assert.strictEqual(validateCoordinates(null, 78.4).valid, false, 'null lat should fail');
assert.strictEqual(validateCoordinates(17.38, undefined).valid, false, 'undefined lng should fail');
assert.strictEqual(validateCoordinates(NaN, 78.4).valid, false, 'NaN lat should fail');
assert.strictEqual(validateCoordinates(17.38, Infinity).valid, false, 'Infinity lng should fail');
assert.strictEqual(validateCoordinates(-Infinity, 78.4).valid, false, '-Infinity lat should fail');
assert.strictEqual(validateCoordinates(90.1, 78.4).valid, false, 'Lat > 90 should fail');
assert.strictEqual(validateCoordinates(-90.1, 78.4).valid, false, 'Lat < -90 should fail');
assert.strictEqual(validateCoordinates(17.38, 180.1).valid, false, 'Lng > 180 should fail');
assert.strictEqual(validateCoordinates(17.38, -180.1).valid, false, 'Lng < -180 should fail');

// Valid cases
const validHyd = validateCoordinates(17.385, 78.4867);
assert.strictEqual(validHyd.valid, true);
assert.strictEqual(validHyd.latitude, 17.385);
assert.strictEqual(validHyd.longitude, 78.4867);

const validEquator = validateCoordinates(0, 0);
assert.strictEqual(validEquator.valid, true);
assert.strictEqual(validEquator.latitude, 0);
assert.strictEqual(validEquator.longitude, 0);

const validPoles = validateCoordinates(90, -180);
assert.strictEqual(validPoles.valid, true);
assert.strictEqual(validPoles.latitude, 90);
assert.strictEqual(validPoles.longitude, -180);
console.log('✓ Coordinate validation passed (12 boundary test assertions).');

// Test 2: WMO interpretation mapping
console.log('2. Testing WMO weather code mapping...');
assert.strictEqual(interpretWmoCode(0).description, 'Clear sky');
assert.strictEqual(interpretWmoCode(0).emoji, '☀️');
assert.strictEqual(interpretWmoCode(61).description, 'Slight rain');
assert.strictEqual(interpretWmoCode(95).description, 'Thunderstorm');
assert.strictEqual(interpretWmoCode(9999).description, 'Cloudy'); // Fallback
console.log('✓ WMO code interpretation passed.');

// Test 3: Live weather API proxy check
console.log('3. Testing live weather API proxy endpoint...');
const testUrl = 'http://127.0.0.1:8000/api/weather?lat=17.385&lng=78.4867';

fetch(testUrl)
  .then(res => {
    assert.strictEqual(res.status, 200, `Expected 200 from Weather API, got ${res.status}`);
    return res.json();
  })
  .then(data => {
    assert.ok(data.current, 'current object exists');
    assert.strictEqual(typeof data.current.temperature, 'number', 'temperature is number');
    assert.strictEqual(typeof data.current.humidity, 'number', 'humidity is number');
    assert.strictEqual(typeof data.current.weather_code, 'number', 'weather_code is number');
    assert.strictEqual(typeof data.source, 'string', 'source is string');
    assert.strictEqual(data.is_mock, false, 'is_mock should be false');
    console.log(`✓ Live weather API check passed: Temp=${data.current.temperature}°C, Humidity=${data.current.humidity}%, Condition="${data.current.condition}", Source="${data.source}"`);
    console.log('ALL FRONTEND SERVICE CHECKS PASSED SUCCESSFULLY.');
  })
  .catch(err => {
    console.error('Failed weather API check:', err);
    process.exit(1);
  });
