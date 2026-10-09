import express from 'express';
import { getSales, createSale } from '../controllers/distributorSaleController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES', 'DELIVERY_STAFF'));

router.route('/')
  .get(getSales)
  .post(createSale);

export default router;
