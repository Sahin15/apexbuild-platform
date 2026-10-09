import express from 'express';
import { 
  getPurchases, 
  createPurchase, 
  getPurchase,
  receivePurchaseStock
} from '../controllers/supplierPurchaseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'PURCHASE', 'STORE_MANAGER', 'ACCOUNTANT'));

router.route('/')
  .get(getPurchases)
  .post(createPurchase);

router.route('/:id')
  .get(getPurchase);

router.post('/:id/receive', receivePurchaseStock);

export default router;
