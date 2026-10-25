import { en, TranslationKeys } from './en';
import { hi } from './hi';
import { te } from './te';
import { ta } from './ta';
import { kn } from './kn';
import { ml } from './ml';
import { mr } from './mr';
import { bn } from './bn';
import { gu } from './gu';
import { or } from './or';
import { pa } from './pa';
import { ur } from './ur';
import { SupportedLanguage } from '@/lib/types';

export { en, hi, te, ta, kn, ml, mr, bn, gu, or, pa, ur };
export type { TranslationKeys };

export const translations: Record<SupportedLanguage, TranslationKeys> = {
  en,
  hi,
  te,
  ta,
  kn,
  ml,
  mr,
  bn,
  gu,
  or,
  pa,
  ur,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  'en', 'hi', 'te', 'ta', 'kn', 'ml', 'mr', 'bn', 'gu', 'or', 'pa', 'ur'
];

/**
 * Resolve a dot-notated key (e.g. 'common.loading', 'landing.heroTitle')
 * from the dictionary for the specified locale, falling back safely to English.
 */
export function getTranslation(
  locale: SupportedLanguage,
  key: string,
  params?: Record<string, string | number>
): string {
  const currentDict = translations[locale] || translations[DEFAULT_LANGUAGE];
  const fallbackDict = translations[DEFAULT_LANGUAGE];

  const value = resolveKey(currentDict, key) ?? resolveKey(fallbackDict, key) ?? key;

  if (typeof value !== 'string') {
    return key;
  }

  if (!params) {
    return value;
  }

  // Handle interpolation {param} and {{param}}
  return value.replace(/\{\{?(\w+)\}?\}/g, (match, paramName) => {
    return paramName in params ? String(params[paramName]) : match;
  });
}

function resolveKey(obj: any, keyPath: string): string | undefined {
  if (!obj || typeof obj !== 'object') return undefined;

  // Direct match if key contains dot in dictionary
  if (keyPath in obj && typeof obj[keyPath] === 'string') {
    return obj[keyPath];
  }

  const parts = keyPath.split('.');
  let current: any = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}
