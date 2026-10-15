import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  Clock,
  Eye,
  RotateCcw
} from 'lucide-react';
import { quizApi } from '../services/api';
import QuizResultView from '../components/quiz/QuizResultView';
import AlertBanner from '../components/common/AlertBanner';

export default function QuizHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAttempts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await quizApi.getAttempts({ limit: 50 });
      if (res.attempts) {
        setAttempts(res.attempts);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch quiz attempts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();
  }, []);

  const filteredAttempts = attempts.filter((att) => {
    const q = searchQuery.toLowerCase();
    const topicMatch = att.quizTopic?.toLowerCase().includes(q) || att.quizId?.topic?.toLowerCase().includes(q);
    const titleMatch = att.quizTitle?.toLowerCase().includes(q) || att.quizId?.title?.toLowerCase().includes(q);
    return topicMatch || titleMatch;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
            <History className="w-3.5 h-3.5" /> Assessment Records
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            Past Quiz Attempts ({attempts.length})
          </h1>
        </div>

        <Link
          to="/quizzes"
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-teal-500 self-start md:self-auto"
        >
          + Start New Quiz
        </Link>
      </div>

      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Search Bar */}
      <div className="p-4 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm">
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past attempts by topic or title..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          />
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-charcoal-400 pointer-events-none" />
        </div>
      </div>

      {/* Attempts List / Detail View */}
      {selectedAttempt ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setSelectedAttempt(null)}
            className="px-4 py-2 bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 text-charcoal-800 dark:text-ivory-100 text-xs font-bold rounded-xl transition-all"
          >
            ← Back to All Attempts
          </button>
          <QuizResultView
            attempt={selectedAttempt}
            onRetake={() => {
              if (selectedAttempt.quizId?._id || selectedAttempt.quizId) {
                navigate(`/quizzes?id=${selectedAttempt.quizId?._id || selectedAttempt.quizId}`);
              } else {
                navigate('/quizzes');
              }
            }}
            onPracticeWeak={(weakTopics) => {
              navigate('/quizzes', {
                state: { initialTopic: `Revision: ${weakTopics.join(', ')}` }
              });
            }}
          />
        </div>
      ) : loading ? (
        <div className="p-12 text-center text-sm font-semibold text-charcoal-500 animate-pulse">
          Loading past attempts...
        </div>
      ) : filteredAttempts.length === 0 ? (
        <div className="p-12 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-2">
            <History className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
            {searchQuery ? 'No matching quiz attempts.' : 'No quiz attempts recorded yet.'}
          </h3>
          <p className="text-xs text-charcoal-500 max-w-sm mx-auto">
            {searchQuery
              ? 'Try changing your search terms.'
              : 'Take a practice quiz to generate server-graded mastery analytics and remedial study recommendations.'}
          </p>
          <Link
            to="/quizzes"
            className="inline-block px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            Create Your First Quiz
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAttempts.map((att) => {
            const scorePct = att.scorePercentage ?? Math.round(((att.score || 0) / (att.totalQuestions || 1)) * 100);
            const isMastered = scorePct >= 80;
            const isProgressing = scorePct >= 50 && scorePct < 80;
            const title = att.quizTitle || att.quizId?.title || 'Practice Assessment';
            const topic = att.quizTopic || att.quizId?.topic || 'General Topic';
            const durationSec = att.timeSpentSeconds || 0;
            const mins = Math.floor(durationSec / 60);
            const secs = durationSec % 60;

            return (
              <div
                key={att._id}
                className="p-6 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm hover:border-teal-300 dark:hover:border-teal-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300">
                      {topic}
                    </span>
                    <span className="text-[11px] text-charcoal-400 font-mono">
                      {new Date(att.completedAt || att.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-charcoal-900 dark:text-ivory-100 leading-snug line-clamp-2">
                    {title}
                  </h3>

                  {/* Score & Badge Pill */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-ivory-50 dark:bg-charcoal-800 border border-charcoal-100 dark:border-charcoal-700">
                    <div>
                      <span className="text-xl font-black text-charcoal-900 dark:text-ivory-100">
                        {scorePct}%
                      </span>
                      <span className="text-xs text-charcoal-500 font-bold ml-1.5">
                        ({att.score}/{att.totalQuestions})
                      </span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : isProgressing
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {isMastered ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Mastered
                        </>
                      ) : isProgressing ? (
                        <>
                          <TrendingUp className="w-3 h-3" /> Progressing
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" /> Practice Needed
                        </>
                      )}
                    </span>
                  </div>

                  {/* Weak Topics If Any */}
                  {att.weakTopics && att.weakTopics.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Needs Focus:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {att.weakTopics.slice(0, 3).map((w, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 text-[10px] font-medium"
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-charcoal-400 flex items-center gap-3 pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {mins}m {secs}s
                    </span>
                    <span>•</span>
                    <span>{att.answers?.length || att.totalQuestions} Questions</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-charcoal-100 dark:border-charcoal-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAttempt(att)}
                    className="flex-1 py-2 px-3 bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 rounded-xl text-xs font-bold text-center transition-all inline-flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review Breakdown</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (att.quizId?._id || att.quizId) {
                        navigate(`/quizzes?id=${att.quizId?._id || att.quizId}`);
                      } else {
                        navigate('/quizzes', { state: { initialTopic: topic } });
                      }
                    }}
                    className="py-2 px-3 bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 text-charcoal-800 dark:text-ivory-100 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
