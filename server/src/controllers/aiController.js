import {
  simplifyNotes,
  generateConceptMapAi,
  generateQuizAi,
  generateTargetedPracticeAi,
  isAiConfigured
} from '../services/aiService.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Standardized error handling for all AI endpoints.
 * Never returns fabricated quiz, map, or notes data upon failure.
 */
function handleAiError(res, err, next) {
  const message = err.message || 'An unexpected error occurred during AI processing.';
  logger.error(`AI Controller Error: ${message}`);

  if (message.startsWith('AI_NOT_CONFIGURED')) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'AI_NOT_CONFIGURED',
        message: 'AI Provider is not configured. Please add AI_API_KEY or GEMINI_API_KEY to server/.env.'
      }
    });
  }

  if (message.startsWith('INVALID_INPUT')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message
      }
    });
  }

  if (message.startsWith('AI_RATE_LIMIT')) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT',
        message
      }
    });
  }

  if (message.startsWith('AI_OVERLOADED')) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'AI_OVERLOADED',
        message
      }
    });
  }

  if (message.startsWith('AI_TIMEOUT')) {
    return res.status(504).json({
      success: false,
      error: {
        code: 'AI_TIMEOUT',
        message
      }
    });
  }

  if (
    message.startsWith('AI_MODEL_UNAVAILABLE') ||
    message.startsWith('AI_EMPTY_RESPONSE') ||
    message.startsWith('AI_INVALID_JSON') ||
    message.startsWith('AI_VALIDATION_ERROR') ||
    message.startsWith('AI_GENERATION_FAILED') ||
    message.startsWith('AI_PROCESSING_ERROR')
  ) {
    const code = message.split(':')[0].trim();
    return res.status(502).json({
      success: false,
      error: {
        code,
        message
      }
    });
  }

  next(err);
}

/**
 * Check AI service configuration status (safe for clients, zero secrets exposed)
 */
export async function getAiStatus(req, res) {
  const configured = isAiConfigured();
  res.status(200).json({
    success: true,
    data: {
      configured,
      provider: env.AI_PROVIDER || 'gemini',
      model: env.AI_MODEL || 'gemini-3.5-flash-lite',
      message: configured
        ? `AI Provider configured (${env.AI_PROVIDER || 'gemini'}). Ready for generation.`
        : 'AI features are in setup mode. Please configure AI_API_KEY or GEMINI_API_KEY in server/.env.'
    }
  });
}

/**
 * Generate simplified notes with key points and definitions
 */
export async function simplifyText(req, res, next) {
  try {
    const { text, targetAudience } = req.body;
    const result = await simplifyNotes(text, targetAudience);

    res.status(200).json({
      success: true,
      message: 'Notes simplified successfully',
      data: result,
      result
    });
  } catch (err) {
    handleAiError(res, err, next);
  }
}

/**
 * Generate interactive concept map (nodes and edges)
 */
export async function generateConceptMap(req, res, next) {
  try {
    const { text, title, topic } = req.body;
    const result = await generateConceptMapAi(text, title || topic);

    res.status(200).json({
      success: true,
      message: 'Concept map generated successfully',
      data: result,
      conceptMap: result
    });
  } catch (err) {
    handleAiError(res, err, next);
  }
}

/**
 * Generate quiz questions
 */
export async function generateQuiz(req, res, next) {
  try {
    const { text, numQuestions, difficulty, topic } = req.body;
    const result = await generateQuizAi(text, numQuestions, difficulty, topic);

    res.status(200).json({
      success: true,
      message: 'Quiz generated successfully',
      data: result,
      quiz: result
    });
  } catch (err) {
    handleAiError(res, err, next);
  }
}

/**
 * Generate targeted practice questions from weak topics
 */
export async function generatePractice(req, res, next) {
  try {
    const { weakTopics, numQuestions, difficulty } = req.body;
    const result = await generateTargetedPracticeAi(weakTopics, numQuestions, difficulty);

    res.status(200).json({
      success: true,
      message: 'Targeted remediation practice generated successfully',
      data: result,
      quiz: result
    });
  } catch (err) {
    handleAiError(res, err, next);
  }
}
