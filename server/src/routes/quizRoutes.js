import express from 'express';
import {
  listQuizzes,
  getQuizById,
  createQuiz,
  deleteQuiz
} from '../controllers/quizController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createQuizSchema } from '../validators/quizValidator.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', listQuizzes);
router.get('/:id', getQuizById);
router.post('/', validate(createQuizSchema), createQuiz);
router.delete('/:id', deleteQuiz);

export default router;
