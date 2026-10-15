import { Quiz } from '../models/Quiz.js';
import { isValidObjectId } from '../utils/sanitize.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * List all quizzes created by or assigned to the user
 */
export async function listQuizzes(req, res, next) {
  try {
    const userId = req.user._id;

    if (!isDatabaseConnected()) {
      return res.status(200).json({
        success: true,
        data: { quizzes: [], total: 0 }
      });
    }

    const quizzes = await Quiz.find({ userId })
      .select('title topic difficulty questionCount documentId createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        quizzes,
        total: quizzes.length
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get quiz by ID for student to take (answers & explanations stripped by default)
 */
export async function getQuizById(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const { mode } = req.query; // 'review' or 'take'

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid quiz ID' }
      });
    }

    const quiz = await Quiz.findOne({ _id: id, userId });
    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found or access denied.' }
      });
    }

    // When mode is review, allow creator to see answers. Otherwise deliver student view without answers.
    const responseData = mode === 'review'
      ? quiz.toJSON()
      : quiz.toStudentView();

    res.status(200).json({
      success: true,
      data: { quiz: responseData }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Save a newly generated or custom quiz
 */
export async function createQuiz(req, res, next) {
  try {
    const userId = req.user._id;
    const { title, topic, difficulty, documentId, questions } = req.body;

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is not connected.' }
      });
    }

    const quiz = await Quiz.create({
      userId,
      documentId: documentId || null,
      title,
      topic: topic || 'General',
      difficulty: difficulty || 'medium',
      questions,
      questionCount: questions.length
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: { quiz }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete a quiz
 */
export async function deleteQuiz(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid quiz ID' }
      });
    }

    const deleted = await Quiz.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quiz not found or access denied.' }
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
}
