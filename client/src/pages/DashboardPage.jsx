import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileQuestion,
  Lightbulb,
  FileText,
  CheckCircle2,
  Network,
  GraduationCap
} from 'lucide-react';
import { analyticsApi } from '../services/api';
import AlertBanner from '../components/common/AlertBanner';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);
        const res = await analyticsApi.getDashboard();
        if (isMounted) setData(res);
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load dashboard data.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  const metrics = data?.metrics || {};
  const quizTrends = data?.quizTrends || [];
  const weakTopics = data?.weakTopics || [];
  const recentActivity = data?.recentActivity || [];
  const recentAttempts = data?.recentAttempts || [];
  const hasAnyData = (metrics.notesSaved || 0) + (metrics.quizzesCompleted || 0) + (metrics.conceptMapsCreated || 0) > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Simple sparkline bar chart for quiz trends
  const maxTrendPct = quizTrends.length > 0
    ? Math.max(...quizTrends.map(t => t.percentage || 0), 1)
    : 100;

  return (
    <div className="dashboard-page">
      {/* Welcome */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-header-title">Dashboard</h1>
          <p className="dashboard-header-subtitle">
            {loading
              ? 'Loading your learning analytics…'
              : hasAnyData
                ? 'Your learning progress at a glance.'
                : 'Welcome! Start by uploading study material to see analytics here.'}
          </p>
        </div>
        <div className="dashboard-header-actions">
          <Link to="/notes" className="dashboard-action-btn dashboard-action-btn--primary">+ New Note</Link>
          <Link to="/quizzes" className="dashboard-action-btn dashboard-action-btn--secondary flex items-center gap-1.5">
            <FileQuestion className="w-4 h-4" aria-hidden="true" />
            <span>Take Quiz</span>
          </Link>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {loading ? (
        <div className="dashboard-loading">
          <LoadingSpinner message="Loading analytics..." />
        </div>
      ) : (
        <>
          {/* Summary Metric Cards */}
          <div className="dashboard-metrics">
            <div className="dashboard-metric-card">
              <div className="dashboard-metric-icon dashboard-metric-icon--notes" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <div className="dashboard-metric-data">
                <span className="dashboard-metric-value">{metrics.notesSaved || 0}</span>
                <span className="dashboard-metric-label">Notes Saved</span>
              </div>
            </div>

            <div className="dashboard-metric-card">
              <div className="dashboard-metric-icon dashboard-metric-icon--quizzes" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </svg>
              </div>
              <div className="dashboard-metric-data">
                <span className="dashboard-metric-value">{metrics.quizzesCompleted || 0}</span>
                <span className="dashboard-metric-label">Quizzes Completed</span>
              </div>
            </div>

            <div className="dashboard-metric-card">
              <div className="dashboard-metric-icon dashboard-metric-icon--score" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
              <div className="dashboard-metric-data">
                <span className="dashboard-metric-value">{metrics.averageScore || 0}%</span>
                <span className="dashboard-metric-label">Avg. Score</span>
              </div>
            </div>

            <div className="dashboard-metric-card">
              <div className="dashboard-metric-icon dashboard-metric-icon--maps" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" /><circle cx="4" cy="6" r="2" /><circle cx="20" cy="6" r="2" /><circle cx="4" cy="18" r="2" />
                  <path d="M6 7.5 9.5 10" /><path d="m17.5 7.5-5 3" /><path d="M6 16.5 9.5 14" />
                </svg>
              </div>
              <div className="dashboard-metric-data">
                <span className="dashboard-metric-value">{metrics.conceptMapsCreated || 0}</span>
                <span className="dashboard-metric-label">Concept Maps</span>
              </div>
            </div>
          </div>

          {/* Weak topic alert */}
          {weakTopics.length > 0 && (
            <div className="dashboard-alert dashboard-alert--warning">
              <div className="dashboard-alert-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="dashboard-alert-icon">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4" /><path d="M12 17h.01" />
                </svg>
                <div>
                  <strong>{weakTopics.length} topic{weakTopics.length > 1 ? 's' : ''} below 70% accuracy</strong>
                  <p className="dashboard-alert-detail">
                    {weakTopics.slice(0, 3).map(t => `${t.topic} (${t.accuracy}%)`).join(', ')}
                  </p>
                </div>
              </div>
              <Link to="/insights" className="dashboard-alert-action">
                Review Insights →
              </Link>
            </div>
          )}

          {/* Two-column: Quiz Trends + Recent Activity */}
          <div className="dashboard-grid">
            {/* Quiz Score Trends */}
            <div className="dashboard-card dashboard-card--trends">
              <div className="dashboard-card-header">
                <div className="dashboard-card-header-titles">
                  <h3 className="dashboard-card-title">Quiz Score Trends</h3>
                  {quizTrends.length > 0 && (
                    <span className="dashboard-card-subtitle">
                      {quizTrends.length} {quizTrends.length === 1 ? 'attempt' : 'attempts'}
                    </span>
                  )}
                </div>
                {quizTrends.length > 0 && (
                  <Link to="/insights" className="dashboard-card-link">Full insights →</Link>
                )}
              </div>
              <div className="dashboard-card-body dashboard-card-body--trends">
                {quizTrends.length === 0 ? (
                  <div className="dashboard-empty dashboard-empty--compact">
                    <p>Complete your first quiz to see score trends.</p>
                    <Link to="/quizzes" className="dashboard-empty-action">Generate a Quiz →</Link>
                  </div>
                ) : (
                  <div className="dashboard-trends-container">
                    <div className="dashboard-trends-chart">
                      {/* Subtle Y-Axis Grid Lines */}
                      <div className="dashboard-trends-grid" aria-hidden="true">
                        <div className="dashboard-trends-grid-row">
                          <span className="dashboard-trends-grid-label">100%</span>
                          <div className="dashboard-trends-grid-line" />
                        </div>
                        <div className="dashboard-trends-grid-row">
                          <span className="dashboard-trends-grid-label">50%</span>
                          <div className="dashboard-trends-grid-line" />
                        </div>
                        <div className="dashboard-trends-grid-row">
                          <span className="dashboard-trends-grid-label">0%</span>
                          <div className="dashboard-trends-grid-line dashboard-trends-grid-line--base" />
                        </div>
                      </div>

                      {/* Bars Plot Area */}
                      <div className={`dashboard-trends-plot ${quizTrends.length === 1 ? 'dashboard-trends-plot--single' : ''}`}>
                        {quizTrends.map((trend, idx) => {
                          const pct = Math.max(Math.min(trend.percentage ?? 0, 100), 4);
                          const isHovered = hoveredTrendIdx === idx;
                          return (
                            <div
                              key={idx}
                              className={`dashboard-trend-col ${isHovered ? 'dashboard-trend-col--hovered' : ''}`}
                              onMouseEnter={() => setHoveredTrendIdx(idx)}
                              onMouseLeave={() => setHoveredTrendIdx(null)}
                              tabIndex={0}
                              role="button"
                              aria-label={`${trend.title}: ${trend.percentage}% on ${trend.date}`}
                            >
                              {/* Interactive Tooltip */}
                              {isHovered && (
                                <div className="dashboard-trend-tooltip" role="tooltip">
                                  <div className="dashboard-trend-tooltip-title">{trend.title || 'Quiz'}</div>
                                  <div className="dashboard-trend-tooltip-score">
                                    {trend.score !== undefined && trend.total !== undefined
                                      ? `${trend.score}/${trend.total} (${trend.percentage}%)`
                                      : `${trend.percentage}%`}
                                  </div>
                                  <div className="dashboard-trend-tooltip-date">{trend.date}</div>
                                </div>
                              )}

                              {/* Bar Column Track */}
                              <div className="dashboard-trend-bar-track">
                                <div
                                  className="dashboard-trend-bar-fill"
                                  style={{ height: `${pct}%` }}
                                />
                              </div>

                              {/* Date and Score Labels */}
                              <div className="dashboard-trend-meta">
                                <span className="dashboard-trend-pct-label">{trend.percentage}%</span>
                                <span className="dashboard-trend-date-label">{trend.date}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Single Attempt Guidance Note */}
                    {quizTrends.length === 1 && (
                      <div className="dashboard-single-trend-note">
                        <Lightbulb className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" aria-hidden="true" />
                        <span>Complete more quizzes to see your progress trend.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Recent Activity</h3>
              </div>
              <div className="dashboard-card-body">
                {recentActivity.length === 0 ? (
                  <div className="dashboard-empty">
                    <p>No activity recorded yet.</p>
                    <Link to="/notes" className="dashboard-empty-action">Upload study material →</Link>
                  </div>
                ) : (
                  <div className="dashboard-activity-list">
                    {recentActivity.slice(0, 8).map((item) => (
                      <Link
                        key={item.id}
                        to={item.link || '#'}
                        className="dashboard-activity-item"
                      >
                        <span className={`dashboard-activity-badge dashboard-activity-badge--${item.type} flex items-center justify-center`} aria-hidden="true">
                          {item.type === 'note' ? (
                            <FileText className="w-3.5 h-3.5 text-brand-700 dark:text-brand-300" />
                          ) : item.type === 'quiz' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300" />
                          ) : (
                            <Network className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-300" />
                          )}
                        </span>
                        <div className="dashboard-activity-content">
                          <span className="dashboard-activity-title">{item.title || 'Untitled'}</span>
                          <span className="dashboard-activity-desc">{item.description}</span>
                        </div>
                        <span className="dashboard-activity-time">{formatDate(item.timestamp)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Quiz Results */}
          {recentAttempts.length > 0 && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h3 className="dashboard-card-title">Recent Quiz Results</h3>
                <Link to="/quizzes/history" className="dashboard-card-link">View all →</Link>
              </div>
              <div className="dashboard-card-body">
                <div className="dashboard-results-list">
                  {recentAttempts.slice(0, 5).map((att) => (
                    <div key={att._id} className="dashboard-result-item">
                      <div className="dashboard-result-info">
                        <span className="dashboard-result-title">{att.title || 'Practice Quiz'}</span>
                        <span className="dashboard-result-meta">
                          {att.score}/{att.totalQuestions} • {formatDate(att.createdAt)}
                        </span>
                      </div>
                      <span className={`dashboard-result-score ${
                        (att.percentage ?? 0) >= 75 ? 'dashboard-result-score--good'
                          : (att.percentage ?? 0) >= 50 ? 'dashboard-result-score--ok'
                          : 'dashboard-result-score--weak'
                      }`}>
                        {att.percentage ?? 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Empty state for brand new users */}
          {!hasAnyData && (
            <div className="dashboard-onboarding">
              <div className="dashboard-onboarding-icon flex items-center justify-center" aria-hidden="true">
                <GraduationCap className="w-10 h-10 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="dashboard-onboarding-title">Welcome to EduAccess AI</h3>
              <p className="dashboard-onboarding-desc">
                Upload study material, simplify notes, create concept maps, and take adaptive quizzes — all in one place.
              </p>
              <div className="dashboard-onboarding-actions">
                <Link to="/notes" className="dashboard-onboarding-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                    <path d="M6 6h10" /><path d="M6 10h10" />
                  </svg>
                  Simplify Notes
                </Link>
                <Link to="/concept-maps" className="dashboard-onboarding-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" /><circle cx="4" cy="6" r="2" /><circle cx="20" cy="6" r="2" />
                    <path d="M6 7.5 9.5 10" /><path d="m17.5 7.5-5 3" />
                  </svg>
                  Create Concept Map
                </Link>
                <Link to="/quizzes" className="dashboard-onboarding-btn">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  Generate Quiz
                </Link>
              </div>
            </div>
          )}

          {/* Learning Insights CTA */}
          {(metrics.quizzesCompleted || 0) > 0 && (
            <Link to="/insights" className="dashboard-insights-cta">
              <div>
                <h3 className="dashboard-insights-cta-title">View detailed learning insights</h3>
                <p className="dashboard-insights-cta-desc">
                  Performance trends, topic mastery, weak area remediation, and personalized recommendations.
                </p>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          )}
        </>
      )}
    </div>
  );
}
