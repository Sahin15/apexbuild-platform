import express from 'express';
import { createSiteReport, getSiteReports, approveSiteReport } from '../controllers/siteReportController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(requireOrganization);

router.route('/')
  .post(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), createSiteReport)
  .get(getSiteReports);

router.post('/:id/approve', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), approveSiteReport);

export default router;
