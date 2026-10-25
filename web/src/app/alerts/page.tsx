'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertCard, LanguageSelector } from '@/components/ui';
import { mockAlerts } from '@/lib/mock-data';
import { useI18n } from '@/lib/i18n-context';

export default function AlertsPage() {
  const { t, speak } = useI18n();
  const [filter, setFilter] = useState<'active' | 'upcoming' | 'history'>('active');

  const activeAlerts = mockAlerts.filter(a => a.isActive);
  const pastAlerts = mockAlerts.filter(a => !a.isActive);

  const handleSpeak = (text: string) => {
    speak(text);
  };

  const filterTabs = [
    { key: 'active' as const, label: t('alerts.active') },
    { key: 'upcoming' as const, label: t('alerts.upcoming') },
    { key: 'history' as const, label: t('alerts.history') },
  ];

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">←</Link>
            <h1 className="font-bold text-ink font-display">{t('alerts.title')}</h1>
          </div>
          <LanguageSelector variant="dropdown" className="text-xs" />
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Filter tabs */}
        <div className="inline-flex bg-sand-100 rounded-full p-1 w-full">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all capitalize ${
                filter === tab.key ? 'bg-white text-teal shadow-soft' : 'text-ink-400'
              }`}
            >
              {tab.label}
              {tab.key === 'active' && activeAlerts.length > 0 && (
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
                <p className="text-ink-400 font-medium">{t('alerts.noActiveAlerts')}</p>
                <p className="text-xs text-ink-300 mt-1">{t('alerts.staySafe')}</p>
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
            <p className="text-ink-400 font-medium">{t('alerts.noUpcomingAlerts')}</p>
            <p className="text-xs text-ink-300 mt-1">{t('alerts.forecastMonitoring')}</p>
          </div>
        )}

        {filter === 'history' && (
          <div className="space-y-3">
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">📚</span>
              <p className="text-ink-400 font-medium">{t('alerts.pastAlertsNotice')}</p>
              <p className="text-xs text-ink-300 mt-1">{t('alerts.history')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sand-200 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { href: '/dashboard', icon: '🏠', label: t('dashboard.title'), active: false },
            { href: '/map', icon: '🗺️', label: t('nav.map'), active: false },
            { href: '/alerts', icon: '🔔', label: t('nav.alerts'), active: true },
            { href: '/guide', icon: '📖', label: t('nav.guide'), active: false },
            { href: '/settings', icon: '👤', label: t('nav.settings'), active: false },
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
