import express from 'express';
import { getDashboardOverview } from '../controllers/dashboardController.js';
import { protect, requireOrganization } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);

router.get('/overview', getDashboardOverview);

export default router;
