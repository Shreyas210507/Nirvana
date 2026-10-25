'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LanguageSelector } from '@/components/ui';
import { languages, hyderabadWards } from '@/lib/mock-data';
import { useAuth } from '@/lib/auth-context';
import { LogOut, LogIn, UserPlus, Edit3, Check, X, Shield, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editWard, setEditWard] = useState('w-001');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setEditName(user.full_name || '');
      setEditPhone(user.phone || '');
      setEditWard(user.ward_id || 'w-001');
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim() || undefined,
        ward_id: editWard,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsEditingProfile(false);
      }, 1200);
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };
  const [selectedLang, setSelectedLang] = useState('en');
  const [fontSize, setFontSize] = useState('normal');
  const [simpleMode, setSimpleMode] = useState(false);
  const [channels, setChannels] = useState({ in_app: true, push: true, sms: true, whatsapp: false, voice: false });
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  const toggleChannel = (key: string) => {
    setChannels(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
  };

  return (
    <div className="min-h-screen bg-cream-100 pb-24">
      <nav className="sticky top-0 z-50 bg-cream-100/90 backdrop-blur-xl border-b border-sand-200/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="w-8 h-8 rounded-full bg-sand-100 flex items-center justify-center hover:bg-sand-200 transition-colors">←</Link>
          <h1 className="font-bold text-ink font-display">Profile & Settings</h1>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft"
        >
          {isAuthenticated && user ? (
            <div>
              {!isEditingProfile ? (
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal to-teal-600 flex items-center justify-center text-white text-xl font-bold font-display shadow-glow-teal">
                        {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <h2 className="font-bold text-ink text-lg font-display">{user.full_name}</h2>
                        <p className="text-xs text-ink-400">{user.email}</p>
                        {user.phone && <p className="text-xs text-ink-400 mt-0.5">{user.phone}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-2.5 py-1.5 rounded-xl border border-sand-200 hover:bg-cream-100 text-xs font-semibold text-ink-600 transition-colors flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-sand-100">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-teal/10 text-teal font-semibold capitalize flex items-center gap-1">
                      {user.role === 'municipal' ? <Shield className="w-3 h-3 text-amber-600" /> : <UserIcon className="w-3 h-3 text-teal" />}
                      <span>{user.role}</span>
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-sand-100 text-ink-500 font-medium">
                      📍 Ward: {hyderabadWards.find((w) => w.id === user.ward_id)?.name || user.ward_id || 'Hyderabad'}
                    </span>
                    <button
                      onClick={() => {
                        logout();
                        router.push('/login');
                      }}
                      className="ml-auto text-xs px-3 py-1 rounded-full text-rose-600 hover:bg-rose-50 font-semibold transition-colors flex items-center gap-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-sand-100">
                    <h3 className="font-bold text-ink text-sm">Edit Your Profile</h3>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="text-ink-400 hover:text-ink-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+91-9876543210"
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-500 uppercase tracking-wider mb-1">
                      Primary Ward
                    </label>
                    <select
                      value={editWard}
                      onChange={(e) => setEditWard(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-sand-200 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                    >
                      {hyderabadWards.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.zone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {saveSuccess && (
                    <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Profile successfully saved!
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-4 py-2 rounded-xl bg-teal text-white text-xs font-semibold hover:bg-teal-600 transition-colors shadow-glow-teal flex items-center gap-1.5"
                    >
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-2 rounded-xl border border-sand-200 hover:bg-sand-100 text-xs font-medium text-ink-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center text-xl text-ink-400">
                  👤
                </div>
                <div>
                  <h2 className="font-bold text-ink text-base">Guest Explorer</h2>
                  <p className="text-xs text-ink-400">Sign in to save your ward alerts & preferences</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl bg-teal text-white text-xs font-semibold hover:bg-teal-600 transition-colors shadow-glow-teal flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl bg-sand-100 text-ink font-semibold text-xs hover:bg-sand-200 transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* Saved Places */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
          <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">📍 Saved Places</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏠</span>
                <span className="text-sm text-ink">Home — Malakpet</span>
              </div>
              <span className="text-xs text-teal font-medium">Primary</span>
            </div>
            <button className="w-full text-left text-sm text-teal font-medium hover:text-teal-600 transition-colors py-2">
              + Add another place
            </button>
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
          <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">🗣️ Language</h3>
          <LanguageSelector
            languages={languages.slice(0, 5)}
            selected={selectedLang}
            onChange={setSelectedLang}
            variant="chips"
          />
          <button className="mt-3 text-xs text-teal font-medium hover:text-teal-600 transition-colors">
            Show all {languages.length} languages →
          </button>
        </motion.div>

        {/* Alert Channels */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
          <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">🔔 Alert Channels</h3>
          <div className="space-y-3">
            {[
              { key: 'in_app', label: 'In-App Notifications', icon: '📱' },
              { key: 'push', label: 'Push Notifications', icon: '🔔' },
              { key: 'sms', label: 'SMS Alerts', icon: '💬' },
              { key: 'whatsapp', label: 'WhatsApp', icon: '📲' },
              { key: 'voice', label: 'Voice Calls (Severe only)', icon: '📞' },
            ].map(ch => (
              <div key={ch.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{ch.icon}</span>
                  <span className="text-sm text-ink">{ch.label}</span>
                </div>
                <button
                  onClick={() => toggleChannel(ch.key)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    channels[ch.key as keyof typeof channels] ? 'bg-teal' : 'bg-sand-200'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${
                    channels[ch.key as keyof typeof channels] ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quiet Hours */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-ink text-sm flex items-center gap-2">🌙 Quiet Hours</h3>
            <button
              onClick={() => setQuietHoursEnabled(!quietHoursEnabled)}
              className={`w-10 h-6 rounded-full transition-colors relative ${quietHoursEnabled ? 'bg-teal' : 'bg-sand-200'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${quietHoursEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
          </div>
          {quietHoursEnabled && (
            <div className="flex items-center gap-3 text-sm">
              <input type="time" defaultValue="22:00" className="px-3 py-1.5 rounded-lg border border-sand-200 text-ink" />
              <span className="text-ink-400">to</span>
              <input type="time" defaultValue="07:00" className="px-3 py-1.5 rounded-lg border border-sand-200 text-ink" />
            </div>
          )}
          <p className="text-xs text-ink-300 mt-2">⚠️ Severe alerts will still come through during quiet hours</p>
        </motion.div>

        {/* Accessibility */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
          <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">♿ Accessibility</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-ink-500 mb-2 block">Font Size</label>
              <div className="inline-flex bg-sand-100 rounded-full p-0.5">
                {['small', 'normal', 'large', 'extra-large'].map(size => (
                  <button
                    key={size}
                    onClick={() => setFontSize(size)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                      fontSize === size ? 'bg-white text-teal shadow-soft' : 'text-ink-400'
                    }`}
                  >
                    {size.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink">Simple Mode (large text, voice-first)</span>
              <button
                onClick={() => setSimpleMode(!simpleMode)}
                className={`w-10 h-6 rounded-full transition-colors relative ${simpleMode ? 'bg-teal' : 'bg-sand-200'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform ${simpleMode ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Family Contacts */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
          <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">👨‍👩‍👧 Family Contacts to Notify</h3>
          <p className="text-xs text-ink-400 mb-3">These people will be notified if you press &quot;I Need Help&quot;</p>
          <button className="w-full text-left text-sm text-teal font-medium hover:text-teal-600 transition-colors py-2">
            + Add family contact
          </button>
        </motion.div>

        {/* Data & Privacy */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-sand-200 p-5 shadow-soft">
          <h3 className="font-semibold text-ink text-sm mb-3 flex items-center gap-2">🔒 Data & Privacy</h3>
          <div className="space-y-2 text-sm text-ink-500">
            <button className="w-full text-left py-2 hover:text-teal transition-colors">Download my data</button>
            <button className="w-full text-left py-2 hover:text-teal transition-colors">View consent preferences</button>
            <button className="w-full text-left py-2 hover:text-risk-severe transition-colors text-risk-severe">Delete my account</button>
          </div>
        </motion.div>

        {/* Offline Status */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-teal/5 rounded-2xl border border-teal/10 p-4">
          <h3 className="font-semibold text-teal text-sm mb-2 flex items-center gap-2">📱 Offline Data</h3>
          <div className="space-y-1.5 text-xs text-teal">
            <div className="flex items-center justify-between">
              <span>Safety guides</span>
              <span className="font-medium">✓ Cached</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Emergency numbers</span>
              <span className="font-medium">✓ Cached</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shelter list</span>
              <span className="font-medium">✓ Cached</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Last risk data</span>
              <span className="font-medium">✓ 12m ago</span>
            </div>
          </div>
        </motion.div>

        {/* App Info */}
        <div className="text-center pt-4 pb-2">
          <p className="text-xs text-ink-300">Nirvana v1.0.0 • Pilot: Hyderabad</p>
          <p className="text-[10px] text-ink-200 mt-1">Advisory platform — data is illustrative</p>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-sand-200 z-40">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 px-2">
          {[
            { href: '/dashboard', icon: '🏠', label: 'Home', active: false },
            { href: '/map', icon: '🗺️', label: 'Map', active: false },
            { href: '/alerts', icon: '🔔', label: 'Alerts', active: false },
            { href: '/guide', icon: '📖', label: 'Guide', active: false },
            { href: '/settings', icon: '👤', label: 'Profile', active: true },
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
