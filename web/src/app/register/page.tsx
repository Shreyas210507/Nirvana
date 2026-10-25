'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, X, Shield, User, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useI18n } from '@/lib/i18n-context';
import { LanguageSelector } from '@/components/ui';
import { hyderabadWards } from '@/lib/mock-data';

export default function RegisterPage() {
  const router = useRouter();
  const { register, clearError, error: authError } = useAuth();
  const { t, locale } = useI18n();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'citizen' | 'municipal'>('citizen');
  const [wardId, setWardId] = useState('w-001');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength checklist rules
  const passwordRules = useMemo(() => {
    return [
      { id: 'length', label: 'At least 8 characters', valid: password.length >= 8 },
      { id: 'uppercase', label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(password) },
      { id: 'lowercase', label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(password) },
      { id: 'number', label: 'One number (0-9)', valid: /\d/.test(password) },
      { id: 'special', label: 'One special character (!@#$%^&* etc.)', valid: /[!@#$%^&*(),.?":{}|<>\-_~`+=]/.test(password) },
    ];
  }, [password]);

  const strengthScore = useMemo(() => {
    return passwordRules.filter((r) => r.valid).length;
  }, [passwordRules]);

  const strengthColor = useMemo(() => {
    if (strengthScore <= 1) return 'bg-rose-500';
    if (strengthScore <= 3) return 'bg-amber-500';
    if (strengthScore === 4) return 'bg-teal-500';
    return 'bg-emerald-500';
  }, [strengthScore]);

  const strengthLabel = useMemo(() => {
    if (password.length === 0) return '';
    if (strengthScore <= 1) return 'Weak';
    if (strengthScore <= 3) return 'Moderate';
    if (strengthScore === 4) return 'Good';
    return 'Very Strong';
  }, [password, strengthScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    // Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setLocalError('Please enter your full name (at least 2 characters).');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (strengthScore < 5) {
      setLocalError('Please meet all password strength security requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match. Please verify your confirmation password.');
      return;
    }
    if (!termsAgreed) {
      setLocalError('You must agree to the Terms of Service and Privacy Policy to proceed.');
      return;
    }

    setIsSubmitting(true);
    try {
      const createdUser = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        role,
        ward_id: wardId,
        password,
        confirm_password: confirmPassword,
        terms_agreed: termsAgreed,
        language: locale,
      });

      setSuccessMessage(`Account created successfully for ${createdUser.full_name}! Redirecting...`);
      setTimeout(() => {
        if (role === 'municipal') {
          router.push('/dashboard/municipal');
        } else {
          router.push('/dashboard');
        }
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg space-y-6"
        >
          {/* Header */}
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
              {t('auth.registerTitle')}
            </h1>
            <p className="mt-1 text-sm text-ink-400">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          {/* Form Card */}
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
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <div className="flex-1 font-medium">{successMessage}</div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection Tabs */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5">
                  Account Type
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-sand-100 rounded-2xl border border-sand-200">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      role === 'citizen'
                        ? 'bg-white text-teal shadow-soft'
                        : 'text-ink-400 hover:text-ink-600'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Citizen Resident</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('municipal')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                      role === 'municipal'
                        ? 'bg-white text-amber-700 shadow-soft'
                        : 'text-ink-400 hover:text-ink-600'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Municipal Responder</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="full-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                >
                  Full Name
                </label>
                <input
                  id="full-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                />
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="reg-email"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                />
              </div>

              {/* Ward and Phone row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Ward */}
                <div>
                  <label
                    htmlFor="ward"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                  >
                    Primary Ward / Area
                  </label>
                  <select
                    id="ward"
                    value={wardId}
                    onChange={(e) => setWardId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all font-medium"
                  >
                    {hyderabadWards.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.zone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                  >
                    Mobile Phone <span className="text-ink-300 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="reg-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
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

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-ink-400 font-medium">Password Strength:</span>
                      <span className="font-semibold text-ink">{strengthLabel}</span>
                    </div>
                    {/* Bar */}
                    <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${strengthColor}`}
                        style={{ width: `${(strengthScore / 5) * 100}%` }}
                      />
                    </div>
                    {/* Requirements Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {passwordRules.map((rule) => (
                        <div
                          key={rule.id}
                          className={`flex items-center gap-1.5 text-[11px] ${
                            rule.valid ? 'text-emerald-700 font-medium' : 'text-ink-400'
                          }`}
                        >
                          {rule.valid ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-sand-400 shrink-0" />
                          )}
                          <span>{rule.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-2.5 pr-11 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600 transition-colors p-1"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <span>⚠</span> Passwords do not match yet.
                  </p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <span>✓</span> Passwords match perfectly.
                  </p>
                )}
              </div>

              {/* Terms and Privacy Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    required
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="w-4 h-4 rounded text-teal focus:ring-teal/30 border-sand-300 accent-teal mt-0.5"
                  />
                  <span className="text-xs text-ink-500 leading-relaxed">
                    I agree to the{' '}
                    <span className="text-teal font-medium underline">Terms of Service</span> and{' '}
                    <span className="text-teal font-medium underline">Privacy Policy</span>. I acknowledge that Nirvana provides advisory warnings that complement official authority alerts.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-sm shadow-glow-teal hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Your Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Existing User Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-ink-400">
                Already have an account?{' '}
                <Link
                  href="/login"
                  className="font-semibold text-teal hover:text-teal-700 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Back link */}
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
        Nirvana Hyperlocal Climate Risk Advisory • Zero-Knowledge Passwords with bcrypt
      </footer>
    </div>
  );
}
