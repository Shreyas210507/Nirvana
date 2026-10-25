'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ShieldCheck, UserCheck, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/ui';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const { login, isAuthenticated, user, error: authError, clearError } = useAuth();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If already authenticated, redirect
  useEffect(() => {
    if (isAuthenticated && user) {
      if (redirectPath) {
        router.push(redirectPath);
      } else if (user.role === 'municipal' || user.role === 'admin') {
        router.push('/dashboard/municipal');
      } else {
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, redirectPath, router]);

  // Demo credential autofillers
  const fillDemoMunicipal = () => {
    setEmail('municipal@ghmc.gov.in');
    setPassword('NirvanaCommand2026!');
    setLocalError(null);
    clearError();
  };

  const fillDemoCitizen = () => {
    setEmail('citizen@nirvana.in');
    setPassword('CitizenSafe2026!');
    setLocalError(null);
    clearError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Client validation
    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address (e.g. name@example.com).');
      return;
    }
    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const loggedUser = await login({
        email: email.trim(),
        password,
        remember_me: rememberMe,
      });

      setSuccessMessage(`Welcome back, ${loggedUser.full_name}! Redirecting...`);

      setTimeout(() => {
        if (redirectPath) {
          router.push(redirectPath);
        } else if (loggedUser.role === 'municipal' || loggedUser.role === 'admin') {
          router.push('/dashboard/municipal');
        } else {
          router.push('/dashboard');
        }
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed. Please verify your credentials.';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || authError;

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-between selection:bg-teal selection:text-white">
      {/* Top Advisory Banner */}
      <div className="bg-teal-50 border-b border-teal-100 px-4 py-2">
        <p className="text-center text-xs text-teal-800 font-medium max-w-4xl mx-auto flex items-center justify-center gap-1.5">
          <span className="text-teal-600 font-bold">ⓘ</span> {t('common.advisory')}
        </p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Brand & Title */}
          <div className="text-center">
            <div className="flex items-center justify-between mb-2">
              <Link href="/" className="inline-flex items-center gap-2.5 group">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow-teal group-hover:scale-105 transition-transform duration-200">
                  <span className="text-white text-xl">🏘️</span>
                </div>
                <span className="font-bold text-2xl text-ink font-display tracking-tight">Nirvana</span>
              </Link>
              <LanguageSelector variant="dropdown" className="text-xs" />
            </div>
            <h1 className="text-3xl font-extrabold text-ink font-display tracking-tight">
              {t('auth.signInTitle')}
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              {t('auth.signInSubtitle')}
            </p>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="bg-white rounded-2xl p-3.5 border border-sand-200 shadow-soft">
            <p className="text-[11px] font-bold text-ink-500 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <span>⚡</span> One-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillDemoMunicipal}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Fill GHMC Disaster Officer Credentials"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                <span>Municipal Officer</span>
              </button>
              <button
                type="button"
                onClick={fillDemoCitizen}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                title="Fill Malakpet Citizen Credentials"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-700" />
                <span>Citizen Resident</span>
              </button>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sand-200 shadow-soft-lg space-y-5">
            {/* Error Alert */}
            <AnimatePresence>
              {activeError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{activeError}</div>
                  <button
                    onClick={() => {
                      setLocalError(null);
                      clearError();
                    }}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-1"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Alert */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1 font-medium">{successMessage}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email-address"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                >
                  {t('auth.email')}
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@nirvana.in"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                />
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-500"
                  >
                    {t('auth.password')}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-teal hover:text-teal-700 transition-colors"
                  >
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Option */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-teal focus:ring-teal/30 border-sand-300 accent-teal"
                  />
                  <span className="text-xs text-ink-500 font-medium">{t('auth.rememberMe')}</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-sm shadow-glow-teal hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <>
                    <span>{t('auth.signInButton')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-ink-400">
                {t('auth.noAccount')}{' '}
                <Link
                  href="/register"
                  className="font-semibold text-teal hover:text-teal-700 transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </p>
            </div>
          </div>

          {/* Bottom helper */}
          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-ink-400 hover:text-ink-600 transition-colors inline-flex items-center gap-1"
            >
              ← Back to Nirvana homepage
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-sand-200 text-center text-xs text-ink-300">
        Nirvana Hyperlocal Climate Risk Advisory • End-to-End Encrypted Session
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
