import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 animate-fadeIn">
      <div className="max-w-md w-full p-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm text-center space-y-5">
        <span className="text-6xl block animate-bounce">🧭</span>
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-forest-600 dark:text-forest-400 uppercase tracking-widest">
            404 Error • Page Not Found
          </span>
          <h1 className="text-2xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            Lost in the Learning Curve?
          </h1>
          <p className="text-xs text-charcoal-500 leading-relaxed max-w-xs mx-auto">
            The page or learning resource you are looking for does not exist or has been relocated.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-forest-500"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/"
            className="w-full sm:w-auto px-4 py-2.5 bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 text-charcoal-800 dark:text-ivory-100 text-xs font-bold rounded-xl transition-all"
          >
            Platform Home
          </Link>
        </div>
      </div>
    </div>
  );
}
