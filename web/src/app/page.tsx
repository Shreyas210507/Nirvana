'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLocation } from '@/lib/location-context';
import { searchLocations } from '@/lib/location-service';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/ui';
import { LogOut, User as UserIcon, Shield, LogIn, ChevronDown } from 'lucide-react';

// ============================================================================
// RAIN PARTICLE EFFECT
// ============================================================================
function RainParticles() {
  const positions = [5, 12, 23, 31, 38, 44, 52, 57, 63, 71, 76, 82, 88, 93, 15, 27, 49, 66, 79, 95];
  const delays = [0.1, 0.4, 0.8, 1.2, 0.3, 0.7, 1.5, 0.2, 0.9, 1.1, 0.5, 1.3, 0.6, 1.4, 0.0, 1.6, 0.85, 1.7, 0.35, 1.9];
  const durations = [1.2, 1.5, 1.8, 1.1, 1.6, 1.3, 1.9, 1.4, 1.7, 1.0, 1.55, 1.25, 1.85, 1.35, 1.65, 1.45, 1.75, 1.15, 1.95, 1.05];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {positions.map((pos, i) => (
        <div
          key={i}
          className="rain-particle"
          style={{
            left: `${pos}%`,
            animationDelay: `${delays[i]}s`,
            animationDuration: `${durations[i]}s`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// ANIMATED COUNTER
// ============================================================================
function AnimatedCounter({ value, suffix = '', duration = 2000 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value, duration]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ============================================================================
// FEATURE CARD
// ============================================================================
function FeatureCard({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="group bg-white rounded-3xl p-6 border border-sand-200 shadow-soft hover:shadow-card-hover hover:-translate-y-1.5 transition-all duration-400 cursor-default"
    >
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-ink mb-2 font-display">{title}</h3>
      <p className="text-sm text-ink-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ============================================================================
// HOW IT WORKS STEP
// ============================================================================
function HowItWorksStep({ number, title, description, icon, delay }: { number: number; title: string; description: string; icon: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="flex items-start gap-4"
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center text-white font-bold text-lg font-display shadow-glow-teal">
          {number}
        </div>
        {number < 4 && <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-10 bg-gradient-to-b from-teal/30 to-transparent" />}
      </div>
      <div className="pt-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xl">{icon}</span>
          <h4 className="font-semibold text-ink">{title}</h4>
        </div>
        <p className="text-sm text-ink-400 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// ============================================================================
// PERSONA CARD
// ============================================================================
function PersonaCard({ emoji, title, description, color, delay }: { emoji: string; title: string; description: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-white rounded-2xl p-5 border border-sand-200 shadow-soft hover:shadow-soft-md transition-all duration-300 text-center"
    >
      <div className="text-4xl mb-3">{emoji}</div>
      <h4 className="font-semibold text-ink mb-1" style={{ color }}>{title}</h4>
      <p className="text-xs text-ink-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ============================================================================
// MAIN LANDING PAGE
// ============================================================================
export default function LandingPage() {
  const { user, isAuthenticated, logout, isMunicipal } = useAuth();
  const router = useRouter();
  const { requestDeviceLocation, isLocating } = useLocation();
  const { t, locale, setLocale, languages } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleUseLocation = async () => {
    setGeoError(null);
    try {
      const loc = await requestDeviceLocation();
      const params = new URLSearchParams({
        lat: loc.latitude.toString(),
        lng: loc.longitude.toString(),
        name: loc.name,
      });
      if (loc.wardId) params.set('ward', loc.wardId);
      router.push(`/dashboard?${params.toString()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to retrieve device location.';
      setGeoError(msg);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setGeoError(null);
    try {
      const results = await searchLocations(query);
      if (results && results.length > 0) {
        const top = results[0];
        const params = new URLSearchParams({
          lat: top.latitude.toString(),
          lng: top.longitude.toString(),
          name: top.name,
        });
        if (top.wardId) params.set('ward', top.wardId);
        router.push(`/dashboard?${params.toString()}`);
      } else {
        router.push(`/dashboard?area=${encodeURIComponent(query)}`);
      }
    } catch {
      router.push(`/dashboard?area=${encodeURIComponent(query)}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Advisory Banner */}
      <div className="bg-teal-50 border-b border-teal-100 px-4 py-2">
        <p className="text-center text-xs text-teal-800 font-medium max-w-4xl mx-auto flex items-center justify-center gap-1.5">
          <span className="text-teal-600 font-bold">ⓘ</span> {t('common.advisory')}
        </p>
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-sand-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow-teal">
                <span className="text-white text-lg">🏘️</span>
              </div>
              <span className="font-bold text-xl text-ink font-display tracking-tight">Nirvana</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-ink-500 hover:text-teal-600 transition-colors animated-underline">{t('nav.features')}</a>
              <a href="#how-it-works" className="text-sm font-medium text-ink-500 hover:text-teal-600 transition-colors animated-underline">{t('nav.howItWorks')}</a>
              <a href="#personas" className="text-sm font-medium text-ink-500 hover:text-teal-600 transition-colors animated-underline">{t('nav.whoItsFor')}</a>
              <a href="#data" className="text-sm font-medium text-ink-500 hover:text-teal-600 transition-colors animated-underline">{t('nav.dataSources')}</a>
              <Link
                href="/dashboard/municipal"
                className="text-sm font-medium text-ink-500 hover:text-teal-600 transition-colors animated-underline"
              >
                {t('nav.municipalPortal')}
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <LanguageSelector variant="dropdown" className="text-xs sm:text-sm" />

              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-sand-200 text-xs font-semibold text-ink hover:bg-cream-50 transition-all shadow-xs"
                  >
                    <div className="w-6 h-6 rounded-lg bg-teal text-white flex items-center justify-center font-bold text-[11px]">
                      {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="max-w-[110px] truncate hidden sm:inline">{user.full_name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal/10 text-teal capitalize">
                      {user.role}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white border border-sand-200 shadow-soft-lg py-1.5 z-50">
                      <div className="px-3 py-2 border-b border-sand-100">
                        <p className="text-xs font-bold text-ink truncate">{user.full_name}</p>
                        <p className="text-[11px] text-ink-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={isMunicipal ? '/dashboard/municipal' : '/dashboard'}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-cream-100 font-medium"
                      >
                        {isMunicipal ? <Shield className="w-3.5 h-3.5 text-amber-600" /> : <UserIcon className="w-3.5 h-3.5 text-teal" />}
                        <span>{isMunicipal ? t('nav.municipalPortal') : t('nav.citizenDashboard')}</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-ink hover:bg-cream-100 font-medium"
                      >
                        <span>⚙️ {t('nav.settings')}</span>
                      </Link>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium border-t border-sand-100"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t('nav.signOut')}</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-sand-200 bg-white hover:bg-cream-50 text-xs font-semibold text-ink transition-colors shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5 text-teal" />
                    <span>{t('nav.signIn')}</span>
                  </Link>
                  <Link
                    href="/register"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-glow-teal"
                  >
                    <span>{t('nav.register')}</span>
                  </Link>
                </div>
              )}

              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 text-white text-sm font-semibold hover:from-teal-700 hover:to-teal-600 transition-all duration-200 shadow-glow-teal hover:shadow-lg"
              >
                {t('landing.ctaButton')} →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* HERO */}
      {/* ============================================================ */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28">
        <RainParticles />
        
        {/* Modern Atmosphere & Aurora Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-100/30 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-saffron-200/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-risk-severe/10 text-risk-severe border border-risk-severe/20 text-sm font-semibold mb-6 severe-breathing">
                <span className="w-2 h-2 rounded-full bg-risk-severe animate-pulse" />
                <span>3 {t('landing.statsHighRiskWards')}</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.7 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-ink leading-tight mb-6 font-display tracking-tight"
            >
              {t('landing.heroTitle')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg text-ink-500 mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              {t('landing.heroSubtitle')}
            </motion.p>

            {/* Search / Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="max-w-lg mx-auto mb-8"
            >
              <form onSubmit={handleSearch} className="relative">
                <div className="flex bg-white rounded-2xl border border-sand-200 shadow-soft-md overflow-hidden focus-within:ring-2 focus-within:ring-teal-500/20 focus-within:border-teal-500 transition-all">
                  <div className="flex items-center pl-4">
                    <span className="text-ink-400">📍</span>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder={t('landing.searchPlaceholder')}
                    className="flex-1 px-3 py-4 bg-transparent text-ink placeholder:text-ink-400 focus:outline-none text-base"
                    id="hero-search"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-6 py-4 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-semibold hover:from-teal-700 hover:to-teal-600 transition-all text-sm shadow-sm disabled:opacity-75 flex items-center gap-1.5"
                  >
                    {isSearching ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('common.loading')}
                      </>
                    ) : (
                      t('common.search')
                    )}
                  </button>
                </div>
              </form>

              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={handleUseLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-2 text-sm text-teal-600 font-semibold hover:text-teal-700 transition-colors disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <span className="w-4 h-4 border-2 border-teal-500/30 border-t-teal-600 rounded-full animate-spin" />
                      {t('landing.locating')}
                    </>
                  ) : (
                    <>📱 {t('landing.useLocation')}</>
                  )}
                </button>
                <span className="text-sand-300">|</span>
                <Link href="/map" className="text-sm text-ink-500 hover:text-teal-600 transition-colors font-medium">
                  🗺️ {t('nav.map')}
                </Link>
              </div>

              {geoError && (
                <div className="mt-3 text-xs bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2 max-w-md mx-auto text-left shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">📍</span>
                    <span>{geoError}</span>
                  </div>
                  <button
                    onClick={() => setGeoError(null)}
                    className="text-amber-700 hover:text-amber-900 font-bold p-1 shrink-0"
                    title={t('common.dismiss')}
                  >
                    ✕
                  </button>
                </div>
              )}
            </motion.div>

            {/* Language chips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-2"
            >
              <span className="text-xs text-ink-400 font-medium shrink-0">{t('landing.availableIn')}</span>
              <LanguageSelector variant="chips" className="justify-center" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* LIVE STATS BAR */}
      {/* ============================================================ */}
      <section className="bg-white/90 backdrop-blur-md border-y border-sand-200 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-sand-200/80">
            <div className="pt-2 md:pt-0">
              <div className="text-3xl lg:text-4xl font-extrabold text-ink font-display">
                <AnimatedCounter value={22} />
              </div>
              <p className="text-sm font-medium text-ink-500 mt-1">{t('landing.statsWardsMonitored')}</p>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-3xl lg:text-4xl font-extrabold text-risk-severe font-display">
                <AnimatedCounter value={3} />
              </div>
              <p className="text-sm font-medium text-ink-500 mt-1">{t('landing.statsHighRiskWards')}</p>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-3xl lg:text-4xl font-extrabold text-teal-600 font-display">
                <AnimatedCounter value={10} />
              </div>
              <p className="text-sm font-medium text-ink-500 mt-1">{t('landing.statsOpenShelters')}</p>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-3xl lg:text-4xl font-extrabold text-saffron font-display">
                <AnimatedCounter value={285} suffix="K" />
              </div>
              <p className="text-sm font-medium text-ink-500 mt-1">{t('landing.liveSensorData')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES */}
      {/* ============================================================ */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">{t('nav.features')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-ink font-display mb-4 tracking-tight">
              {t('landing.featuresTitle')}
            </h2>
            <p className="text-ink-500 max-w-2xl mx-auto text-base">
              {t('landing.featuresSubtitle')}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🎯"
              title={t('landing.featureRiskTitle')}
              description={t('landing.featureRiskDesc')}
              delay={0}
            />
            <FeatureCard
              icon="🗣️"
              title={t('landing.featureI18nTitle')}
              description={t('landing.featureI18nDesc')}
              delay={0.1}
            />
            <FeatureCard
              icon="🛡️"
              title={t('landing.featureSheltersTitle')}
              description={t('landing.featureSheltersDesc')}
              delay={0.2}
            />
            <FeatureCard
              icon="👥"
              title={t('landing.featureCommunityTitle')}
              description={t('landing.featureCommunityDesc')}
              delay={0.3}
            />
            <FeatureCard
              icon="🏛️"
              title={t('nav.municipalPortal')}
              description={t('landing.step4Desc')}
              delay={0.4}
            />
            <FeatureCard
              icon="📊"
              title={t('landing.step2Title')}
              description={t('landing.step2Desc')}
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================================ */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-white border-y border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-saffron-50 border border-saffron-200 text-saffron-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">{t('nav.howItWorks')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-ink font-display mb-4">
              {t('landing.howItWorksTitle')}
            </h2>
            <p className="text-ink-500 max-w-2xl mx-auto text-base">
              {t('landing.howItWorksSubtitle')}
            </p>
          </motion.div>

          <div className="max-w-2xl mx-auto space-y-10">
            <HowItWorksStep
              number={1}
              icon="🛰️"
              title={t('landing.step1Title')}
              description={t('landing.step1Desc')}
              delay={0}
            />
            <HowItWorksStep
              number={2}
              icon="🧠"
              title={t('landing.step2Title')}
              description={t('landing.step2Desc')}
              delay={0.1}
            />
            <HowItWorksStep
              number={3}
              icon="📣"
              title={t('landing.step3Title')}
              description={t('landing.step3Desc')}
              delay={0.2}
            />
            <HowItWorksStep
              number={4}
              icon="🏃"
              title={t('landing.step4Title')}
              description={t('landing.step4Desc')}
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* PERSONAS */}
      {/* ============================================================ */}
      <section id="personas" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">{t('nav.whoItsFor')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-ink font-display mb-4">
              {t('landing.featuresSubtitle')}
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <PersonaCard emoji="👷" title="Daily-Wage Workers" description="Heat timing, shade locations, ORS stations, work-hour guidance" color="#D97706" delay={0} />
            <PersonaCard emoji="👵" title="Elderly Residents" description="Simple mode, voice alerts, caregiver notifications, large text" color="#0D9488" delay={0.1} />
            <PersonaCard emoji="🏠" title="Low-Lying Homes" description="Flood depth estimates, evacuation timing, valuables checklist" color="#F97316" delay={0.2} />
            <PersonaCard emoji="🏗️" title="Informal Settlements" description="Structural risk, nearest safe shelter, community group alerts" color="#EF4444" delay={0.3} />
            <PersonaCard emoji="🏛️" title="Municipal Teams" description="Ward dashboard, resource planning, alert dispatch, analytics" color="#10B981" delay={0.4} />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* DATA SOURCES */}
      {/* ============================================================ */}
      <section id="data" className="py-20 lg:py-28 bg-white border-y border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-block px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-xs">{t('nav.dataSources')}</span>
            <h2 className="text-3xl lg:text-4xl font-bold text-ink font-display mb-4">
              Open Data, Transparent Models
            </h2>
            <p className="text-ink-500 max-w-2xl mx-auto">
              Every risk score shows its data sources, freshness, and confidence level. No black boxes.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🌤️', name: 'Weather Forecast', source: 'Open-Meteo', freshness: 'Every 15 min', status: 'live' },
              { icon: '🏔️', name: 'Elevation & Terrain', source: 'SRTM / Copernicus', freshness: 'Static', status: 'live' },
              { icon: '🚰', name: 'Drainage Network', source: 'OSM + Municipal', freshness: 'Daily + Reports', status: 'live' },
              { icon: '🛰️', name: 'Land Cover / NDVI', source: 'Sentinel-2', freshness: 'Weekly', status: 'live' },
              { icon: '📊', name: 'Historical Floods', source: 'GHMC Records', freshness: 'Monthly', status: 'live' },
              { icon: '👥', name: 'Population Data', source: 'Census + Estimates', freshness: 'Yearly', status: 'live' },
              { icon: '🏥', name: 'Shelter Database', source: 'Municipal + Crowd', freshness: 'Verified weekly', status: 'live' },
              { icon: '📱', name: 'Community Reports', source: 'Citizen Submissions', freshness: 'Real-time', status: 'live' },
            ].map((ds, i) => (
              <motion.div
                key={ds.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-sand-200 shadow-soft hover:shadow-soft-md hover:border-teal-200 transition-all"
              >
                <span className="text-2xl">{ds.icon}</span>
                <div>
                  <h4 className="font-semibold text-sm text-ink">{ds.name}</h4>
                  <p className="text-xs text-ink-500">{ds.source}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-risk-low" />
                    <span className="text-xs text-risk-low font-medium">{ds.freshness}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA */}
      {/* ============================================================ */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-teal-700 via-teal-800 to-slate-900 rounded-3xl p-10 lg:p-14 text-white relative overflow-hidden shadow-soft-xl border border-teal-600/30"
          >
            <div className="absolute inset-0 opacity-10">
              <RainParticles />
            </div>
            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4 font-display">
                {t('landing.ctaTitle')}
              </h2>
              <p className="text-teal-100 mb-8 max-w-xl mx-auto">
                {t('landing.ctaSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-teal-700 font-bold text-lg hover:bg-teal-50 transition-all duration-200 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 group"
                >
                  {t('landing.ctaButton')}
                  <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                </Link>
                <Link
                  href="/dashboard/municipal"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/10 text-white border border-white/20 font-semibold hover:bg-white/20 transition-all duration-200"
                >
                  {t('nav.municipalPortal')}
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER */}
      {/* ============================================================ */}
      <footer className="bg-white border-t border-sand-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">🏘️</span>
                <span className="font-bold text-lg text-ink font-display">Nirvana</span>
              </div>
              <p className="text-sm text-ink-400 leading-relaxed">
                {t('common.tagline')}. Pilot: Hyderabad, Telangana.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-ink mb-3">{t('nav.citizenDashboard')}</h4>
              <div className="space-y-2">
                <Link href="/dashboard" className="block text-sm text-ink-400 hover:text-teal transition-colors">{t('dashboard.title')}</Link>
                <Link href="/map" className="block text-sm text-ink-400 hover:text-teal transition-colors">{t('nav.map')}</Link>
                <Link href="/shelters" className="block text-sm text-ink-400 hover:text-teal transition-colors">{t('nav.shelters')}</Link>
                <Link href="/guide" className="block text-sm text-ink-400 hover:text-teal transition-colors">{t('nav.guide')}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-ink mb-3">{t('guide.emergencyContacts')}</h4>
              <div className="space-y-2">
                <a href="tel:112" className="block text-sm text-ink-400 hover:text-teal transition-colors">📞 {t('common.emergencyHelpline')}</a>
                <a href="tel:1070" className="block text-sm text-ink-400 hover:text-teal transition-colors">🛡️ {t('common.disasterHelpline')}</a>
                <a href="tel:108" className="block text-sm text-ink-400 hover:text-teal transition-colors">🚑 Ambulance: 108</a>
                <a href="tel:040-21111111" className="block text-sm text-ink-400 hover:text-teal transition-colors">🏛️ GHMC: 040-21111111</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-ink mb-3">{t('nav.settings')}</h4>
              <div className="space-y-2">
                <Link href="/settings" className="block text-sm text-ink-400 hover:text-teal transition-colors">{t('settings.title')}</Link>
                <Link href="/report" className="block text-sm text-ink-400 hover:text-teal transition-colors">{t('nav.report')}</Link>
                <Link href="/dashboard/municipal" className="block text-sm text-ink-400 hover:text-teal transition-colors">{t('nav.municipalPortal')}</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-sand-200 mt-8 pt-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-xs text-ink-300">
                {t('landing.footerCopyright')} {t('common.advisory')}
              </p>
              <p className="text-xs text-ink-300 bg-saffron/10 px-3 py-1 rounded-full">
                ⚠️ All displayed data is synthetic/illustrative for demonstration purposes
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
