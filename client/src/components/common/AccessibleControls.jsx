import React, { useState } from 'react';
import {
  Accessibility,
  X,
  Check,
  BookOpen,
  Eye,
  Ruler,
  Moon,
  Sun,
  RotateCcw
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function AccessibleControls({ variant = 'bar' }) {
  const { isDark, toggleTheme } = useTheme();
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

  const { isAuthenticated } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async () => {
    await saveToProfile();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const fontSizes = [
    { id: 'sm', label: 'Small', symbol: 'A-' },
    { id: 'md', label: 'Default', symbol: 'A' },
    { id: 'lg', label: 'Large', symbol: 'A+' },
    { id: 'xl', label: 'Extra Large', symbol: 'A++' }
  ];

  const spacings = [
    { id: 'normal', label: 'Normal' },
    { id: 'relaxed', label: 'Relaxed' },
    { id: 'loose', label: 'Loose' }
  ];

  if (variant === 'floating') {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle Accessibility Preferences Panel"
          className="w-12 h-12 p-3 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 flex items-center justify-center transition-all transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-brand-400"
        >
          <Accessibility className="w-6 h-6" aria-hidden="true" />
        </button>

        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 p-4 bg-white dark:bg-charcoal-900 rounded-2xl shadow-2xl border border-charcoal-200 dark:border-charcoal-800 space-y-4 animate-slideUp text-charcoal-900 dark:text-ivory-100">
            <div className="flex items-center justify-between border-b border-charcoal-100 dark:border-charcoal-800 pb-2">
              <h3 className="font-bold text-sm flex items-center gap-1.5 text-brand-800 dark:text-brand-300">
                <Accessibility className="w-4 h-4 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                <span>Accessibility Toolbar</span>
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close accessibility panel"
                className="p-1 rounded text-charcoal-400 hover:text-charcoal-600 dark:hover:text-charcoal-200"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Dark / Light Theme Toggle */}
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-xs font-semibold block">{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">
                  {isDark ? 'Comfortable dark palette' : 'High-clarity light palette'}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                role="switch"
                aria-checked={isDark}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isDark ? 'bg-brand-600' : 'bg-charcoal-300 dark:bg-charcoal-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isDark ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Font Size */}
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 block mb-1.5">
                Text Size
              </label>
              <div className="grid grid-cols-4 gap-1 bg-charcoal-50 dark:bg-charcoal-800 p-1 rounded-xl">
                {fontSizes.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFontSize(f.id)}
                    className={`py-1 text-xs font-bold rounded-lg transition-all ${
                      fontSize === f.id
                        ? 'bg-white dark:bg-charcoal-700 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900'
                    }`}
                    aria-label={`Set text size to ${f.label}`}
                  >
                    {f.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* Dyslexia Mode */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block">Dyslexia-Friendly Font</span>
                <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">Atkinson Hyperlegible</span>
              </div>
              <button
                onClick={() => setDyslexiaFont(!dyslexiaFont)}
                role="switch"
                aria-checked={dyslexiaFont}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  dyslexiaFont ? 'bg-brand-600' : 'bg-charcoal-200 dark:bg-charcoal-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    dyslexiaFont ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reading Spacing */}
            <div>
              <label className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 block mb-1.5">
                Line Spacing
              </label>
              <div className="grid grid-cols-3 gap-1 bg-charcoal-50 dark:bg-charcoal-800 p-1 rounded-xl">
                {spacings.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setLineSpacing(s.id)}
                    className={`py-1 text-xs font-medium rounded-lg transition-all ${
                      lineSpacing === s.id
                        ? 'bg-white dark:bg-charcoal-700 text-brand-600 dark:text-brand-400 shadow-sm'
                        : 'text-charcoal-600 dark:text-charcoal-300 hover:text-charcoal-900'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block">High Contrast Mode</span>
                <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">Enhanced edge readability</span>
              </div>
              <button
                onClick={() => setHighContrast(!highContrast)}
                role="switch"
                aria-checked={highContrast}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  highContrast ? 'bg-brand-600' : 'bg-charcoal-200 dark:bg-charcoal-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Reading Guide / Ruler */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold block">Reading Guide Ruler</span>
                <span className="text-[10px] text-charcoal-500 dark:text-charcoal-400">Follows mouse cursor</span>
              </div>
              <button
                onClick={() => setReadingRuler(!readingRuler)}
                role="switch"
                aria-checked={readingRuler}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  readingRuler ? 'bg-brand-600' : 'bg-charcoal-200 dark:bg-charcoal-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    readingRuler ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between gap-2">
              <button
                onClick={resetPreferences}
                className="text-xs text-charcoal-500 hover:text-charcoal-800 dark:hover:text-charcoal-200 underline"
              >
                Reset All
              </button>
              {isAuthenticated && (
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3 h-3" aria-hidden="true" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save as Default</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Inline Toolbar variant
  return (
    <div
      aria-label="Accessibility options"
      className="flex flex-wrap items-center gap-2 p-2.5 bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-800 rounded-2xl shadow-sm text-sm"
    >
      <div className="flex items-center gap-1 pr-2 border-r border-charcoal-100 dark:border-charcoal-800">
        <span className="text-xs font-semibold text-charcoal-500 dark:text-charcoal-400 mr-1 flex items-center gap-1">
          <Accessibility className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
          <span>Text:</span>
        </span>
        {fontSizes.map((f) => (
          <button
            key={f.id}
            onClick={() => setFontSize(f.id)}
            title={`Text Size: ${f.label}`}
            className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
              fontSize === f.id
                ? 'bg-brand-600 text-white'
                : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-200'
            }`}
          >
            {f.symbol}
          </button>
        ))}
      </div>

      {/* Dyslexia Mode Toggle */}
      <button
        onClick={() => setDyslexiaFont(!dyslexiaFont)}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
          dyslexiaFont
            ? 'bg-brand-50 text-brand-700 border-brand-300 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-700 font-bold'
            : 'border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{dyslexiaFont ? 'Dyslexia Font ON' : 'Dyslexia Font'}</span>
      </button>

      {/* High Contrast */}
      <button
        onClick={() => setHighContrast(!highContrast)}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
          highContrast
            ? 'bg-charcoal-900 text-white border-charcoal-900 dark:bg-ivory-100 dark:text-charcoal-950 font-bold'
            : 'border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800'
        }`}
      >
        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{highContrast ? 'High Contrast ON' : 'High Contrast'}</span>
      </button>

      {/* Reading Guide */}
      <button
        onClick={() => setReadingRuler(!readingRuler)}
        className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
          readingRuler
            ? 'bg-brand-600 text-white border-brand-600 font-bold'
            : 'border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800'
        }`}
      >
        <Ruler className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{readingRuler ? 'Ruler ON' : 'Reading Ruler'}</span>
      </button>

      {/* Theme Mode */}
      <button
        onClick={toggleTheme}
        className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 transition-all flex items-center gap-1.5"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
        )}
        <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </button>

      {/* Reset */}
      <button
        onClick={resetPreferences}
        title="Reset Accessibility Settings"
        aria-label="Reset accessibility settings"
        className="p-1.5 text-xs text-charcoal-400 hover:text-charcoal-700 dark:hover:text-charcoal-200 ml-auto"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
