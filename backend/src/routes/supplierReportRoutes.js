import express from 'express';
import { getFinancialSummary } from '../controllers/supplierReportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT'));

router.get('/financials', getFinancialSummary);

export default router;
