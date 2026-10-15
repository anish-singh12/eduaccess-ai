import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  Target,
  Award,
  Clock,
  RotateCcw,
  BarChart2,
  FileText,
  Check,
  X,
  Lightbulb
} from 'lucide-react';
import AudioReader from '../common/AudioReader';

export default function QuizResultView({ attempt, onRetake, onPracticeWeak }) {
  const navigate = useNavigate();

  if (!attempt) return null;

  const { score, totalQuestions, percentage, timeSpentSeconds, answers = [], quizTitle } = attempt;

  const formatTime = (secs) => {
    if (!secs) return '0:00';
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}m ${rem}s`;
  };

  // Identify weak topics (<50% accuracy)
  const topicStats = {};
  answers.forEach((ans) => {
    const t = ans.topicTag || 'General';
    if (!topicStats[t]) topicStats[t] = { correct: 0, total: 0 };
    topicStats[t].total += 1;
    if (ans.isCorrect) topicStats[t].correct += 1;
  });

  const weakTopics = Object.entries(topicStats)
    .filter(([_, stat]) => (stat.correct / stat.total) < 0.5)
    .map(([topic]) => topic);

  // Performance Category
  const isMastered = percentage >= 75;
  const isDeveloping = percentage >= 50 && percentage < 75;

  const badgeConfig = isMastered
    ? {
        label: 'Mastered Concept',
        Icon: Sparkles,
        style: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
      }
    : isDeveloping
    ? {
        label: 'Developing Comprehension',
        Icon: TrendingUp,
        style: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
      }
    : {
        label: 'Needs Focused Revision',
        Icon: Target,
        style: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800'
      };

  const audioSummary = `Quiz Results for ${quizTitle}. You scored ${score} out of ${totalQuestions}, achieving ${percentage} percent. Performance category: ${badgeConfig.label}. ${
    weakTopics.length > 0 ? `Recommended review topics are: ${weakTopics.join(', ')}.` : 'Great job mastering all topics!'
  }`;

  const StatusIcon = badgeConfig.Icon;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Top Results Hero Card */}
      <div className="p-6 md:p-8 bg-white dark:bg-charcoal-900 rounded-3xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm text-center space-y-6">
        <div className="flex flex-col items-center">
          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border mb-4 ${badgeConfig.style}`}>
            <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{badgeConfig.label}</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            {quizTitle}
          </h2>
          <p className="text-sm text-charcoal-500 mt-1">Quiz Completed & Graded Server-Side</p>
        </div>

        {/* Score Visual Circles */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 py-4">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 rounded-full border-4 border-brand-600 dark:border-brand-400 flex flex-col items-center justify-center bg-brand-50/50 dark:bg-brand-950/40 shadow-inner">
              <span className="text-3xl font-black text-brand-700 dark:text-brand-300">{percentage}%</span>
              <span className="text-[11px] font-bold text-charcoal-500">ACCURACY</span>
            </div>
          </div>

          <div className="flex flex-col items-start space-y-2 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-700 dark:text-brand-300 flex-shrink-0">
                <Award className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs font-bold text-charcoal-400 uppercase block">Total Score</span>
                <span className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
                  {score} / {totalQuestions} Correct
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800/60 flex items-center justify-center text-brand-700 dark:text-brand-300 flex-shrink-0">
                <Clock className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xs font-bold text-charcoal-400 uppercase block">Time Spent</span>
                <span className="text-base font-extrabold text-charcoal-900 dark:text-ivory-100">
                  {formatTime(timeSpentSeconds)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Summary */}
        <div className="pt-2 border-t border-charcoal-100 dark:border-charcoal-800 flex justify-center">
          <AudioReader text={audioSummary} label="Listen to Results Summary" />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {weakTopics.length > 0 && onPracticeWeak && (
            <button
              onClick={() => onPracticeWeak(weakTopics)}
              type="button"
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Practice Weak Topics ({weakTopics.length})</span>
            </button>
          )}

          {onRetake && (
            <button
              onClick={onRetake}
              type="button"
              className="px-4 py-2.5 border border-charcoal-300 dark:border-charcoal-700 hover:bg-charcoal-50 dark:hover:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100 font-bold text-sm rounded-xl transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>Retake Quiz</span>
            </button>
          )}

          <Link
            to="/insights"
            className="px-4 py-2.5 bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 font-bold text-sm rounded-xl transition-all flex items-center gap-2"
          >
            <BarChart2 className="w-4 h-4" aria-hidden="true" />
            <span>View Learning Insights</span>
          </Link>
        </div>
      </div>

      {/* Breakdown per Question */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-brand-700 dark:text-brand-400" aria-hidden="true" />
          <span>Detailed Answer Explanations ({answers.length})</span>
        </h3>

        <div className="space-y-4">
          {answers.map((ans, idx) => {
            const isCorrect = ans.isCorrect;
            return (
              <div
                key={idx}
                className={`p-5 md:p-6 rounded-2xl border transition-all ${
                  isCorrect
                    ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                    : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-charcoal-400">
                        Q{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-charcoal-800 border border-charcoal-200 dark:border-charcoal-700 text-charcoal-600 dark:text-charcoal-300">
                        {ans.topicTag || 'General'}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-charcoal-900 dark:text-ivory-100 leading-snug">
                      {ans.questionText}
                    </h4>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 flex-shrink-0 ${
                      isCorrect
                        ? 'bg-emerald-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {isCorrect ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Correct</span>
                      </>
                    ) : (
                      <>
                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Incorrect</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Choices Status */}
                <div className="mt-4 pt-3 border-t border-charcoal-200/60 dark:border-charcoal-800/60 text-xs space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-charcoal-500">Your Answer:</span>
                    <span className={`font-bold ${isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                      {ans.selectedOption >= 0 ? `Option ${['A','B','C','D','E'][ans.selectedOption] || ans.selectedOption + 1}` : 'Not Answered'}
                    </span>
                  </div>

                  {!isCorrect && (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-charcoal-500">Correct Answer:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        Option {['A','B','C','D','E'][ans.correctAnswer] || ans.correctAnswer + 1}
                      </span>
                    </div>
                  )}

                  {ans.explanation && (
                    <div className="mt-3 p-3 bg-white/70 dark:bg-charcoal-900/70 rounded-xl border border-charcoal-200/50 dark:border-charcoal-800/50 text-charcoal-700 dark:text-charcoal-300 leading-relaxed">
                      <span className="font-bold text-charcoal-900 dark:text-ivory-100 flex items-center gap-1.5 mb-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" aria-hidden="true" />
                        <span>Remediation Explanation:</span>
                      </span>
                      {ans.explanation}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
