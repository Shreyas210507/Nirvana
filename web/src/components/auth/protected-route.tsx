'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'municipal' | 'admin' | 'citizen';
  fallbackTitle?: string;
  fallbackMessage?: string;
}

export function ProtectedRoute({
  children,
  requiredRole,
  fallbackTitle,
  fallbackMessage,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-8 border border-sand-200 shadow-soft max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto animate-pulse">
            <span className="text-2xl">🔒</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-sand-200 rounded-full w-3/4 mx-auto animate-pulse" />
            <div className="h-3 bg-sand-100 rounded-full w-1/2 mx-auto animate-pulse" />
          </div>
          <p className="text-xs text-ink-400">Verifying security credentials...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 border border-sand-200 shadow-soft-lg max-w-md w-full text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center mx-auto shadow-glow-teal text-white text-2xl">
            🔒
          </div>
          <div>
            <h2 className="text-2xl font-bold text-ink font-display">
              {fallbackTitle || 'Authentication Required'}
            </h2>
            <p className="text-sm text-ink-400 mt-2 leading-relaxed">
              {fallbackMessage ||
                'This section requires you to sign in with your Nirvana account to view protected resources and operational tools.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors shadow-glow-teal"
            >
              Sign In to Continue
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-sand-100 text-ink font-medium text-sm hover:bg-sand-200 transition-colors"
            >
              Create Account
            </Link>
          </div>

          <div className="pt-3 border-t border-sand-200">
            <Link href="/" className="text-xs text-ink-400 hover:text-teal transition-colors">
              ← Return to Public Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Role check if specified
  if (requiredRole === 'municipal' && user.role !== 'municipal' && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 border border-amber-200 shadow-soft-lg max-w-md w-full text-center space-y-5"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center mx-auto text-3xl">
            🛡️
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Restricted Area
            </span>
            <h2 className="text-2xl font-bold text-ink font-display mt-3">
              Municipal Authorization Required
            </h2>
            <p className="text-sm text-ink-400 mt-2 leading-relaxed">
              You are signed in as <strong className="text-ink">{user.full_name}</strong> ({user.email}) with the <span className="font-semibold text-teal capitalize">{user.role}</span> role. The Command Dashboard is reserved for GHMC officers and disaster responders.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-600 transition-colors shadow-glow-teal"
            >
              Sign In with Municipal Credentials
            </Link>
            <Link
              href="/dashboard"
              className="px-5 py-2.5 rounded-xl bg-sand-100 text-ink font-medium text-sm hover:bg-sand-200 transition-colors"
            >
              Go to Citizen Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
