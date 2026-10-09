import express from 'express';
import { 
  getOrders, 
  createOrder,
  updateOrderStatus
} from '../controllers/supplierOrderController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'SALES', 'STORE_MANAGER', 'ACCOUNTANT'));

router.route('/')
  .get(getOrders)
  .post(createOrder);

router.route('/:id/status')
  .patch(updateOrderStatus);

export default router;
