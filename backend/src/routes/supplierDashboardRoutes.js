import express from 'express';
import { getDashboardStats } from '../controllers/supplierDashboardController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT'));

router.get('/', getDashboardStats);

export default router;
