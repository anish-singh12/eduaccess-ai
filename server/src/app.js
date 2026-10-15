import express from 'express';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { isDatabaseConnected } from './config/db.js';
import { isAiConfigured } from './services/aiService.js';
import { helmetMiddleware, corsMiddleware, csrfProtection } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import conceptMapRoutes from './routes/conceptMapRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import quizAttemptRoutes from './routes/quizAttemptRoutes.js';
import insightRoutes from './routes/insightRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

const app = express();

// 1. Trust proxy if behind a reverse proxy (e.g. Nginx, Heroku, Render)
app.set('trust proxy', 1);

// 2. Security Middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);

// 3. Body Parsing & Cookie Middleware
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser(env.COOKIE_SECRET));

// 4. CSRF Protection for state-mutating requests
app.use(csrfProtection);

// 5. Global API Rate Limiter
app.use('/api', apiLimiter);

// 6. Comprehensive Healthcheck Endpoint
app.get('/api/health', (req, res) => {
  const dbConnected = isDatabaseConnected();
  const aiReady = isAiConfigured();

  res.status(200).json({
    success: true,
    data: {
      status: 'healthy',
      app: 'EduAccess AI Platform API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
      services: {
        database: {
          connected: dbConnected,
          status: dbConnected ? 'ready' : 'disconnected'
        },
        ai: {
          configured: aiReady,
          provider: env.AI_PROVIDER,
          model: env.AI_MODEL
        }
      }
    }
  });
});

// 7. API Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/concept-maps', conceptMapRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/attempts', quizAttemptRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);

// 8. 404 and Global Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
