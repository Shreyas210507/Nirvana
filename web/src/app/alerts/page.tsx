'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCard } from '@/components/ui';
import { mockAlerts } from '@/lib/mock-data';

export default function AlertsPage() {
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'history'>('active');

  const activeAlerts = mockAlerts.filter(a => a.isActive);
  const pastAlerts = mockAlerts.filter(a => !a.isActive);

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN'; u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">←</Link>
          <h1 className="font-bold text-ink font-display">Alerts</h1>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="inline-flex bg-sand-100 rounded-full p-1 w-full">
          {(['active', 'upcoming', 'history'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                filter === f ? 'bg-white text-teal shadow-soft' : 'text-ink-400'
              }`}
            >
              {f}
              {f === 'active' && activeAlerts.length > 0 && (
                <span className="ml-1.5 w-5 h-5 inline-flex items-center justify-center rounded-full bg-risk-severe/10 text-risk-severe text-[10px] font-bold">
                  {activeAlerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Alert List */}
        {filter === 'active' && (
          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-12">
                <span className="text-4xl block mb-3">✅</span>
                <p className="text-ink-400 font-medium">No active alerts for your area</p>
                <p className="text-xs text-ink-300 mt-1">Stay safe and check back later</p>
              </div>
            ) : (
              activeAlerts.map(alert => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onListen={() => handleSpeak(alert.message)}
                  onShare={() => {
                    if (navigator.share) {
                      navigator.share({ title: alert.title, text: alert.message });
                    }
                  }}
                />
              ))
            )}
          </div>
        )}

        {filter === 'upcoming' && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">🔮</span>
            <p className="text-ink-400 font-medium">No upcoming alerts</p>
            <p className="text-xs text-ink-300 mt-1">Forecasts are being monitored continuously</p>
          </div>
        )}

        {filter === 'history' && (
          <div className="space-y-3">
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">📚</span>
              <p className="text-ink-400 font-medium">Past alerts will appear here</p>
              <p className="text-xs text-ink-300 mt-1">Review previous alerts and warnings</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sand-200 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { href: '/dashboard', icon: '🏠', label: 'Home', active: false },
            { href: '/map', icon: '🗺️', label: 'Map', active: false },
            { href: '/alerts', icon: '🔔', label: 'Alerts', active: true },
            { href: '/guide', icon: '📖', label: 'Guide', active: false },
            { href: '/settings', icon: '👤', label: 'Profile', active: false },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${item.active ? 'text-teal' : 'text-ink-400'}`}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
