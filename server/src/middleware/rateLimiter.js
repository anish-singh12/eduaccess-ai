import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const standardKeyGenerator = (req) => {
  return req.ip || req.headers['x-forwarded-for'] || 'unknown';
};

/**
 * Global rate limiter for standard API routes
 */
export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: standardKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down and try again in a few minutes.'
    }
  }
});

/**
 * Strict rate limiter for Authentication endpoints (prevent credential brute-force)
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: standardKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Too many login or registration attempts. Please try again after 15 minutes.'
    }
  }
});

/**
 * Rate limiter for computationally expensive AI operations
 */
export const aiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AI_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: standardKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT_EXCEEDED',
      message: 'AI request limit reached for this session window. Please wait a few minutes before generating more content.'
    }
  }
});

/**
 * Rate limiter for File Upload endpoints
 */
export const uploadLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: standardKeyGenerator,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads in a short period. Please wait a few moments.'
    }
  }
});
