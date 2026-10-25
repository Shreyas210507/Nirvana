'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { SupportedLanguage, LanguageOption } from './types';
import { languages as allLanguages } from './mock-data';
import {
  translations,
  getTranslation,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
} from '@/locales';
import { useAuth } from './auth-context';

export const LANGUAGE_STORAGE_KEY = 'nirvana_language_preference';
export const LOCALE_COOKIE_KEY = 'nirvana_locale';

// Map supported codes to standard BCP-47 locale tags
export const BCP47_TAGS: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  or: 'or-IN',
  pa: 'pa-IN',
  ur: 'ur-IN',
};

// WMO code mapping to translation keys
const WMO_KEY_MAP: Record<number, { key: string; emoji: string }> = {
  0: { key: 'weather.clearSky', emoji: '☀️' },
  1: { key: 'weather.mainlyClear', emoji: '🌤️' },
  2: { key: 'weather.partlyCloudy', emoji: '⛅' },
  3: { key: 'weather.overcast', emoji: '☁️' },
  45: { key: 'weather.fog', emoji: '🌫️' },
  48: { key: 'weather.rimeFog', emoji: '🌫️' },
  51: { key: 'weather.lightDrizzle', emoji: '🌦️' },
  53: { key: 'weather.moderateDrizzle', emoji: '🌦️' },
  55: { key: 'weather.denseDrizzle', emoji: '🌧️' },
  56: { key: 'weather.freezingDrizzle', emoji: '🌨️' },
  57: { key: 'weather.denseFreezingDrizzle', emoji: '🌨️' },
  61: { key: 'weather.slightRain', emoji: '🌧️' },
  62: { key: 'weather.moderateRain', emoji: '🌧️' },
  63: { key: 'weather.moderateRain', emoji: '🌧️' },
  65: { key: 'weather.heavyRain', emoji: '⛈️' },
  66: { key: 'weather.lightFreezingRain', emoji: '🌨️' },
  67: { key: 'weather.heavyFreezingRain', emoji: '🌨️' },
  71: { key: 'weather.slightSnow', emoji: '❄️' },
  73: { key: 'weather.moderateSnow', emoji: '❄️' },
  75: { key: 'weather.heavySnow', emoji: '❄️' },
  77: { key: 'weather.snowGrains', emoji: '❄️' },
  80: { key: 'weather.slightRainShowers', emoji: '🌦️' },
  81: { key: 'weather.moderateRainShowers', emoji: '🌧️' },
  82: { key: 'weather.violentRainShowers', emoji: '⛈️' },
  85: { key: 'weather.snowShowers', emoji: '🌨️' },
  86: { key: 'weather.heavySnowShowers', emoji: '🌨️' },
  95: { key: 'weather.thunderstorm', emoji: '⛈️' },
  96: { key: 'weather.thunderstormSlightHail', emoji: '⛈️' },
  99: { key: 'weather.thunderstormHeavyHail', emoji: '⛈️' },
};

interface I18nContextType {
  locale: SupportedLanguage;
  dir: 'ltr' | 'rtl';
  setLocale: (newLocale: SupportedLanguage) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatTime: (date: Date | string | number) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  tWeather: (code: number) => { description: string; emoji: string };
  speak: (text: string) => void;
  languages: LanguageOption[];
  currentLanguage: LanguageOption;
  isRtl: boolean;
  bcp47Tag: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Detect browser preferred language from navigator, matching supported languages.
 */
function detectBrowserLanguage(): SupportedLanguage | null {
  if (typeof window === 'undefined' || !navigator) return null;

  const candidates = navigator.languages ? [...navigator.languages] : [navigator.language];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const clean = candidate.toLowerCase().split('-')[0] as SupportedLanguage;
    if (SUPPORTED_LANGUAGES.includes(clean)) {
      return clean;
    }
  }
  return null;
}

/**
 * Apply DOM document attributes for accessibility (lang and text direction).
 */
function applyDomLocale(lang: SupportedLanguage) {
  if (typeof document === 'undefined') return;
  const isRtl = lang === 'ur';
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';

  // Apply cookie for SSR consistency
  document.cookie = `${LOCALE_COOKIE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const { user, updateProfile, isAuthenticated } = useAuth();

  // Initial state resolution based on precedence order
  const [locale, setLocaleState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;
      if (stored && SUPPORTED_LANGUAGES.includes(stored)) {
        return stored;
      }
      const browser = detectBrowserLanguage();
      if (browser) return browser;
    }
    return DEFAULT_LANGUAGE;
  });

  // Track if user explicitly changed language during current session to avoid unexpected overrides
  const [userExplicitlySelected, setUserExplicitlySelected] = useState<boolean>(false);

  // Synchronize authenticated user profile preference
  useEffect(() => {
    if (user?.language && SUPPORTED_LANGUAGES.includes(user.language as SupportedLanguage)) {
      const userLang = user.language as SupportedLanguage;
      // If user hasn't explicitly changed it in this session and stored differs, adopt account preference
      if (!userExplicitlySelected && locale !== userLang) {
        setLocaleState(userLang);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, userLang);
        }
        applyDomLocale(userLang);
      }
    }
  }, [user?.language, userExplicitlySelected, locale]);

  // Initial DOM application on mount
  useEffect(() => {
    applyDomLocale(locale);
  }, [locale]);

  // Cross-tab synchronization via storage event
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && e.newValue) {
        const newLang = e.newValue as SupportedLanguage;
        if (SUPPORTED_LANGUAGES.includes(newLang) && newLang !== locale) {
          setLocaleState(newLang);
          applyDomLocale(newLang);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [locale]);

  // Set locale handler with persistence
  const setLocale = useCallback(
    async (newLocale: SupportedLanguage) => {
      if (!SUPPORTED_LANGUAGES.includes(newLocale)) return;

      setUserExplicitlySelected(true);
      setLocaleState(newLocale);
      applyDomLocale(newLocale);

      if (typeof window !== 'undefined') {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, newLocale);
      }

      // If user is authenticated, persist to user profile / backend
      if (isAuthenticated && user) {
        try {
          await updateProfile({ language: newLocale });
        } catch (err) {
          console.warn('Failed to persist language preference to backend profile:', err);
        }
      }
    },
    [isAuthenticated, user, updateProfile]
  );

  // Translation helper
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return getTranslation(locale, key, params);
    },
    [locale]
  );

  const bcp47Tag = useMemo(() => BCP47_TAGS[locale] || 'en-IN', [locale]);

  // Formatting helpers
  const formatDate = useCallback(
    (date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(bcp47Tag, options || {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(d);
      } catch {
        return String(date);
      }
    },
    [bcp47Tag]
  );

  const formatTime = useCallback(
    (date: Date | string | number): string => {
      try {
        const d = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat(bcp47Tag, {
          hour: '2-digit',
          minute: '2-digit',
        }).format(d);
      } catch {
        return String(date);
      }
    },
    [bcp47Tag]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      try {
        return new Intl.NumberFormat(bcp47Tag, options).format(value);
      } catch {
        return String(value);
      }
    },
    [bcp47Tag]
  );

  // Weather description localization
  const tWeather = useCallback(
    (code: number): { description: string; emoji: string } => {
      const entry = WMO_KEY_MAP[code] || { key: 'weather.partlyCloudy', emoji: '☁️' };
      const description = t(entry.key);
      return { description, emoji: entry.emoji };
    },
    [t]
  );

  // Text to speech helper
  const speak = useCallback(
    (text: string) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = bcp47Tag;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    },
    [bcp47Tag]
  );

  const currentLanguage = useMemo(() => {
    return (
      allLanguages.find((l) => l.code === locale) || {
        code: 'en' as SupportedLanguage,
        name: 'English',
        nativeName: 'English',
        script: 'Latin',
        rtl: false,
        fontFamily: 'Inter',
      }
    );
  }, [locale]);

  const isRtl = locale === 'ur';
  const dir: 'ltr' | 'rtl' = isRtl ? 'rtl' : 'ltr';

  const contextValue = useMemo<I18nContextType>(
    () => ({
      locale,
      dir,
      setLocale,
      t,
      formatDate,
      formatTime,
      formatNumber,
      tWeather,
      speak,
      languages: allLanguages,
      currentLanguage,
      isRtl,
      bcp47Tag,
    }),
    [
      locale,
      dir,
      setLocale,
      t,
      formatDate,
      formatTime,
      formatNumber,
      tWeather,
      speak,
      currentLanguage,
      isRtl,
      bcp47Tag,
    ]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

// Convenient aliases
export const useTranslation = useI18n;
export const useLanguage = useI18n;
