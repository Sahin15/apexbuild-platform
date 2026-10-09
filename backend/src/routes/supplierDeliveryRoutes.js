import express from 'express';
import { 
  getDeliveries, 
  createDelivery,
  updateDeliveryStatus
} from '../controllers/supplierDeliveryController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.route('/')
  .get(getDeliveries)
  .post(createDelivery);

router.route('/:id/status')
  .patch(updateDeliveryStatus);

export default router;
