import express from 'express';
import { 
  getProjectCostReport, 
  getRABillingSummary, 
  getProfitabilityReport,
  getCashFlowAndPnLSnapshot 
} from '../controllers/reportController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';
import { requireFeature } from '../middlewares/entitlementMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);
router.use(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'));

router.get('/cashflow-pnl', requireFeature('civilPnL'), getCashFlowAndPnLSnapshot);
router.get('/project-cost', getProjectCostReport);
router.get('/ra-billing', getRABillingSummary);
router.get('/profitability', getProfitabilityReport);

export default router;
