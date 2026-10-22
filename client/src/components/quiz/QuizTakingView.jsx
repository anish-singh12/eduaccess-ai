import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import AudioReader from '../common/AudioReader';

export default function QuizTakingView({ quiz, onSubmit, isSubmitting = false }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: optionIndex }
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const questions = quiz.questions || [];
  const currentQ = questions[currentIndex];
  const total = questions.length;

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const handleSelectOption = (questionId, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / total) * 100);

  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption
    }));

    onSubmit({
      quizId: quiz._id,
      answers: formattedAnswers,
      timeSpentSeconds: secondsElapsed
    });
  };

  if (!currentQ) {
    return <div className="p-8 text-center">No questions found in this quiz.</div>;
  }

  const qId = currentQ.id || currentQ._id || String(currentIndex + 1);
  const selectedOption = answers[qId];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm">
        <div>
          <span className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            {quiz.topic || 'General Practice'}
          </span>
          <h2 className="text-lg font-bold text-charcoal-900 dark:text-ivory-100">
            {quiz.title}
          </h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-charcoal-100 dark:bg-charcoal-800 rounded-xl font-mono text-xs font-bold text-charcoal-700 dark:text-ivory-100">
            <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" /> {formatTime(secondsElapsed)}
          </div>
          <div className="text-xs font-semibold text-charcoal-500">
            Question {currentIndex + 1} of {total}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-charcoal-100 dark:bg-charcoal-800 h-2 rounded-full overflow-hidden">
        <div
          className="bg-brand-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Question Card */}
      <div className="p-6 md:p-8 bg-white dark:bg-charcoal-900 rounded-2xl border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300">
              {currentQ.topicTag || quiz.topic || 'Question'}
            </span>
            <span className="text-xs font-bold text-charcoal-400 uppercase">
              Difficulty: {quiz.difficulty || 'Medium'}
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-charcoal-900 dark:text-ivory-100 leading-snug">
            {currentQ.question}
          </h3>

          <div className="pt-1">
            <AudioReader
              text={`Question ${currentIndex + 1}: ${currentQ.question}. Options: ${
                currentQ.options
                  ? currentQ.options.map((opt, idx) => `Option ${['A', 'B', 'C', 'D', 'E'][idx] || idx + 1}: ${opt}`).join('. ')
                  : ''
              }`}
              label="Read Question & Options"
            />
          </div>
        </div>

        {/* Options List */}
        <fieldset className="space-y-3" role="radiogroup" aria-label="Question Options">
          <legend className="sr-only">Select one option</legend>
          {currentQ.options.map((optionText, idx) => {
            const isChosen = selectedOption === idx;
            const letter = ['A', 'B', 'C', 'D', 'E'][idx] || `${idx + 1}`;

            return (
              <label
                key={idx}
                onClick={() => handleSelectOption(qId, idx)}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  isChosen
                    ? 'border-brand-600 bg-brand-50/70 dark:bg-brand-950/40 text-brand-950 dark:text-brand-100 shadow-sm ring-2 ring-brand-500/20'
                    : 'border-charcoal-200 dark:border-charcoal-800 hover:border-brand-300 dark:hover:border-brand-700 bg-white dark:bg-charcoal-900'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${qId}`}
                  checked={isChosen}
                  onChange={() => handleSelectOption(qId, idx)}
                  className="sr-only"
                />
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
                    isChosen
                      ? 'bg-brand-600 text-white shadow'
                      : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-700 dark:text-charcoal-300'
                  }`}
                  aria-hidden="true"
                >
                  {letter}
                </span>
                <span className="text-sm md:text-base font-medium pt-0.5 leading-relaxed">
                  {optionText}
                </span>
              </label>
            );
          })}
        </fieldset>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed border-charcoal-200 dark:border-charcoal-800'
              : 'border-charcoal-300 dark:border-charcoal-700 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100'
          }`}
        >
          ← Previous
        </button>

        {/* Question Selector Quick Dots */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto py-1 max-w-[280px]">
          {questions.map((q, idx) => {
            const thisQId = q.id || q._id || String(idx + 1);
            const isAnswered = answers[thisQId] !== undefined;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Jump to question ${idx + 1}`}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                  isCurrent
                    ? 'ring-2 ring-brand-500 bg-brand-600 text-white'
                    : isAnswered
                    ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold'
                    : 'bg-charcoal-100 dark:bg-charcoal-800 text-charcoal-500 dark:text-charcoal-400'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentIndex < total - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 animate-pulse"
          >
            Submit Quiz
          </button>
        )}
      </div>

      {/* Submission Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14181e]/35 backdrop-blur-[4px] animate-fadeIn">
          <div className="bg-white dark:bg-charcoal-900 rounded-2xl p-6 max-w-md w-full border border-charcoal-200 dark:border-charcoal-800 shadow-2xl space-y-4">
            <h3 className="text-xl font-extrabold text-charcoal-900 dark:text-ivory-100">
              Ready to submit?
            </h3>
            <p className="text-sm text-charcoal-600 dark:text-charcoal-300">
              You answered <span className="font-bold text-brand-600 dark:text-brand-400">{answeredCount}</span> of{' '}
              <span className="font-bold">{total}</span> questions.
              {answeredCount < total && (
                <span className="mt-2 font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Note: {total - answeredCount} questions are unanswered and will be marked incorrect.</span>
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100 dark:border-charcoal-800">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-sm font-semibold rounded-xl text-charcoal-700 dark:text-charcoal-300 hover:bg-charcoal-100 dark:hover:bg-charcoal-800"
              >
                Review Answers
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all"
              >
                {isSubmitting ? 'Grading Quiz...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
