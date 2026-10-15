import multer from 'multer';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * 404 Route Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `The requested endpoint ${req.method} ${req.originalUrl} was not found on this server.`
    }
  });
}

/**
 * Centralized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  logger.error(`Unhandled Error [${req.method} ${req.url}]: ${err.message}`, {
    stack: env.isProduction ? undefined : err.stack
  });

  // 1. Multer file upload errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `The uploaded PDF exceeds the maximum allowed size of ${env.MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB.`
        }
      });
    }
    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message || 'Error occurred while processing file upload.'
      }
    });
  }

  // 2. Custom file filter errors from Multer
  if (err.message && err.message.startsWith('INVALID_FILE_TYPE')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only text-based PDF documents (.pdf) are supported.'
      }
    });
  }

  // 3. Mongoose Validation Errors
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: messages[0] || 'Database validation failed',
        details: messages
      }
    });
  }

  // 4. Mongoose Duplicate Key Error (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_RECORD',
        message: `An account with that ${field} already exists. Please log in or use a different ${field}.`
      }
    });
  }

  // 5. Mongoose Cast Error (Invalid ObjectId in params)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'The provided resource ID is invalid.'
      }
    });
  }

  // 6. JSON parse syntax error in request body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Malformed JSON payload in request body.'
      }
    });
  }

  // 7. General internal server errors
  const statusCode = err.status || err.statusCode || 500;
  const message = env.isProduction && statusCode === 500
    ? 'An unexpected internal server error occurred. Please try again later.'
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message
    }
  });
}
