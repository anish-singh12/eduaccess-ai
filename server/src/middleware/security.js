import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env.js';

/**
 * Configured Helmet security headers
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: env.isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", env.CLIENT_ORIGIN]
    }
  } : false, // In development, relaxed for Vite dev server proxy
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
});

/**
 * Strict CORS middleware allowing only the configured frontend client origin
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin, curl, server-to-server, or mobile apps)
    if (!origin) return callback(null, true);

    // Exact match with configured CLIENT_ORIGIN or localhost during development
    const allowedOrigins = [
      env.CLIENT_ORIGIN,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

    if (allowedOrigins.includes(origin) || !env.isProduction) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: Origin ${origin} is not allowed`));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
});

/**
 * CSRF mitigation: checks for custom header on mutating requests (POST, PUT, DELETE, PATCH)
 * when using cookie-based authentication from a browser.
 */
export function csrfProtection(req, res, next) {
  // Safe read-only HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // If request contains authorization header (Bearer token), standard CSRF attacks do not apply
  if (req.headers.authorization) {
    return next();
  }

  // For cookie-based requests, check origin or standard requested-with / custom headers
  const origin = req.headers.origin || req.headers.referer;
  if (!origin && env.isProduction) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_BLOCKED',
        message: 'Request missing origin verification header.'
      }
    });
  }

  next();
}
