import express from 'express';
import { getDocuments, createDocument, deleteDocument } from '../controllers/documentController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true }); // Important for nested route

router.use(protect);
router.use(requireOrganization);

router.route('/')
  .get(getDocuments)
  .post(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), createDocument);

router.route('/:id')
  .delete(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), deleteDocument);

export default router;
