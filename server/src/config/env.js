import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root, project root, or cwd
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

/**
 * Environment configuration with sensible fallbacks for development.
 * Secrets are kept strictly on the backend.
 */
export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Frontend Origin for CORS and Cookie Scope
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // Parsed array of allowed frontend origins (supports comma-separated CLIENT_ORIGINS)
  CLIENT_ORIGINS: (() => {
    const origins = process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    return origins.split(',').map(o => o.trim()).filter(Boolean);
  })(),

  // Database URI
  MONGODB_URI: process.env.MONGODB_URI || '',

  // JWT & Cookie Secrets
  JWT_SECRET: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-key-eduaccess-ai-change-in-production-2026'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'dev-cookie-secret-eduaccess-2026',

  // AI Provider Configuration (Google Gemini by default)
  AI_PROVIDER: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  AI_API_KEY: (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || process.env.GOOGLE_API_KEY || '').trim(),
  AI_MODEL: (() => {
    const configured = (process.env.AI_MODEL || '').trim().replace(/^models\//, '');
    const legacyModels = [
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite'
    ];
    if (!configured || legacyModels.includes(configured)) {
      return (process.env.AI_PROVIDER || 'gemini').toLowerCase() === 'openai'
        ? 'gpt-4o-mini'
        : 'gemini-3.5-flash-lite';
    }
    return configured;
  })(),
  AI_BASE_URL: process.env.AI_BASE_URL || '',

  // Rate Limits
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 mins
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '200', 10),
  AUTH_RATE_LIMIT_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '30', 10),
  AI_RATE_LIMIT_MAX: parseInt(process.env.AI_RATE_LIMIT_MAX || '20', 10),

  // File Upload Limits
  MAX_FILE_SIZE_BYTES: parseInt(process.env.MAX_FILE_SIZE_BYTES || '5242880', 10) // 5MB
};

/**
 * Validates critical environment configuration on server startup.
 * Does NOT expose raw secret values in the logs.
 */
export function validateEnv() {
  const issues = [];

  if (env.isProduction) {
    if (!env.MONGODB_URI) {
      issues.push('CRITICAL: MONGODB_URI is required in production.');
    }
    if (!env.JWT_SECRET || env.JWT_SECRET.startsWith('dev-secret')) {
      issues.push('CRITICAL: A secure JWT_SECRET must be configured in production.');
    }
  }

  // Diagnostic status report (safe to display)
  console.log('----------------------------------------------------');
  console.log('EduAccess AI Server Configuration Status:');
  console.log(`- Environment:     ${env.NODE_ENV}`);
  console.log(`- Port:            ${env.PORT}`);
  console.log(`- Client Origin:   ${env.CLIENT_ORIGIN}`);
  console.log(`- MongoDB URI:     ${env.MONGODB_URI ? 'Configured [REDACTED]' : 'MISSING / NOT SET'}`);
  console.log(`- JWT Secret:      ${env.JWT_SECRET ? 'Configured [REDACTED]' : 'MISSING'}`);
  console.log(`- AI Provider:     ${env.AI_PROVIDER}`);
  console.log(`- AI Model:        ${env.AI_MODEL}`);
  console.log(`- AI API Key:      ${env.AI_API_KEY ? 'Configured [REDACTED]' : 'Not configured (AI features disabled)'}`);
  console.log('----------------------------------------------------');

  if (issues.length > 0) {
    issues.forEach(issue => console.error(`[ENV ERROR] ${issue}`));
    if (env.isProduction) {
      throw new Error('Server startup aborted due to invalid environment configuration.');
    }
  }
}
