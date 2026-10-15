import { User } from '../models/User.js';
import { Document } from '../models/Document.js';
import { ConceptMap } from '../models/ConceptMap.js';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/token.js';
import { logger } from '../utils/logger.js';
import { isDatabaseConnected } from '../config/db.js';

/**
 * Register a new student account
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database is currently unavailable. Please verify your MongoDB Atlas connection in server/.env.'
        }
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'EMAIL_IN_USE',
          message: 'An account with this email address already exists. Please log in instead.'
        }
      });
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash
    });

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    });

    setAuthCookie(res, token);
    logger.info(`New student registered: email=${user.email}`);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: user.toSafeJSON(),
        token // Provided for Bearer auth fallback
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log in to an existing account
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'DATABASE_UNAVAILABLE',
          message: 'Database connection is not ready. Please check MongoDB Atlas configuration.'
        }
      });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.'
        }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email address or password.'
        }
      });
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name
    });

    setAuthCookie(res, token);
    logger.info(`User logged in: email=${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeJSON(),
        token
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log out and clear authentication cookie
 */
export async function logout(req, res) {
  clearAuthCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.'
  });
}

/**
 * Get current authenticated user details and preferences
 */
export async function getMe(req, res) {
  const safeUser = req.user.toSafeJSON ? req.user.toSafeJSON() : req.user;
  res.status(200).json({
    success: true,
    data: {
      user: safeUser
    }
  });
}

/**
 * Update user profile or preferences
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, themePreference, accessibilityPreferences } = req.body;
    const userId = req.user._id;

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' }
      });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (themePreference) updateFields.themePreference = themePreference;
    if (accessibilityPreferences) {
      updateFields.accessibilityPreferences = {
        ...req.user.accessibilityPreferences?.toObject?.() || {},
        ...accessibilityPreferences
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: updatedUser.toSafeJSON()
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete account and cascade delete all user-owned records (Documents, ConceptMaps, Quizzes, Attempts)
 */
export async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: { code: 'DATABASE_UNAVAILABLE', message: 'Database unavailable' }
      });
    }

    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Incorrect password. Account deletion aborted.'
        }
      });
    }

    // Cascade deletion of all associated user data
    await Promise.all([
      Document.deleteMany({ userId }),
      ConceptMap.deleteMany({ userId }),
      Quiz.deleteMany({ userId }),
      QuizAttempt.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    clearAuthCookie(res);
    logger.info(`User account and all associated records deleted: userId=${userId}`);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated study data have been permanently deleted.'
    });
  } catch (err) {
    next(err);
  }
}
