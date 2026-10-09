import express from 'express';
import { createBOQ, getProjectBOQ } from '../controllers/boqController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(requireOrganization);

router.route('/')
  .post(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), createBOQ)
  .get(getProjectBOQ);

export default router;
