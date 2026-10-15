import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Accessibility } from 'lucide-react';

export default function Footer() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return (
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#070d19] text-slate-600 dark:text-slate-400 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link to="/" className="font-bold text-base text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 dark:border-emerald-500/40 flex items-center justify-center text-xs font-black">EA</span>
                EduAccess <span className="text-emerald-600 dark:text-emerald-400">AI</span>
              </Link>
              <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">•</span>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Inclusive learning tools for all neurodivergent minds
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">How It Works</a>
              <a href="#accessibility" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Accessibility</a>
              <a
                href="https://www.w3.org/WAI/standards-guidelines/wcag/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60"
              >
                <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
                <span>WCAG 2.1 AA Aimed</span>
              </a>
            </div>

            <div className="text-xs text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} EduAccess AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-charcoal-200/60 dark:border-charcoal-800 bg-ivory-100/50 dark:bg-charcoal-900/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link to="/" className="font-bold text-sm text-charcoal-800 dark:text-ivory-100 hover:opacity-85 transition-opacity">
              EduAccess <span className="text-brand-600 dark:text-brand-400">AI</span>
            </Link>
            <span className="text-xs text-charcoal-500 dark:text-charcoal-400">
              — Inclusive learning tools for all minds
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-charcoal-600 dark:text-charcoal-400">
            <Link to="/privacy" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              Terms of Use
            </Link>
            <a
              href="https://www.w3.org/WAI/standards-guidelines/wcag/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5"
            >
              <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
              <span>WCAG 2.1 AA Aimed</span>
            </a>
          </div>

          <div className="text-xs text-charcoal-500 dark:text-charcoal-400">
            © {new Date().getFullYear()} EduAccess AI Platform. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
