import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'eduaccess_token';

/**
 * Generates a signed JWT for an authenticated user
 */
export function generateToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

/**
 * Verifies a JWT and returns the decoded payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    return null;
  }
}

/**
 * Sets an HttpOnly, SameSite cookie containing the auth JWT
 */
export function setAuthCookie(res, token) {
  const isProduction = env.isProduction;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
  });
}

/**
 * Clears the auth cookie on logout
 */
export function clearAuthCookie(res) {
  const isProduction = env.isProduction;

  res.cookie(COOKIE_NAME, '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
    path: '/'
  });
}
