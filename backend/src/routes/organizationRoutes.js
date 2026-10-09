import express from 'express';
import { getOrganization, updateOrganization } from '../controllers/organizationController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);

router.route('/')
  .get(getOrganization)
  .put(authorize('OWNER', 'ADMIN'), updateOrganization)
  .patch(authorize('OWNER', 'ADMIN'), updateOrganization);

export default router;
