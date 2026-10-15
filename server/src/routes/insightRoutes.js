import express from 'express';
import { getUserInsights } from '../controllers/insightController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', getUserInsights);

export default router;
