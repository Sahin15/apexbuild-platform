import express from 'express';
import { 
  getDocuments, 
  createDocument,
  deleteDocument
} from '../controllers/supplierDocumentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.route('/')
  .get(getDocuments)
  .post(createDocument);

router.route('/:id')
  .delete(deleteDocument);

export default router;
