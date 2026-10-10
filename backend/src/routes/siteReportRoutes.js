import express from 'express';
import { 
  createSiteReport, 
  getSiteReports, 
  getSiteReportById,
  updateSiteReport,
  deleteSiteReport,
  approveSiteReport, 
  rejectSiteReport,
  getDPRSummary 
} from '../controllers/siteReportController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(requireOrganization);

router.get('/summary', getDPRSummary);

router.route('/')
  .post(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), createSiteReport)
  .get(getSiteReports);

router.route('/:id')
  .get(getSiteReportById)
  .put(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), updateSiteReport)
  .delete(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), deleteSiteReport);

router.post('/:id/approve', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), approveSiteReport);
router.post('/:id/reject', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), rejectSiteReport);

export default router;

