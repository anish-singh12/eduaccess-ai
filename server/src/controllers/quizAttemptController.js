import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { isValidObjectId } from '../utils/sanitize.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * Submit quiz answers, score server-side, and save attempt
 */
export async function submitQuizAttempt(req, res, next) {
  try {
    const userId = req.user._id;
    const { quizId, answers, timeSpentSeconds } = req.body;

    if (!isValidObjectId(quizId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid quiz ID' }
      });
    }

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is not connected.' }
      });
    }

    const quiz = await Quiz.findOne({ _id: quizId, userId }).lean();
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found or access denied.' }
      });
    }

    // Build question lookup map for O(1) matching
    const questionMap = new Map();
    quiz.questions.forEach(q => {
      questionMap.set(String(q.id || q._id), q);
    });

    let score = 0;
    const gradedAnswers = [];
    const topicStats = {};

    quiz.questions.forEach((q, idx) => {
      const qKey = String(q.id || q._id);
      const userSubmission = (answers || []).find(a => String(a.questionId) === qKey || String(a.questionId) === String(idx + 1));
      const selectedOption = userSubmission !== undefined && userSubmission.selectedOption !== undefined
        ? userSubmission.selectedOption
        : -1;

      const isCorrect = selectedOption === q.correctAnswer;
      if (isCorrect) {
        score += 1;
      }

      const topicTag = q.topicTag || quiz.topic || 'General';
      if (!topicStats[topicTag]) {
        topicStats[topicTag] = { total: 0, correct: 0 };
      }
      topicStats[topicTag].total += 1;
      if (isCorrect) {
        topicStats[topicTag].correct += 1;
      }

      gradedAnswers.push({
        questionId: qKey,
        questionText: q.question,
        options: q.options || [],
        selectedOption,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation || '',
        topicTag
      });
    });

    const topicPerformance = Object.entries(topicStats).map(([tag, stat]) => ({
      topicTag: tag,
      total: stat.total,
      correct: stat.correct,
      percentage: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
    }));

    const totalQuestions = quiz.questions.length;
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    const attempt = await QuizAttempt.create({
      userId,
      quizId: quiz._id,
      quizTitle: quiz.title,
      difficulty: quiz.difficulty || 'medium',
      score,
      totalQuestions,
      percentage,
      topicPerformance,
      timeSpentSeconds: timeSpentSeconds || 0,
      answers: gradedAnswers
    });

    const attemptPayload = {
      _id: attempt._id,
      quizId: attempt.quizId,
      quizTitle: attempt.quizTitle,
      difficulty: attempt.difficulty,
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      topicPerformance: attempt.topicPerformance,
      timeSpentSeconds: attempt.timeSpentSeconds,
      answers: gradedAnswers,
      createdAt: attempt.createdAt
    };

    res.status(201).json({
      success: true,
      message: `Quiz completed! You scored ${score}/${totalQuestions} (${percentage}%).`,
      attempt: attemptPayload,
      data: {
        attempt: attemptPayload
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * List all quiz attempts for the authenticated student
 */
export async function listUserAttempts(req, res, next) {
  try {
    const userId = req.user._id;

    if (!isDatabaseConnected()) {
      return res.status(200).json({
        success: true,
        attempts: [],
        data: { attempts: [], total: 0 }
      });
    }

    const attempts = await QuizAttempt.find({ userId })
      .select('quizId quizTitle difficulty score totalQuestions percentage topicPerformance answers timeSpentSeconds createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      attempts,
      data: {
        attempts,
        total: attempts.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get single quiz attempt by ID with full graded question breakdown
 */
export async function getAttemptById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid attempt ID' }
      });
    }

    const attempt = await QuizAttempt.findOne({ _id: id, userId }).lean();
    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz attempt not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      attempt,
      data: { attempt }
    });
  } catch (err) {
    next(err);
  }
}
