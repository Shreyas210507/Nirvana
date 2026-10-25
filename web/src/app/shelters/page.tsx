'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShelterCard, LanguageSelector } from '@/components/ui';
import { hyderabadShelters } from '@/lib/mock-data';
import { useI18n } from '@/lib/i18n-context';

export default function SheltersPage() {
  const { t } = useI18n();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filterType, setFilterType] = useState('all');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const shelterTypes = [
    { id: 'all', label: t('common.all') },
    { id: 'school', label: '🏫 Schools' },
    { id: 'community_hall', label: '🏛️ Halls' },
    { id: 'cooling_centre', label: '❄️ Cooling' },
    { id: 'relief_camp', label: '⛺ Relief' },
    { id: 'hospital', label: '🏥 Hospital' },
    { id: 'place_of_worship', label: '🕌 Worship' },
  ];

  const filteredShelters = hyderabadShelters
    .filter(s => filterType === 'all' || s.type === filterType)
    .filter(s => !showVerifiedOnly || s.verificationStatus.includes('verified'))
    .map((s, i) => ({
      ...s,
      distance: 500 + ((i * 397) % 3500),
      walkingTime: 5 + ((i * 7) % 25),
    }))
    .sort((a, b) => a.distance - b.distance);

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">←</Link>
            <h1 className="font-bold text-ink font-display">{t('shelters.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="dropdown" className="text-xs" />
            <div className="inline-flex bg-sand-100 rounded-full p-0.5">
              <button onClick={() => setView('list')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${view === 'list' ? 'bg-white text-teal shadow-soft' : 'text-ink-400'}`}>
                List
              </button>
              <button onClick={() => setView('map')} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${view === 'map' ? 'bg-white text-teal shadow-soft' : 'text-ink-400'}`}>
                Map
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {shelterTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterType === type.id ? 'bg-teal text-white' : 'bg-sand-100 text-ink-500 hover:bg-sand-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-500">
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={() => setShowVerifiedOnly(!showVerifiedOnly)}
            className="accent-teal"
          />
          {t('shelters.verifiedOnly')}
        </label>

        {/* Shelter List */}
        <div className="space-y-3">
          {filteredShelters.map((shelter, i) => (
            <motion.div
              key={shelter.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ShelterCard shelter={shelter} />
            </motion.div>
          ))}
        </div>

        {filteredShelters.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-ink-400 font-medium">{t('shelters.noSheltersFound')}</p>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sand-200 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { href: '/dashboard', icon: '🏠', label: t('dashboard.title'), active: false },
            { href: '/map', icon: '🗺️', label: t('nav.map'), active: false },
            { href: '/alerts', icon: '🔔', label: t('nav.alerts'), active: false },
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
