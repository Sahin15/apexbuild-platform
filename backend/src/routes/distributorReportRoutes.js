import express from 'express';
import { getReportSummary } from '../controllers/distributorReportController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT'));

router.get('/summary', getReportSummary);

export default router;
