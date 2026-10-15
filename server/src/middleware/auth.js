import { verifyToken, COOKIE_NAME } from '../utils/token.js';
import { User } from '../models/User.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * Authentication middleware that verifies JWT from cookies or Authorization header.
 * Attaches the authenticated user object to req.user.
 */
export async function requireAuth(req, res, next) {
  try {
    let token = req.cookies?.[COOKIE_NAME];

    // Also support Bearer token in Authorization header
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in to continue.'
        }
      });
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session expired or invalid. Please log in again.'
        }
      });
    }

    // If database is connected, fetch full active user; otherwise use token claims
    if (isDatabaseConnected()) {
      const user = await User.findById(decoded.userId).select('-passwordHash');
      if (!user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User account no longer exists.'
          }
        });
      }
      req.user = user;
    } else {
      req.user = {
        _id: decoded.userId,
        name: decoded.name || 'Student',
        email: decoded.email
      };
    }

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Authentication verification failed.'
      }
    });
  }
}

/**
 * Optional authentication middleware: parses user if token exists, but doesn't block unauthenticated requests.
 */
export async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies?.[COOKIE_NAME];
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded?.userId && isDatabaseConnected()) {
        const user = await User.findById(decoded.userId).select('-passwordHash');
        if (user) {
          req.user = user;
        }
      }
    }
  } catch {
    // Ignore error in optional auth
  }
  next();
}
