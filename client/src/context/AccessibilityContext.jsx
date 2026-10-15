import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const { user, updateProfile } = useAuth();

  const [dyslexiaFont, setDyslexiaFont] = useState(() => {
    return localStorage.getItem('eduaccess_a11y_dyslexia') === 'true';
  });

  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('eduaccess_a11y_fontsize') || 'md';
  });

  const [lineSpacing, setLineSpacing] = useState(() => {
    return localStorage.getItem('eduaccess_a11y_spacing') || 'normal';
  });

  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('eduaccess_a11y_contrast') === 'true';
  });

  const [contentWidth, setContentWidth] = useState(() => {
    return localStorage.getItem('eduaccess_a11y_width') || 'normal';
  });

  const [readingRuler, setReadingRuler] = useState(false);
  const [rulerPosition, setRulerPosition] = useState(200);

  // Sync with user account preferences if user logs in
  useEffect(() => {
    if (user?.preferences) {
      if (user.preferences.dyslexiaFont !== undefined) setDyslexiaFont(user.preferences.dyslexiaFont);
      if (user.preferences.fontSize) setFontSize(user.preferences.fontSize);
      if (user.preferences.lineSpacing) setLineSpacing(user.preferences.lineSpacing);
      if (user.preferences.highContrast !== undefined) setHighContrast(user.preferences.highContrast);
    }
  }, [user]);

  // Apply classes to DOM
  useEffect(() => {
    const root = document.documentElement;

    // Dyslexia font
    if (dyslexiaFont) {
      root.classList.add('font-dyslexic-mode');
    } else {
      root.classList.remove('font-dyslexic-mode');
    }
    localStorage.setItem('eduaccess_a11y_dyslexia', String(dyslexiaFont));

    // High Contrast
    if (highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }
    localStorage.setItem('eduaccess_a11y_contrast', String(highContrast));

    // Font size
    ['reading-size-sm', 'reading-size-md', 'reading-size-lg', 'reading-size-xl'].forEach((cls) => {
      root.classList.remove(cls);
    });
    if (fontSize) {
      root.classList.add(`reading-size-${fontSize}`);
    }
    localStorage.setItem('eduaccess_a11y_fontsize', fontSize);

    // Line spacing
    ['reading-spacing-normal', 'reading-spacing-relaxed', 'reading-spacing-loose'].forEach((cls) => {
      root.classList.remove(cls);
    });
    if (lineSpacing) {
      root.classList.add(`reading-spacing-${lineSpacing}`);
    }
    localStorage.setItem('eduaccess_a11y_spacing', lineSpacing);
    localStorage.setItem('eduaccess_a11y_width', contentWidth);
  }, [dyslexiaFont, highContrast, fontSize, lineSpacing, contentWidth]);

  // Track mouse for reading ruler if enabled
  useEffect(() => {
    if (!readingRuler) return;

    const handleMouseMove = (e) => {
      setRulerPosition(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [readingRuler]);

  const resetPreferences = () => {
    setDyslexiaFont(false);
    setFontSize('md');
    setLineSpacing('normal');
    setHighContrast(false);
    setContentWidth('normal');
    setReadingRuler(false);
  };

  const saveToProfile = async () => {
    if (user) {
      await updateProfile({
        preferences: {
          dyslexiaFont,
          fontSize,
          lineSpacing,
          highContrast
        }
      });
    }
  };

  const value = {
    dyslexiaFont,
    setDyslexiaFont,
    fontSize,
    setFontSize,
    lineSpacing,
    setLineSpacing,
    highContrast,
    setHighContrast,
    contentWidth,
    setContentWidth,
    readingRuler,
    setReadingRuler,
    rulerPosition,
    resetPreferences,
    saveToProfile
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Visual Reading Guide / Ruler Overlay */}
      {readingRuler && (
        <div
          className="fixed left-0 right-0 pointer-events-none z-50 transition-all duration-75 border-y-2 border-brand-500/50 bg-brand-500/10 backdrop-blur-[0.5px]"
          style={{
            top: `${Math.max(0, rulerPosition - 30)}px`,
            height: '60px'
          }}
          aria-hidden="true"
        />
      )}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
