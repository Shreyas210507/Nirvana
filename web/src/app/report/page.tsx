'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ReportPage() {
  const [reportType, setReportType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const reportTypes = [
    { id: 'waterlogging', icon: '🌊', label: 'Waterlogging', desc: 'Standing water on roads or in colonies' },
    { id: 'blocked_drain', icon: '🚧', label: 'Blocked Drain', desc: 'Drain clogged with debris or garbage' },
    { id: 'heat_stress', icon: '🥵', label: 'Heat Stress', desc: 'People affected by extreme heat' },
    { id: 'power_cut', icon: '⚡', label: 'Power Cut', desc: 'Electricity failure in the area' },
    { id: 'other', icon: '📋', label: 'Other', desc: 'Any other weather-related issue' },
  ];

  const severityLevels = [
    { id: 'low', label: 'Low', desc: 'Minor inconvenience', color: '#10B981' },
    { id: 'medium', label: 'Medium', desc: 'Significant disruption', color: '#F59E0B' },
    { id: 'high', label: 'High', desc: 'Dangerous situation', color: '#EF4444' },
  ];

  const handleSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-8 border border-sand-200 shadow-soft-lg text-center max-w-sm"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 rounded-full bg-risk-low/10 flex items-center justify-center mx-auto mb-4"
          >
            <span className="text-4xl">✅</span>
          </motion.div>
          <h2 className="text-xl font-bold text-ink mb-2 font-display">Report Submitted!</h2>
          <p className="text-sm text-ink-400 mb-6">
            Thank you for helping your community. Your report will be reviewed and nearby residents can confirm it.
          </p>
          <div className="space-y-2">
            <Link
              href="/dashboard"
              className="block w-full px-4 py-3 rounded-xl bg-teal text-white text-sm font-semibold text-center hover:bg-teal-600 transition-colors"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => { setSubmitted(false); setStep(1); setReportType(''); setSeverity(''); setDescription(''); }}
              className="block w-full px-4 py-3 rounded-xl bg-sand-100 text-ink-500 text-sm font-medium text-center hover:bg-sand-200 transition-colors"
            >
              Submit Another Report
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 pb-8">
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">←</Link>
            <h1 className="font-bold text-ink font-display">Report an Issue</h1>
          </div>
          <span className="text-xs text-ink-400">Step {step}/3</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Step indicator */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-teal' : 'bg-sand-200'}`} />
          ))}
        </div>

        {/* Step 1: Type */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-3"
          >
            <h2 className="text-lg font-semibold text-ink mb-4">What kind of issue?</h2>
            {reportTypes.map(type => (
              <button
                key={type.id}
                onClick={() => { setReportType(type.id); setStep(2); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left hover:-translate-y-0.5 hover:shadow-soft-md ${
                  reportType === type.id ? 'border-teal bg-teal/5' : 'border-sand-200 bg-white'
                }`}
              >
                <span className="text-3xl">{type.icon}</span>
                <div>
                  <h3 className="font-semibold text-ink">{type.label}</h3>
                  <p className="text-xs text-ink-400">{type.desc}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {/* Step 2: Severity + Description */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-ink">How severe is it?</h2>
            <div className="grid grid-cols-3 gap-3">
              {severityLevels.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    severity === s.id ? 'border-teal bg-teal/5' : 'border-sand-200 bg-white'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: s.color }} />
                  <h4 className="font-semibold text-ink text-sm">{s.label}</h4>
                  <p className="text-[10px] text-ink-400">{s.desc}</p>
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm font-medium text-ink mb-2 block">Describe the issue</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What do you see? How deep is the water? Is the road passable?..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-sand-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal text-sm resize-none placeholder:text-ink-300"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 px-4 py-3 rounded-xl bg-sand-100 text-ink-500 font-medium hover:bg-sand-200 transition-colors">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!severity}
                className="flex-1 px-4 py-3 rounded-xl bg-teal text-white font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Photo + Location + Submit */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold text-ink">Add evidence & location</h2>

            {/* Photo upload */}
            <div className="border-2 border-dashed border-sand-300 rounded-2xl p-8 text-center hover:border-teal/40 transition-colors cursor-pointer">
              <span className="text-4xl block mb-2">📸</span>
              <p className="text-sm font-medium text-ink-500">Tap to add a photo</p>
              <p className="text-xs text-ink-300 mt-1">Helps verify the report</p>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl border border-sand-200 p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📍</span>
                  <div>
                    <p className="text-sm font-medium text-ink">Malakpet, Charminar Zone</p>
                    <p className="text-xs text-ink-400">17.370°N, 78.506°E</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 rounded-lg bg-sand-100 text-xs font-medium text-ink-500 hover:bg-sand-200 transition-colors">
                  Change
                </button>
              </div>
            </div>

            {/* Voice note */}
            <button className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-sand-200 shadow-soft hover:shadow-soft-md transition-all">
              <span className="text-xl">🎙️</span>
              <span className="text-sm font-medium text-ink-500">Add voice note (optional)</span>
            </button>

            {/* Summary */}
            <div className="bg-cream-100 rounded-xl p-3 border border-sand-200">
              <p className="text-xs text-ink-400 mb-1">Your report summary:</p>
              <p className="text-sm text-ink">
                <span className="font-medium capitalize">{reportType.replace('_', ' ')}</span> •
                <span className="capitalize"> {severity}</span> severity
                {description && <span className="block text-ink-500 mt-1 text-xs">&quot;{description.slice(0, 80)}{description.length > 80 ? '...' : ''}&quot;</span>}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 px-4 py-3 rounded-xl bg-sand-100 text-ink-500 font-medium hover:bg-sand-200 transition-colors">
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-3 rounded-xl bg-teal text-white font-semibold hover:bg-teal-600 transition-colors shadow-glow-teal"
              >
                ✓ Submit Report
              </button>
            </div>

            <p className="text-xs text-ink-300 text-center">
              📍 Location is shared at cell level only — your exact home is never shown publicly
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
