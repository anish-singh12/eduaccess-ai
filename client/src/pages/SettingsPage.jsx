import React, { useState } from 'react';
import {
  Settings,
  Accessibility,
  User,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';
import { authApi } from '../services/api';
import AlertBanner from '../components/common/AlertBanner';

export default function SettingsPage() {
  const { user, updateProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const {
    dyslexiaFont,
    setDyslexiaFont,
    fontSize,
    setFontSize,
    lineSpacing,
    setLineSpacing,
    highContrast,
    setHighContrast,
    readingRuler,
    setReadingRuler,
    resetPreferences,
    saveToProfile
  } = useAccessibility();

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [preferredLearningStyle, setPreferredLearningStyle] = useState(user?.preferredLearningStyle || 'visual');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);

    try {
      await updateProfile({
        name,
        preferredLearningStyle
      });
      await saveToProfile();
      setProfileSuccess('Profile and accessibility preferences updated successfully!');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm deletion.');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError('');
      await authApi.deleteAccount(deletePassword);
      logout();
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account. Ensure password is correct.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-600 dark:text-forest-400 uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" /> Preferences & Account
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
          Settings & Accessibility
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Customize your sensory accessibility defaults, reading tools, and profile settings.
        </p>
      </div>

      {profileSuccess && <AlertBanner type="success" message={profileSuccess} onClose={() => setProfileSuccess('')} />}
      {profileError && <AlertBanner type="error" message={profileError} onClose={() => setProfileError('')} />}

      {/* Section 1: Accessibility & Visual Customization */}
      <section className="p-6 md:p-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-charcoal-100 dark:border-charcoal-800 pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
              <Accessibility className="w-5 h-5 text-forest-600 dark:text-forest-400 shrink-0" /> Sensory & Cognitive Accessibility
            </h2>
            <p className="text-xs text-charcoal-500">
              Settings persist across your browser and apply globally to all modules.
            </p>
          </div>
          <button
            type="button"
            onClick={resetPreferences}
            className="text-xs font-bold text-forest-600 dark:text-forest-400 hover:underline self-start sm:self-auto"
          >
            Reset Defaults
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dyslexia / Hyperlegible Font */}
          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-800 border border-charcoal-100 dark:border-charcoal-700 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                Atkinson Hyperlegible Font
              </span>
              <span className="text-[11px] text-charcoal-500 block">
                Braille Institute certified font designed to maximize letter distinctiveness and readability.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setDyslexiaFont(!dyslexiaFont)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 ${
                dyslexiaFont ? 'bg-forest-600' : 'bg-charcoal-300 dark:bg-charcoal-700'
              }`}
              role="switch"
              aria-checked={dyslexiaFont}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  dyslexiaFont ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* High Contrast Mode */}
          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-800 border border-charcoal-100 dark:border-charcoal-700 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                High Contrast Mode (WCAG AAA)
              </span>
              <span className="text-[11px] text-charcoal-500 block">
                Enhances border contrast and sharpens text color ratios for low vision clarity.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 ${
                highContrast ? 'bg-forest-600' : 'bg-charcoal-300 dark:bg-charcoal-700'
              }`}
              role="switch"
              aria-checked={highContrast}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  highContrast ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reading Ruler Guide */}
          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-800 border border-charcoal-100 dark:border-charcoal-700 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                Mouse Reading Ruler Guide
              </span>
              <span className="text-[11px] text-charcoal-500 block">
                A subtle horizontal highlighting guide that tracks your cursor to assist ADHD & dyslexia focus.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReadingRuler(!readingRuler)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 ${
                readingRuler ? 'bg-forest-600' : 'bg-charcoal-300 dark:bg-charcoal-700'
              }`}
              role="switch"
              aria-checked={readingRuler}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  readingRuler ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Dark / Light Theme Toggle */}
          <div className="p-4 rounded-2xl bg-ivory-50 dark:bg-charcoal-800 border border-charcoal-100 dark:border-charcoal-700 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
                Dark Mode Palette
              </span>
              <span className="text-[11px] text-charcoal-500 block">
                Warm dark charcoal theme that reduces eye strain during low-light study sessions.
              </span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500 ${
                theme === 'dark' ? 'bg-forest-600' : 'bg-charcoal-300 dark:bg-charcoal-700'
              }`}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span
                className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              >
                {theme === 'dark' ? (
                  <svg className="h-3 w-3 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Font Scaling & Line Spacing Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1.5">
              Default Text Scale
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'sm', label: 'Small' },
                { id: 'md', label: 'Default' },
                { id: 'lg', label: 'Large' },
                { id: 'xl', label: 'X-Large' }
              ].map((size) => (
                <button
                  key={size.id}
                  type="button"
                  onClick={() => setFontSize(size.id)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    fontSize === size.id
                      ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                      : 'bg-ivory-50 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-100 border-charcoal-200 dark:border-charcoal-700 hover:bg-charcoal-100 dark:hover:bg-charcoal-700'
                  }`}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1.5">
              Line Spacing / Leading
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'relaxed', label: 'Relaxed' },
                { id: 'loose', label: 'Spacious' }
              ].map((lh) => (
                <button
                  key={lh.id}
                  type="button"
                  onClick={() => setLineSpacing(lh.id)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    lineSpacing === lh.id
                      ? 'bg-forest-600 text-white border-forest-600 shadow-sm'
                      : 'bg-ivory-50 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-100 border-charcoal-200 dark:border-charcoal-700 hover:bg-charcoal-100 dark:hover:bg-charcoal-700'
                  }`}
                >
                  {lh.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Profile & Learning Style Preferences */}
      <section className="p-6 md:p-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-6">
        <div className="border-b border-charcoal-100 dark:border-charcoal-800 pb-4">
          <h2 className="text-lg font-extrabold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
            <User className="w-5 h-5 text-forest-600 dark:text-forest-400 shrink-0" /> Account & Learning Profile
          </h2>
          <p className="text-xs text-charcoal-500">
            Manage your personal profile and tailor AI explanation styles.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="user-name" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                Full Name
              </label>
              <input
                id="user-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
              />
            </div>

            <div>
              <label htmlFor="user-email" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                Email Address (Permanent ID)
              </label>
              <input
                id="user-email"
                type="email"
                disabled
                value={email}
                className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-charcoal-100 dark:bg-charcoal-800/50 text-sm text-charcoal-500 dark:text-charcoal-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="user-learning-style" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
              Primary Learning Modality
            </label>
            <select
              id="user-learning-style"
              value={preferredLearningStyle}
              onChange={(e) => setPreferredLearningStyle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-500"
            >
              <option value="visual">Visual & Knowledge Graphs (Prefers diagrams & concept flows)</option>
              <option value="step-by-step">Structured Step-by-Step (Prefers bulleted procedures & frameworks)</option>
              <option value="plain-language">Analogy & Plain Language (Prefers real-world conceptual metaphors)</option>
              <option value="auditory">Auditory (Prefers speech synthesis & verbal walk-throughs)</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-6 py-2.5 bg-forest-600 hover:bg-forest-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-forest-500 disabled:opacity-50"
            >
              {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Section 3: Danger Zone */}
      <section className="p-6 md:p-8 bg-rose-50/40 dark:bg-rose-950/20 rounded-3xl border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-4">
        <div className="border-b border-rose-200 dark:border-rose-900/40 pb-3">
          <h2 className="text-base font-extrabold text-rose-900 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" /> Danger Zone
          </h2>
          <p className="text-xs text-rose-700 dark:text-rose-400">
            Permanently delete your account and remove all study notes, concept maps, and quiz attempt analytics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-charcoal-900 dark:text-ivory-100 block">
              Delete Account & Data
            </span>
            <span className="text-[11px] text-charcoal-500 block">
              This action is immediate and non-reversible. All your notes and assessments will be purged.
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeletePassword('');
              setDeleteError('');
              setShowDeleteModal(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm self-start sm:self-auto"
          >
            Delete Account
          </button>
        </div>
      </section>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14181e]/35 backdrop-blur-[4px] animate-fadeIn">
          <div className="bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                Confirm Account Deletion
              </h3>
              <p className="text-xs text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                Please enter your account password to confirm. This will permanently delete your profile, documents, concept maps, and quiz attempts.
              </p>
            </div>

            {deleteError && <AlertBanner type="error" message={deleteError} onClose={() => setDeleteError('')} />}

            <div>
              <label htmlFor="confirm-pass" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                Enter Password
              </label>
              <input
                id="confirm-pass"
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your account password"
                className="w-full px-4 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-ivory-100 text-xs font-bold rounded-xl hover:bg-charcoal-200"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || !deletePassword}
                onClick={handleDeleteAccount}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
