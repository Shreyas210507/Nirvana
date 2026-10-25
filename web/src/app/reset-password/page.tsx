'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Check, X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { apiResetPassword } from '@/lib/auth-api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
    }
  }, [initialToken]);

  // Password rules
  const passwordRules = useMemo(() => {
    return [
      { id: 'length', label: 'At least 8 characters', valid: newPassword.length >= 8 },
      { id: 'uppercase', label: 'One uppercase letter (A-Z)', valid: /[A-Z]/.test(newPassword) },
      { id: 'lowercase', label: 'One lowercase letter (a-z)', valid: /[a-z]/.test(newPassword) },
      { id: 'number', label: 'One number (0-9)', valid: /\d/.test(newPassword) },
      { id: 'special', label: 'One special character (!@#$%^&* etc.)', valid: /[!@#$%^&*(),.?":{}|<>\-_~`+=]/.test(newPassword) },
    ];
  }, [newPassword]);

  const strengthScore = useMemo(() => {
    return passwordRules.filter((r) => r.valid).length;
  }, [passwordRules]);

  const strengthColor = useMemo(() => {
    if (strengthScore <= 1) return 'bg-rose-500';
    if (strengthScore <= 3) return 'bg-amber-500';
    if (strengthScore === 4) return 'bg-teal-500';
    return 'bg-emerald-500';
  }, [strengthScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Password reset token is missing or invalid.');
      return;
    }
    if (strengthScore < 5) {
      setError('Please satisfy all password security requirements.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiResetPassword({
        token: token.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset password. Link may have expired.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-between selection:bg-teal selection:text-white">
      {/* Top Banner */}
      <div className="bg-teal-50 border-b border-teal-100 px-4 py-2">
        <p className="text-center text-xs text-teal-800 font-medium max-w-4xl mx-auto flex items-center justify-center gap-1.5">
          <span className="text-teal-600 font-bold">ⓘ</span> Nirvana Password Update. Your new password will be hashed with bcrypt (cost factor 12).
        </p>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-glow-teal group-hover:scale-105 transition-transform duration-200">
                <span className="text-white text-xl">🏘️</span>
              </div>
              <span className="font-bold text-2xl text-ink font-display tracking-tight">Nirvana</span>
            </Link>
            <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink font-display tracking-tight">
              Create New Password
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              Please enter and confirm your new secure password.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-sand-200 shadow-soft-lg space-y-5">
            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">{error}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success message */}
            {success ? (
              <div className="space-y-4 text-center py-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-ink">Password Updated!</h3>
                  <p className="text-xs text-ink-400 mt-1">
                    Your password has been securely reset. Redirecting you to the sign-in page...
                  </p>
                </div>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal text-white font-semibold text-xs hover:bg-teal-700 shadow-glow-teal transition-all"
                >
                  <span>Sign In Immediately</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Token input (if not in url) */}
                {!initialToken && (
                  <div>
                    <label
                      htmlFor="reset-token"
                      className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                    >
                      Security Reset Token
                    </label>
                    <input
                      id="reset-token"
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="Paste recovery token"
                      className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm font-mono placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    />
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label
                    htmlFor="new-pwd"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-pwd"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
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

                  {/* Password rules meter */}
                  {newPassword.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      <div className="w-full h-1.5 bg-sand-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strengthColor}`}
                          style={{ width: `${(strengthScore / 5) * 100}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
                        {passwordRules.map((r) => (
                          <div
                            key={r.id}
                            className={`flex items-center gap-1.5 text-[11px] ${
                              r.valid ? 'text-emerald-700 font-medium' : 'text-ink-400'
                            }`}
                          >
                            {r.valid ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-sand-400 shrink-0" />
                            )}
                            <span>{r.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-new-pwd"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-new-pwd"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
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
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                      <span>⚠</span> Passwords do not match.
                    </p>
                  )}
                  {confirmPassword && newPassword === confirmPassword && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <span>✓</span> Passwords match.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-sm shadow-glow-teal hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <span>Save New Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
                  >
                    Cancel and return to Sign In
                  </Link>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-sand-200 text-center text-xs text-ink-300">
        Nirvana Hyperlocal Climate Risk Advisory • Secure Session Invalidation on Reset
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
          <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordForm />
    </React.Suspense>
  );
}
