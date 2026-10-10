import express from 'express';
import { 
  getDocuments, 
  getVaultSummary, 
  createDocument, 
  uploadRevision, 
  updateDocument, 
  deleteDocument 
} from '../controllers/documentController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';
import { requireFeature } from '../middlewares/entitlementMiddleware.js';

const router = express.Router({ mergeParams: true }); // Important for nested route

router.use(protect);
router.use(requireOrganization);
router.use(requireFeature('drawingVault'));

router.get('/summary', getVaultSummary);

router.route('/')
  .get(getDocuments)
  .post(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), createDocument);

router.post('/:id/revision', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), uploadRevision);

router.route('/:id')
  .patch(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), updateDocument)
  .delete(authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), deleteDocument);

export default router;
