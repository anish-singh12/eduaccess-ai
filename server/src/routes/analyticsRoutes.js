import express from 'express';
import { getDashboardAnalytics, getAdminUserGrowth } from '../controllers/analyticsController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/dashboard', getDashboardAnalytics);
router.get('/admin/user-growth', getAdminUserGrowth);

export default router;
