import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-16">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-forest-600 dark:text-forest-400 uppercase tracking-wider mb-1">
          <Lock className="w-3.5 h-3.5" /> Data Transparency
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
          Privacy Policy
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Last updated: October 2026 • EduAccess AI Student Privacy Commitment
        </p>
      </div>

      <div className="p-6 md:p-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-6 text-xs text-charcoal-700 dark:text-charcoal-300 leading-relaxed font-sans">
        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            1. Our Educational Privacy Standard
          </h2>
          <p>
            EduAccess AI is built on the principle that learning data belongs solely to the student. We do not sell your personal information, train public models on your private lecture notes, or share learning analytics with third-party advertisers.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            2. Data We Process
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account Information:</strong> Name and email address required for secure authentication and cross-device session management.</li>
            <li><strong>Uploaded Study Materials:</strong> PDF documents and raw text notes provided for simplification, concept mapping, and quiz generation.</li>
            <li><strong>Assessment Analytics:</strong> Quiz scores, response timings, and per-topic accuracy percentages computed strictly to power your personalized Learning Insights dashboard.</li>
            <li><strong>Accessibility Preferences:</strong> Stored locally in your browser to maintain your high-contrast, font, and reading ruler choices.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            3. AI Processing & Confidentiality
          </h2>
          <p>
            Document text sent to AI processing pipelines (for summarization, concept hierarchy extraction, or question generation) is transmitted over TLS encryption. Outputs are stored strictly within your private database schema.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
            4. Data Retention and Account Deletion
          </h2>
          <p>
            You maintain full ownership of your data. You may delete individual notes, concept maps, or quiz attempts at any time. When you execute an account deletion in Settings, all associated database records are permanently purged.
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
            to="/terms"
            className="text-xs font-bold text-forest-600 dark:text-forest-400 hover:underline"
          >
            Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
