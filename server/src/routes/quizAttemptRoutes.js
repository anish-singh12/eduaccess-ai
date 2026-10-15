import express from 'express';
import {
  submitQuizAttempt,
  listUserAttempts,
  getAttemptById
} from '../controllers/quizAttemptController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { submitQuizAttemptSchema } from '../validators/quizValidator.js';

const router = express.Router();

router.use(requireAuth);

router.post('/', validate(submitQuizAttemptSchema), submitQuizAttempt);
router.get('/', listUserAttempts);
router.get('/:id', getAttemptById);

export default router;
