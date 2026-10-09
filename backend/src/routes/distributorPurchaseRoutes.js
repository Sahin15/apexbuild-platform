import express from 'express';
import { getPurchases, createPurchase, deletePurchase, updatePurchase } from '../controllers/distributorPurchaseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.route('/')
  .get(getPurchases)
  .post(createPurchase);

router.route('/:id')
  .put(updatePurchase)
  .delete(deletePurchase);

export default router;
