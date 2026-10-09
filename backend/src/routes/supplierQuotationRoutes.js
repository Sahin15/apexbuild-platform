import express from 'express';
import { 
  getQuotations, 
  createQuotation,
  updateQuotationStatus,
  deleteQuotation
} from '../controllers/supplierQuotationController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.route('/')
  .get(getQuotations)
  .post(createQuotation);

router.route('/:id/status')
  .patch(updateQuotationStatus);

router.route('/:id')
  .delete(deleteQuotation);

export default router;
