import express from 'express';
import { getDashboardStats } from '../controllers/distributorDashboardController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.get('/', getDashboardStats);

export default router;
