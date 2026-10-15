import React, { useState, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import {
  FileQuestion,
  RotateCcw,
  History,
  Target,
  FileText,
  Upload,
  Sparkles
} from 'lucide-react';
import { quizApi, aiApi } from '../services/api';
import { useDocument } from '../context/DocumentContext';
import QuizTakingView from '../components/quiz/QuizTakingView';
import QuizResultView from '../components/quiz/QuizResultView';
import AlertBanner from '../components/common/AlertBanner';

export default function QuizStudioPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const quizIdParam = searchParams.get('id');

  // Shared persistent document context across tools and navigation
  const {
    currentDoc,
    setDocument,
    updateText,
    updateTopic,
    clearDocument,
    isRequestCurrent,
    quizData,
    updateQuizData
  } = useDocument();

  // Generator inputs synchronized with shared context
  const topic = currentDoc.topic || location.state?.initialTopic || '';
  const sourceText = currentDoc.text || location.state?.initialText || '';
  const selectedFile = currentDoc.file;

  const phase = quizData.phase || 'setup';
  const numQuestions = quizData.numQuestions || 5;
  const difficulty = quizData.difficulty || 'medium';
  const activeQuiz = quizData.activeQuiz || null;
  const latestAttempt = quizData.latestAttempt || null;

  // Local UI states
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load existing quiz from URL query param if present
  useEffect(() => {
    if (!quizIdParam) return;

    let isMounted = true;
    async function loadQuiz() {
      try {
        setError(null);
        const res = await quizApi.getById(quizIdParam);
        if (!isMounted || !res.quiz) return;

        updateQuizData({
          activeQuiz: res.quiz,
          phase: 'taking'
        });
      } catch (err) {
        if (isMounted) setError(err.message || 'Failed to load quiz.');
      }
    }

    loadQuiz();
    return () => { isMounted = false; };
  }, [quizIdParam, updateQuizData]);

  // Handle PDF and DOCX Upload & Text Extraction
  const handleFileUpload = async (eOrFile) => {
    let file = null;
    if (eOrFile?.target?.files) {
      file = eOrFile.target.files[0];
    } else if (eOrFile instanceof File) {
      file = eOrFile;
    }
    if (!file) return;

    const lowerName = file.name.toLowerCase();
    if (lowerName.endsWith('.doc')) {
      setError('Legacy .doc format is not supported. Please save or export your document as .docx or .pdf.');
      return;
    }

    const isPdf = file.type === 'application/pdf' || lowerName.endsWith('.pdf');
    const isDocx = file.type.includes('wordprocessingml') || lowerName.endsWith('.docx');

    if (!isPdf && !isDocx) {
      setError('Only PDF (.pdf) and Word (.docx) documents are supported for upload.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Document file size must be less than 10MB.');
      return;
    }

    // Immediately derive topic from new file name and clear stale outputs
    const newTopic = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
    const reqId = setDocument({
      file,
      filename: file.name,
      fileType: isDocx ? 'docx' : 'pdf',
      text: '',
      topic: newTopic,
      docId: null
    });

    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsExtractingFile(true);
      const res = await aiApi.extractDocument(formData);

      if (!isRequestCurrent(reqId)) return; // Invalidate stale response

      const extracted = res?.extractedText || res?.data?.text || res?.text || '';
      const detectedTopic = res?.topic || res?.data?.topic || newTopic;

      if (extracted && extracted.trim().length >= 10) {
        setDocument({
          file,
          filename: file.name,
          fileType: isDocx ? 'docx' : 'pdf',
          text: extracted,
          topic: detectedTopic,
          docId: null
        });
      } else {
        setError('No readable text could be extracted from this document. If it is a scanned image, OCR is required.');
      }
    } catch (err) {
      if (isRequestCurrent(reqId)) {
        setError(err.message || 'Failed to extract text from document.');
      }
    } finally {
      if (isRequestCurrent(reqId)) {
        setIsExtractingFile(false);
      }
    }
  };

  // Handle quiz generation
  const handleGenerate = async (e) => {
    if (e) e.preventDefault();

    const finalSourceText = (currentDoc.text || sourceText).trim();
    const finalTopic = (currentDoc.topic || topic).trim();

    if (!finalTopic && !finalSourceText) {
      setError('Please provide a topic or study material for the quiz.');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      const res = await quizApi.generate({
        topic: finalTopic || 'General Study Material',
        numQuestions: Number(numQuestions) || 5,
        difficulty,
        sourceText: finalSourceText
      });

      if (res.quiz && Array.isArray(res.quiz.questions) && res.quiz.questions.length > 0) {
        updateQuizData({
          activeQuiz: res.quiz,
          phase: 'taking',
          numQuestions,
          difficulty
        });
      } else {
        setError('The AI service did not produce usable questions. Please try again.');
      }
    } catch (err) {
      setError(err.message || 'Failed to generate quiz. Please check connectivity and try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle quiz submission for server-side grading
  const handleSubmitQuiz = async ({ quizId, answers, timeSpentSeconds }) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const res = await quizApi.submitAttempt({
        quizId,
        answers,
        timeSpentSeconds
      });

      if (res.attempt) {
        updateQuizData({
          latestAttempt: res.attempt,
          phase: 'result'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to submit quiz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Targeted remediation: practice weak topics
  const handlePracticeWeak = async (weakTopicsList) => {
    const weakTopicName = weakTopicsList.join(', ');
    updateTopic(`Revision: ${weakTopicName}`);
    updateQuizData({
      numQuestions: Math.min(5, Math.max(3, weakTopicsList.length * 2)),
      difficulty: 'easy'
    });

    try {
      setIsGenerating(true);
      setError(null);

      const res = await quizApi.generate({
        topic: `Focused Remediation on: ${weakTopicName}`,
        numQuestions: 5,
        difficulty: 'medium',
        sourceText: `Targeted revision quiz focusing on remediating comprehension in these topics: ${weakTopicName}. Key concepts from study notes: ${sourceText.slice(0, 5000)}`
      });

      if (res.quiz) {
        updateQuizData({
          activeQuiz: res.quiz,
          phase: 'taking'
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to generate remediation quiz.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Retake current quiz
  const handleRetake = () => {
    updateQuizData({
      latestAttempt: null,
      phase: 'taking'
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider mb-1">
            <FileQuestion className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Adaptive Assessment Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-charcoal-900 dark:text-ivory-100">
            {phase === 'taking'
              ? 'Quiz in Progress'
              : phase === 'result'
              ? 'Quiz Evaluation & Feedback'
              : 'Smart Quiz Generator'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {phase !== 'setup' && (
            <button
              type="button"
              onClick={() => {
                updateQuizData({ phase: 'setup', activeQuiz: null, latestAttempt: null });
              }}
              className="px-4 py-2 bg-charcoal-100 dark:bg-charcoal-800 hover:bg-charcoal-200 dark:hover:bg-charcoal-700 text-charcoal-800 dark:text-ivory-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>New Quiz Setup</span>
            </button>
          )}

          <Link
            to="/quizzes/history"
            className="px-4 py-2 border border-charcoal-300 dark:border-charcoal-700 hover:bg-charcoal-100 dark:hover:bg-charcoal-800 text-charcoal-800 dark:text-ivory-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" aria-hidden="true" />
            <span>My Quiz History</span>
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {error && <AlertBanner type="error" message={error} onClose={() => setError(null)} />}

      {/* Phase 1: Quiz Generator Setup */}
      {phase === 'setup' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-charcoal-900 rounded-3xl p-6 md:p-8 border border-charcoal-200 dark:border-charcoal-800 shadow-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-600 dark:text-teal-400 mx-auto">
              <Target className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-extrabold text-charcoal-900 dark:text-ivory-100">
              Create Tailored Practice Quiz
            </h2>
            <p className="text-xs text-charcoal-500 max-w-md mx-auto">
              AI crafts high-yield multiple-choice questions grounded in your uploaded document with instant remedial feedback.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="quiz-topic" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                Subject or Specific Topic
              </label>
              <input
                id="quiz-topic"
                type="text"
                required
                value={topic}
                onChange={(e) => updateTopic(e.target.value)}
                placeholder="e.g. Mitochondria & Cellular Respiration, Operating Systems, Microeconomics"
                className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quiz-num" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                  Number of Questions
                </label>
                <select
                  id="quiz-num"
                  value={numQuestions}
                  onChange={(e) => updateQuizData({ numQuestions: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <option value={3}>3 Questions (Quick Check)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={8}>8 Questions (Comprehensive)</option>
                  <option value={10}>10 Questions (Full Assessment)</option>
                </select>
              </div>

              <div>
                <label htmlFor="quiz-difficulty" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                  Difficulty Level
                </label>
                <select
                  id="quiz-difficulty"
                  value={difficulty}
                  onChange={(e) => updateQuizData({ difficulty: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                >
                  <option value="easy">Beginner / Foundational</option>
                  <option value="medium">Intermediate / Conceptual</option>
                  <option value="hard">Advanced / Applied Analysis</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="quiz-text" className="block text-xs font-bold text-charcoal-700 dark:text-charcoal-300 uppercase mb-1">
                Study Material
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-charcoal-700 dark:text-charcoal-300">
                    Upload PDF / Word or Paste Text
                  </span>
                  {(selectedFile || currentDoc.filename || sourceText) && (
                    <button
                      type="button"
                      onClick={clearDocument}
                      className="text-xs font-semibold text-rose-600 hover:underline"
                    >
                      Clear Document
                    </button>
                  )}
                </div>

                {/* Document Upload Area (PDF & DOCX) */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) handleFileUpload(droppedFile);
                  }}
                  className="p-4 bg-ivory-50 dark:bg-charcoal-800 rounded-xl border-2 border-dashed border-charcoal-300 dark:border-charcoal-700 hover:border-teal-500 flex flex-col items-center justify-between gap-3 text-center transition-all"
                >
                  {isExtractingFile ? (
                    <div className="flex flex-col items-center space-y-2 py-3">
                      <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"></span>
                      <span className="text-xs font-semibold text-teal-600">Extracting text from document...</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs text-charcoal-600 dark:text-charcoal-300">
                        {selectedFile || currentDoc.filename ? (
                          <>
                            <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0" />
                            <span className="font-bold truncate max-w-[200px]">
                              {selectedFile ? selectedFile.name : currentDoc.filename}
                            </span>
                            <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                              (Ready)
                            </span>
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5 text-charcoal-400 dark:text-charcoal-500 shrink-0" />
                            <span>Drag & drop PDF or Word (.docx) here, or browse</span>
                          </>
                        )}
                      </div>
                      <label className="cursor-pointer px-4 py-2 bg-white dark:bg-charcoal-900 border border-charcoal-200 dark:border-charcoal-700 hover:border-teal-500 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-300 shadow-sm transition-all inline-flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{selectedFile || currentDoc.filename ? 'Change Document' : 'Browse File (max 10MB)'}</span>
                        <input
                          type="file"
                          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={handleFileUpload}
                          disabled={isExtractingFile}
                          className="sr-only"
                        />
                      </label>
                    </>
                  )}
                </div>

                <textarea
                  id="quiz-text"
                  rows={6}
                  value={sourceText}
                  onChange={(e) => updateText(e.target.value)}
                  placeholder="Or paste textbook excerpts, lecture slides, or study notes here..."
                  className="w-full p-4 rounded-xl border border-charcoal-200 dark:border-charcoal-700 bg-ivory-50/50 dark:bg-charcoal-800 text-sm text-charcoal-900 dark:text-ivory-100 leading-relaxed resize-y focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || (!topic.trim() && !sourceText.trim())}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 focus-visible:ring-4 focus-visible:ring-teal-400 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'AI is Generating Quiz...' : `Generate ${numQuestions}-Question Quiz`}</span>
            </button>
          </form>
        </div>
      )}

      {/* Phase 2: Active Quiz Taking View */}
      {phase === 'taking' && activeQuiz && (
        <QuizTakingView
          quiz={activeQuiz}
          onSubmit={handleSubmitQuiz}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Phase 3: Instant Remedial Evaluation & Diagnostic Review */}
      {phase === 'result' && latestAttempt && (
        <QuizResultView
          attempt={latestAttempt}
          onRetake={handleRetake}
          onPracticeWeak={handlePracticeWeak}
        />
      )}
    </div>
  );
}
