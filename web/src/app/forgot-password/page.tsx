'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Mail, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { apiForgotPassword, ForgotPasswordResponse } from '@/lib/auth-api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!email.trim()) {
      setError('Please provide your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiForgotPassword(email.trim());
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request password reset.';
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
          <span className="text-teal-600 font-bold">ⓘ</span> Account Recovery. We will generate a secure one-time password reset token for your account.
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
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-ink font-display tracking-tight">
              Reset Your Password
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              Enter your registered email address and we will provide you with a secure recovery link.
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

            {/* Success state */}
            {result ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Password Reset Initiated</span>
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {result.message}
                  </p>
                </div>

                {/* Instant Dev Reset Helper */}
                {result.dev_reset_token && (
                  <div className="rounded-2xl bg-teal-50 border border-teal-200 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                        ⚡ Instant Verification Mode
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-teal-200/60 rounded-full text-teal-900 font-semibold">
                        Dev / Demo
                      </span>
                    </div>
                    <p className="text-xs text-teal-800">
                      A reset token was successfully generated. Click below to test password reset immediately:
                    </p>
                    <Link
                      href={`/reset-password?token=${result.dev_reset_token}`}
                      className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-teal text-white font-semibold text-xs hover:bg-teal-700 shadow-glow-teal transition-all"
                    >
                      <span>Proceed to Reset Password Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-teal-700 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Sign In</span>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1.5"
                  >
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="reset-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. citizen@nirvana.in"
                      className="w-full px-4 py-2.5 pl-10 rounded-xl border border-sand-200 bg-cream-50 text-ink text-sm placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-all"
                    />
                    <Mail className="w-4 h-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-semibold text-sm shadow-glow-teal hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Reset Token...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Instructions</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-600 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </Link>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-sand-200 text-center text-xs text-ink-300">
        Nirvana Hyperlocal Climate Risk Advisory • Secure Tokenized Password Reset
      </footer>
    </div>
  );
}
