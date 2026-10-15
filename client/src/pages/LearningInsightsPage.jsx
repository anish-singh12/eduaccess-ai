import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Sparkles,
  History,
  Target,
  Zap,
  Award,
  Lightbulb,
  BookOpen
} from 'lucide-react';
import { insightApi, aiApi } from '../services/api';
import AlertBanner from '../components/common/AlertBanner';

export default function LearningInsightsPage() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [remediatingTopic, setRemediatingTopic] = useState(null);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await insightApi.getInsights();
      if (res) {
        setInsights(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load learning insights.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  const handleRemediate = (topicName) => {
    setRemediatingTopic(topicName);
    navigate('/quizzes', {
      state: {
        initialTopic: `Remediation Revision: ${topicName}`,
        initialText: `Focus practice on mastering key concepts and definitions for ${topicName}`
      }
    });
  };

  const hasData = insights?.hasData && insights?.summary?.totalAttempts > 0;
  const summary = insights?.summary || {};
  const topicBreakdown = insights?.topicBreakdown || [];
  const strongTopics = insights?.strongTopics || [];
  const weakTopics = insights?.weakTopics || [];
  const recentHistory = insights?.recentHistory || [];
  const recommendations = insights?.recommendations || [];

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
            <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Signature Feature • Data-Driven Analytics</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            Learning Insights & Remediation
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real performance tracking derived strictly from your server-graded quiz attempts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/quizzes"
            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Start Adaptive Quiz</span>
          </Link>
          <Link
            to="/quizzes/history"
            className="px-4 py-2.5 border border-charcoal-300 dark:border-charcoal-700 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Attempt Log</span>
          </Link>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <div className="p-16 text-center text-sm font-semibold text-charcoal-500 animate-pulse">
          Analyzing assessment performance & calculating remediation insights...
        </div>
      ) : !hasData ? (
        /* Empty State */
        <div className="p-12 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 text-center space-y-4">
          <span className="text-5xl">🌱</span>
          <h2 className="text-xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            No Quiz History Recorded Yet
          </h2>
          <p className="text-xs text-charcoal-500 max-w-md mx-auto leading-relaxed">
            EduAccess AI calculates real, un-fabricated insights from your quiz attempts. Complete at least one practice quiz to unlock accuracy trends, weak topic alerts, and targeted revisions.
          </p>
          <div className="pt-2">
            <Link
              to="/quizzes"
              className="inline-block px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Take Your First Quiz Now
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-charcoal-500 uppercase">Total Quizzes</span>
              <div className="text-2xl md:text-3xl font-black text-charcoal-900 dark:text-ivory-100">
                {summary.totalAttempts}
              </div>
              <span className="text-[11px] text-charcoal-400 font-medium">
                {summary.totalQuestionsAnswered} questions solved
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-charcoal-500 uppercase">Overall Accuracy</span>
              <div className={`text-2xl md:text-3xl font-black ${
                summary.overallAccuracy >= 75 ? 'text-emerald-600 dark:text-emerald-400' : summary.overallAccuracy >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {summary.overallAccuracy}%
              </div>
              <span className="text-[11px] text-charcoal-400 font-medium">
                {summary.totalCorrect} / {summary.totalQuestionsAnswered} correct
              </span>
            </div>

            <div className="p-5 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                Mastered Topics
              </span>
              <div className="text-2xl md:text-3xl font-black text-emerald-700 dark:text-emerald-300">
                {strongTopics.length}
              </div>
              <span className="text-[11px] text-charcoal-400 font-medium">≥ 75% accuracy</span>
            </div>

            <div className="p-5 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-1">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                Remediation Needed
              </span>
              <div className="text-2xl md:text-3xl font-black text-rose-600 dark:text-rose-400">
                {weakTopics.length}
              </div>
              <span className="text-[11px] text-charcoal-400 font-medium">&lt; 50% accuracy</span>
            </div>
          </div>

          {/* Score Progression Trend Chart */}
          <div className="p-6 md:p-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base md:text-lg text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                  <span>Score Progression Trend</span>
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">Chronological accuracy across recent attempts</p>
              </div>
            </div>

            <div className="h-72 md:h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentHistory} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#64748b" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#64748b" unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#f8fafc',
                      fontSize: '12px'
                    }}
                    formatter={(val) => [`${val}%`, 'Accuracy']}
                    labelFormatter={(idx, payload) => payload?.[0]?.payload?.title || 'Quiz Attempt'}
                  />
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    stroke="#0d9488"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0d9488', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weak Topics Targeted Remediation Section */}
          <div className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                  <Target className="w-5 h-5 text-rose-500" aria-hidden="true" />
                  <span>Targeted Weakness Remediation</span>
                </h3>
                <p className="text-xs text-charcoal-500">
                  Topics scoring below 50% accuracy flagged for high-yield adaptive review.
                </p>
              </div>
            </div>

            {weakTopics.length === 0 ? (
              <div className="p-6 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900 text-center space-y-2">
                <span className="text-2xl">🎉</span>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  No Critical Knowledge Gaps Detected!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 max-w-md mx-auto">
                  All your assessed topics have achieved passing mastery (&gt;50%). Keep testing to maintain high retention!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weakTopics.map((w, idx) => (
                  <div
                    key={idx}
                    className="p-5 bg-rose-50/40 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-900/60 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-sm text-rose-900 dark:text-rose-200">
                          {w.topic}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                          {w.accuracy}% Accuracy
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-600 dark:text-charcoal-400">
                        Missed {w.incorrect} out of {w.total} questions ({Math.round(100 - w.accuracy)}% error rate).
                      </p>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemediate(w.topic)}
                        className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Practice Remediation Quiz</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mastered Topics & Study Recommendations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mastered Concepts */}
            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span>Mastered Concepts ({strongTopics.length})</span>
              </h3>
              {strongTopics.length === 0 ? (
                <p className="text-xs text-charcoal-500">No topics have reached ≥75% mastery yet.</p>
              ) : (
                <div className="space-y-2">
                  {strongTopics.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        {s.topic}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                        {s.accuracy}% ({s.correct}/{s.total})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Study Recommendations */}
            <div className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-4">
              <h3 className="font-extrabold text-base text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
                <span>Recommended Action Items</span>
              </h3>
              {recommendations.length === 0 ? (
                <p className="text-xs text-charcoal-500">Great job! All concepts are currently well-balanced.</p>
              ) : (
                <div className="space-y-3">
                  {recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border border-charcoal-100 dark:border-charcoal-700 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-charcoal-900 dark:text-ivory-100">
                          {rec.topic}
                        </span>
                        <span className="text-[11px] font-mono text-rose-500 font-bold">
                          {rec.accuracy}%
                        </span>
                      </div>
                      <p className="text-charcoal-600 dark:text-charcoal-400 leading-relaxed">
                        {rec.reason}
                      </p>
                      {rec.linkedDocumentId && (
                        <div className="pt-1">
                          <Link
                            to={`/notes?id=${rec.linkedDocumentId}`}
                            className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-bold text-[11px] hover:underline"
                          >
                            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Review Notes: {rec.linkedDocumentTitle || 'Document'}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
