import express from 'express';
import { getProjectCostReport, getRABillingSummary, getProfitabilityReport } from '../controllers/reportController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);
router.use(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'));

router.get('/project-cost', getProjectCostReport);
router.get('/ra-billing', getRABillingSummary);
router.get('/profitability', getProfitabilityReport);

export default router;
