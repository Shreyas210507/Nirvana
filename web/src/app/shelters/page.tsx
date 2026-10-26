'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShelterCard, LanguageSelector } from '@/components/ui';
import { useI18n } from '@/lib/i18n-context';
import { useLocation } from '@/lib/location-context';
import { InteractiveMap } from '@/components/map/interactive-map';
import { computeNearbyShelters } from '@/lib/shelter-service';
import { LocationModal } from '@/components/ui/location-modal';
import { MapPin } from 'lucide-react';

export default function SheltersPage() {
  const { t } = useI18n();
  const { currentLocation } = useLocation();
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filterType, setFilterType] = useState('all');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const shelterTypes = [
    { id: 'all', label: t('common.all') },
    { id: 'school', label: '🏫 Schools' },
    { id: 'community_hall', label: '🏛️ Halls' },
    { id: 'cooling_centre', label: '❄️ Cooling' },
    { id: 'relief_camp', label: '⛺ Relief' },
    { id: 'hospital', label: '🏥 Hospital' },
    { id: 'place_of_worship', label: '🕌 Worship' },
  ];

  // Dynamically compute shelters relative to active location's coordinates
  const filteredShelters = useMemo(() => {
    if (!currentLocation) return [];
    return computeNearbyShelters(
      currentLocation.latitude,
      currentLocation.longitude,
      currentLocation.name,
      {
        filterType,
        verifiedOnly: showVerifiedOnly,
      }
    );
  }, [currentLocation, filterType, showVerifiedOnly]);

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors"
            >
              ←
            </Link>
            <h1 className="font-bold text-ink font-display">{t('shelters.title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector variant="dropdown" className="text-xs" />
            <div className="inline-flex bg-sand-100 rounded-full p-0.5">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  view === 'list' ? 'bg-white text-teal shadow-soft' : 'text-ink-400'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('map')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  view === 'map' ? 'bg-white text-teal shadow-soft' : 'text-ink-400'
                }`}
              >
                Map
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Dynamic Location Banner */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-sand-200 shadow-soft">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal/10 flex items-center justify-center text-teal shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-ink-400 font-medium">Nearest shelters to</p>
              <p className="text-sm font-semibold text-ink truncate leading-tight">
                {currentLocation?.name || 'Selected Location'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-xs font-medium text-ink transition-colors shrink-0"
          >
            Change
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {shelterTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterType === type.id
                  ? 'bg-teal text-white'
                  : 'bg-sand-100 text-ink-500 hover:bg-sand-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer">
          <input
            type="checkbox"
            checked={showVerifiedOnly}
            onChange={() => setShowVerifiedOnly(!showVerifiedOnly)}
            className="accent-teal"
          />
          {t('shelters.verifiedOnly')}
        </label>

        {/* Shelter List or Map View */}
        {view === 'map' ? (
          <div className="h-[520px] w-full rounded-2xl overflow-hidden border border-sand-200 shadow-soft">
            <InteractiveMap
              activeLayers={new Set(['shelters'])}
              className="w-full h-full"
              initialCenter={[currentLocation?.latitude || 17.385, currentLocation?.longitude || 78.4867]}
            />
          </div>
        ) : (
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
        )}

        {filteredShelters.length === 0 && (
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">🔍</span>
            <p className="text-ink-400 font-medium">{t('shelters.noSheltersFound')}</p>
          </div>
        )}
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sand-200 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { href: '/dashboard', icon: '🏠', label: t('dashboard.title'), active: false },
            { href: '/map', icon: '🗺️', label: t('nav.map'), active: false },
            { href: '/alerts', icon: '🔔', label: t('nav.alerts'), active: false },
            { href: '/guide', icon: '📖', label: t('nav.guide'), active: false },
            { href: '/settings', icon: '👤', label: t('nav.settings'), active: false },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-colors ${
                item.active ? 'text-teal' : 'text-ink-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
