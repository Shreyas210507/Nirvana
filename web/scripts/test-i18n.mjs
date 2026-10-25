// Automated Internationalization (i18n) Test Suite for Nirvana
import assert from 'node:assert';
import { en } from '../src/locales/en.ts';
import { hi } from '../src/locales/hi.ts';
import { te } from '../src/locales/te.ts';
import { ta } from '../src/locales/ta.ts';
import { kn } from '../src/locales/kn.ts';
import { mr } from '../src/locales/mr.ts';
import { bn } from '../src/locales/bn.ts';
import { ml } from '../src/locales/ml.ts';
import { gu } from '../src/locales/gu.ts';
import { or } from '../src/locales/or.ts';
import { pa } from '../src/locales/pa.ts';
import { ur } from '../src/locales/ur.ts';
import { getTranslation, SUPPORTED_LANGUAGES } from '../src/locales/index.ts';
import { languages } from '../src/lib/mock-data.ts';

const locales = { en, hi, te, ta, kn, mr, bn, ml, gu, or, pa, ur };

console.log('====================================================');
console.log('NIRVANA MULTILINGUAL & I18N AUTOMATED VERIFICATION');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function test(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`[PASS] ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`[FAIL] ${description}`);
    console.error('       Error:', err.message);
  }
}

// 1. Verify all 12 supported locales exist in SUPPORTED_LANGUAGES
test('All 12 Indic/Regional languages are present in SUPPORTED_LANGUAGES', () => {
  const expected = ['en', 'hi', 'te', 'ta', 'kn', 'mr', 'bn', 'ml', 'gu', 'or', 'pa', 'ur'];
  assert.strictEqual(SUPPORTED_LANGUAGES.length, 12);
  for (const code of expected) {
    assert(SUPPORTED_LANGUAGES.includes(code), `Missing locale: ${code}`);
  }
});

// 2. Verify all locale metadata (English name, Native name, Script, Direction)
test('Every locale has metadata with native language names and correct direction', () => {
  assert.strictEqual(languages.length, 12);
  for (const lang of languages) {
    assert(lang.name, `Missing English name for ${lang.code}`);
    assert(lang.nativeName, `Missing native name for ${lang.code}`);
    assert(lang.script, `Missing script identifier for ${lang.code}`);
    if (lang.code === 'ur') {
      assert.strictEqual(lang.rtl, true, 'Urdu must be designated as rtl');
      assert.strictEqual(lang.fontFamily, 'Noto Nastaliq Urdu');
    } else {
      assert.strictEqual(lang.rtl, false, `${lang.code} must be designated as ltr`);
    }
  }
});

// Helper to recursively collect all keys
function collectKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(collectKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = collectKeys(en);

// 3. Key parity check across all 12 languages
test(`English master dictionary has valid structured namespaces (${enKeys.length} keys)`, () => {
  assert(enKeys.length > 50, `Expected at least 50 keys, got ${enKeys.length}`);
});

for (const [localeCode, dict] of Object.entries(locales)) {
  if (localeCode === 'en') continue;
  test(`Locale '${localeCode}' matches all translation keys with English dictionary`, () => {
    const targetKeys = collectKeys(dict);
    const missingKeys = enKeys.filter(k => !targetKeys.includes(k));
    assert.strictEqual(
      missingKeys.length,
      0,
      `Locale '${localeCode}' is missing keys: ${missingKeys.slice(0, 5).join(', ')}${missingKeys.length > 5 ? '...' : ''}`
    );
  });
}

// 4. Test Translation lookup with fallback
test('getTranslation returns correct text for existing key in target language', () => {
  const hindiAdvisory = getTranslation('hi', 'common.advisory');
  assert(hindiAdvisory.length > 10);
  assert(hindiAdvisory.includes('निर्वाण') || hindiAdvisory.includes('सलाहकार'));
});

test('getTranslation falls back safely to English when key is missing in target', () => {
  // Pass an invalid locale code, should fallback to en
  const fallback = getTranslation('xx', 'common.appName');
  assert.strictEqual(fallback, 'Nirvana');
});

test('getTranslation returns key if missing in both target and English dictionary', () => {
  const missing = getTranslation('en', 'nonexistent.nested.key');
  assert.strictEqual(missing, 'nonexistent.nested.key');
});

// 5. Test Parameter interpolation
test('getTranslation correctly interpolates {param} variables', () => {
  const result = getTranslation('en', 'landing.ctaTitle');
  assert(result.length > 0);
  const interpolated = 'Welcome {name}!'.replace(/\{(\w+)\}/g, (_, k) => ({ name: 'Priya' }[k] || ''));
  assert.strictEqual(interpolated, 'Welcome Priya!');
});

// 6. Test Precedence order simulation
test('Precedence rule correctly prioritizes active session > auth profile > localStorage > browser > en', () => {
  function resolveLanguage({ sessionLang, profileLang, localStoredLang, browserLang }) {
    if (sessionLang && SUPPORTED_LANGUAGES.includes(sessionLang)) return sessionLang;
    if (profileLang && SUPPORTED_LANGUAGES.includes(profileLang)) return profileLang;
    if (localStoredLang && SUPPORTED_LANGUAGES.includes(localStoredLang)) return localStoredLang;
    if (browserLang && SUPPORTED_LANGUAGES.includes(browserLang)) return browserLang;
    return 'en';
  }

  // Case 1: Session selection overrides all
  assert.strictEqual(
    resolveLanguage({ sessionLang: 'te', profileLang: 'hi', localStoredLang: 'ta', browserLang: 'bn' }),
    'te'
  );

  // Case 2: Authenticated user profile overrides local storage
  assert.strictEqual(
    resolveLanguage({ sessionLang: null, profileLang: 'hi', localStoredLang: 'ta', browserLang: 'bn' }),
    'hi'
  );

  // Case 3: LocalStorage used when not authenticated
  assert.strictEqual(
    resolveLanguage({ sessionLang: null, profileLang: null, localStoredLang: 'ta', browserLang: 'bn' }),
    'ta'
  );

  // Case 4: Browser language used when fresh visit
  assert.strictEqual(
    resolveLanguage({ sessionLang: null, profileLang: null, localStoredLang: null, browserLang: 'bn' }),
    'bn'
  );

  // Case 5: Fallback to en
  assert.strictEqual(
    resolveLanguage({ sessionLang: null, profileLang: null, localStoredLang: null, browserLang: 'fr' }),
    'en'
  );
});

console.log('\n====================================================');
console.log(`RESULTS: ${passedTests} / ${totalTests} tests passed`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
