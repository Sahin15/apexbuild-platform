import express from 'express';
import { 
  getPayments, 
  createPayment
} from '../controllers/supplierPaymentController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT'));

router.route('/')
  .get(getPayments)
  .post(createPayment);

export default router;
