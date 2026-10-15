import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  deleteAccount
} from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  deleteAccountSchema
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);

router.get('/me', requireAuth, getMe);
router.put('/profile', requireAuth, validate(updateProfileSchema), updateProfile);
router.delete('/account', requireAuth, validate(deleteAccountSchema), deleteAccount);

export default router;
