import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { generateToken, verifyToken } from '../src/utils/token.js';
import { isValidObjectId, sanitizeQueryInput } from '../src/utils/sanitize.js';

describe('1. System Healthcheck API', () => {
  it('GET /api/health should return 200 with system status and service details', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.app).toBe('EduAccess AI Platform API');
    expect(res.body.data.services).toBeDefined();
  });
});

describe('2. Security and Token Utilities', () => {
  it('should generate and verify valid JWT tokens correctly', () => {
    const payload = { userId: '507f1f77bcf86cd799439011', email: 'student@example.com', name: 'Test Student' };
    const token = generateToken(payload);
    expect(token).toBeTypeOf('string');

    const decoded = verifyToken(token);
    expect(decoded).toBeDefined();
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('should reject invalid or tampered JWT tokens', () => {
    const decoded = verifyToken('invalid.token.structure');
    expect(decoded).toBeNull();
  });

  it('should validate MongoDB ObjectIds accurately', () => {
    expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    expect(isValidObjectId('invalid-id')).toBe(false);
    expect(isValidObjectId('')).toBe(false);
    expect(isValidObjectId(null)).toBe(false);
    expect(isValidObjectId(12345)).toBe(false);
  });

  it('should sanitize query input against NoSQL injection patterns', () => {
    const dangerousInput = {
      email: { $gt: '' },
      'user.password': 'hacked',
      normalField: 'cleanValue'
    };
    const cleaned = sanitizeQueryInput(dangerousInput);
    expect(cleaned).toEqual({ normalField: 'cleanValue' });
  });
});

describe('3. Authentication Validation & Protection', () => {
  it('POST /api/auth/register should reject missing required fields', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'student@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/auth/register should reject weak passwords (< 8 characters)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student Name',
        email: 'student@example.com',
        password: 'weak'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.details.some(d => d.field === 'password')).toBe(true);
  });

  it('GET /api/documents should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('4. Learning Insights Engine Unit Logic', () => {
  it('should compute insights gracefully when attempts list is empty', async () => {
    const { calculateUserInsights } = await import('../src/services/insightsService.js');
    // Call with random ID when DB is not connected or returns empty
    const result = await calculateUserInsights('507f1f77bcf86cd799439011');
    expect(result).toBeDefined();
    expect(result.summary.totalAttempts).toBe(0);
    expect(result.summary.overallAccuracy).toBe(0);
    expect(result.strongTopics).toEqual([]);
    expect(result.weakTopics).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });
});
