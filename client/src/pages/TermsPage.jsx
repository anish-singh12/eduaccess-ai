import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-600 dark:text-forest-400 uppercase tracking-wider mb-1">
          <Shield className="w-3.5 h-3.5" /> Legal & Usage Terms
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
          Terms of Service
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Last updated: October 2026 • EduAccess AI Platform Terms
        </p>
      </div>

      <div className="p-6 md:p-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-6 text-xs text-charcoal-700 dark:text-charcoal-300 leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using EduAccess AI, you agree to comply with and be bound by these Terms of Service. If you disagree with any portion of these terms, you should discontinue using the platform.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            2. Responsible Academic Use
          </h2>
          <p>
            EduAccess AI is engineered as an inclusive cognitive learning aid, designed to assist comprehension through multisensory simplification, dynamic knowledge visualization, and self-assessment remediation. You agree to use the platform in accordance with your institution's academic integrity policies.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            3. AI Generation & Educational Accuracy
          </h2>
          <p>
            While our AI engine employs rigorous prompting and validation routines to summarize notes, extract concept maps, and generate practice questions, automated generative outputs should be cross-referenced with your official course curriculum and primary instructor guidance.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            4. Accessibility Guarantee
          </h2>
          <p>
            We are dedicated to maintaining WCAG 2.1 Level AA compliance across all user interfaces, ensuring seamless access for screen readers, keyboard navigation, dyslexic readers, and learners with diverse cognitive needs.
          </p>
        </section>

        <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between">
          <Link
            to="/"
            className="text-xs font-bold text-forest-600 dark:text-forest-400 hover:underline"
          >
            ← Back to Home
          </Link>
          <Link
            to="/privacy"
            className="text-xs font-bold text-forest-600 dark:text-forest-400 hover:underline"
          >
            Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
