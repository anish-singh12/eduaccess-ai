import express from 'express';
import {
  getAiStatus,
  simplifyText,
  generateConceptMap,
  generateQuiz,
  generatePractice
} from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { aiLimiter } from '../middleware/rateLimiter.js';
import { uploadPdfAndExtract } from '../controllers/documentController.js';
import { uploadSinglePdf } from '../middleware/upload.js';
import {
  simplifyTextSchema,
  generateConceptMapSchema,
  generateQuizSchema,
  generatePracticeSchema
} from '../validators/aiValidator.js';

const router = express.Router();

router.get('/status', getAiStatus);

router.use(requireAuth);

router.post('/simplify', aiLimiter, validate(simplifyTextSchema), simplifyText);
router.post('/concept-map', aiLimiter, validate(generateConceptMapSchema), generateConceptMap);
router.post('/quiz', aiLimiter, validate(generateQuizSchema), generateQuiz);
router.post('/practice', aiLimiter, validate(generatePracticeSchema), generatePractice);
router.post('/extract-pdf', aiLimiter, uploadSinglePdf, uploadPdfAndExtract);

export default router;
