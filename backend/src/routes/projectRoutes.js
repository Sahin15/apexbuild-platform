import express from 'express';
import { createProject, getProjects, getProject, updateProject, deleteProject } from '../controllers/projectController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';
import { enforceProjectLimit } from '../middlewares/entitlementMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);

router.route('/')
  .get(getProjects)
  .post(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), enforceProjectLimit, createProject);

router.route('/:id')
  .get(getProject)
  .patch(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), updateProject)
  .put(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), updateProject)
  .delete(authorize('OWNER', 'ADMIN'), deleteProject);

export default router;
