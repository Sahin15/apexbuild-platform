import express from 'express';
import { createTask, getTasks, updateTask, logTaskProgress, deleteTask } from '../controllers/taskController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(requireOrganization);

router.route('/')
  .get(getTasks)
  .post(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), createTask);

router.route('/:id')
  .patch(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), updateTask)
  .delete(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), deleteTask);

router.patch('/:id/progress', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), logTaskProgress);

export default router;
