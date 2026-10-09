import express from 'express';
import { 
  getInvoices, 
  createInvoice
} from '../controllers/supplierInvoiceController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.route('/')
  .get(getInvoices)
  .post(createInvoice);

export default router;
