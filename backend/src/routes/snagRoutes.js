import express from 'express';
import {
  getSnags,
  createSnag,
  updateSnag,
  deleteSnag,
  getSnagsSummary
} from '../controllers/snagController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);

router.get('/summary', getSnagsSummary);
router.get('/', getSnags);
router.post('/', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR'), createSnag);
router.patch('/:id', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR'), updateSnag);
router.delete('/:id', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), deleteSnag);

export default router;
