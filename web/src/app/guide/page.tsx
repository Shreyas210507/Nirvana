'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { safetyGuidance, emergencyContacts } from '@/lib/mock-data';

function GuidanceCard({ guide, index }: { guide: typeof safetyGuidance[0]; index: number }) {
  const [expanded, setExpanded] = useState(index === 0);
  const phaseIcons = { before: '🔔', during: '⚡', after: '🔄' };
  const phaseColors = { before: '#0D9488', during: '#F97316', after: '#10B981' };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const text = guide.steps.map(s => s.text).join('. ');
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-IN'; u.rate = 0.85;
      speechSynthesis.speak(u);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-white rounded-2xl border border-sand-200 shadow-soft overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-cream-100/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{ backgroundColor: `${phaseColors[guide.phase]}12` }}
          >
            {phaseIcons[guide.phase]}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-ink text-sm">{guide.title}</h3>
            <p className="text-xs text-ink-400 capitalize">{guide.phase} • {guide.steps.length} steps</p>
          </div>
        </div>
        <span className="text-ink-300 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {/* Audio button */}
              <button
                onClick={handleSpeak}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal/10 text-teal text-xs font-medium hover:bg-teal/20 transition-colors"
              >
                🔊 Listen to this guide
              </button>

              {guide.steps.map((step, i) => (
                <motion.div
                  key={step.order}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-xl ${
                    step.importance === 'critical' ? 'bg-risk-severe/5 border border-risk-severe/10' :
                    step.importance === 'important' ? 'bg-saffron/5 border border-saffron/10' :
                    'bg-cream-100'
                  }`}
                >
                  <div className="shrink-0 mt-0.5">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                      step.importance === 'critical' ? 'bg-risk-severe' :
                      step.importance === 'important' ? 'bg-saffron' :
                      'bg-ink-300'
                    }`}>
                      {step.order}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-ink-600 leading-relaxed">{step.text}</p>
                    {step.importance === 'critical' && (
                      <span className="text-[10px] text-risk-severe font-semibold uppercase tracking-wider mt-1 inline-block">
                        ⚠ Critical
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FirstAidCard({ title, emoji, steps }: { title: string; emoji: string; steps: string[] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-sand-200 shadow-soft overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-cream-100/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          <span className="font-semibold text-ink text-sm">{title}</span>
        </div>
        <span className="text-ink-300 text-sm">{expanded ? '▲' : '▼'}</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-ink-600">
                  <span className="text-teal shrink-0 mt-0.5">•</span>
                  {step}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SafetyGuidePage() {
  const [hazardFilter, setHazardFilter] = useState<'flood' | 'heat'>('flood');

  const filteredGuides = safetyGuidance.filter(g => g.hazard === hazardFilter);

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">←</Link>
            <h1 className="font-bold text-ink font-display">Safety Guide</h1>
          </div>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) speechSynthesis.cancel();
            }}
            className="text-xs text-ink-400 hover:text-ink-600 transition-colors"
          >
            🔇 Stop audio
          </button>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Hazard toggle */}
        <div className="inline-flex bg-sand-100 rounded-full p-1 w-full">
          <button
            onClick={() => setHazardFilter('flood')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
              hazardFilter === 'flood' ? 'bg-teal text-white shadow-glow-teal' : 'text-ink-400'
            }`}
          >
            🌊 Flood Safety
          </button>
          <button
            onClick={() => setHazardFilter('heat')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
              hazardFilter === 'heat' ? 'bg-saffron text-white shadow-glow-saffron' : 'text-ink-400'
            }`}
          >
            🌡️ Heat Safety
          </button>
        </div>

        {/* Offline notice */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-teal/5 border border-teal/10">
          <span className="text-sm">📱</span>
          <p className="text-xs text-teal font-medium">This guide is available offline after first load</p>
        </div>

        {/* Guide cards */}
        <div className="space-y-3">
          {filteredGuides.map((guide, i) => (
            <GuidanceCard key={guide.id} guide={guide} index={i} />
          ))}
        </div>

        {/* First Aid */}
        <div className="pt-2">
          <h2 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
            🏥 First Aid Quick Reference
          </h2>
          <div className="space-y-2">
            {hazardFilter === 'heat' ? (
              <>
                <FirstAidCard
                  title="Heat Stroke — What to Look For"
                  emoji="🥵"
                  steps={[
                    'Body temperature above 40°C (104°F)',
                    'Hot, red, dry skin — NO sweating',
                    'Rapid, strong pulse and throbbing headache',
                    'Confusion, dizziness, nausea, unconsciousness',
                    'THIS IS A MEDICAL EMERGENCY — call 108 immediately',
                  ]}
                />
                <FirstAidCard
                  title="Heat Stroke — What to Do"
                  emoji="💊"
                  steps={[
                    'Call 108 immediately',
                    'Move person to cool, shaded area',
                    'Cool the body with wet cloth, fan, or water spray',
                    'Place ice packs at neck, armpits, and groin',
                    'Give sips of cool water only if person is conscious',
                    'Do NOT give aspirin or paracetamol',
                  ]}
                />
              </>
            ) : (
              <>
                <FirstAidCard
                  title="Flood Water Safety"
                  emoji="🌊"
                  steps={[
                    '15cm (6 inches) of moving water can knock you down',
                    '60cm (2 feet) of water can float a car',
                    'Flood water may contain sewage, chemicals, sharp objects',
                    'Do NOT drink flood water — boil or use sealed bottles',
                    'Wash hands with soap and clean water after any contact',
                    'Watch for snakes and insects in flood water',
                  ]}
                />
                <FirstAidCard
                  title="If Trapped in Rising Water"
                  emoji="🆘"
                  steps={[
                    'Move to highest floor or rooftop if water is rising',
                    'Call 112 or 1070 and share your exact location',
                    'Wave a bright cloth or torch to signal rescuers',
                    'Do NOT try to swim through fast-flowing water',
                    'If you must enter water, hold hands in a human chain',
                    'Avoid electrical poles, wires, and metal objects in water',
                  ]}
                />
              </>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="pt-2">
          <h2 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">
            📞 Emergency Numbers
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {emergencyContacts.slice(0, 6).map(contact => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className="flex items-center gap-2 p-3 rounded-xl bg-white border border-sand-200 shadow-soft hover:shadow-soft-md transition-all"
              >
                <span className="text-lg">📞</span>
                <div>
                  <p className="text-xs font-semibold text-ink">{contact.name}</p>
                  <p className="text-xs text-teal font-mono font-bold">{contact.number}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Advisory */}
        <div className="p-3 rounded-xl bg-saffron/10 border border-saffron/20">
          <p className="text-xs text-saffron font-medium text-center">
            ⓘ This guide is advisory. Always follow instructions from official rescue teams and authorities.
          </p>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sand-200 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { href: '/dashboard', icon: '🏠', label: 'Home', active: false },
            { href: '/map', icon: '🗺️', label: 'Map', active: false },
            { href: '/alerts', icon: '🔔', label: 'Alerts', active: false },
            { href: '/guide', icon: '📖', label: 'Guide', active: true },
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
