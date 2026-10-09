import express from 'express';
import { getStock, getStockLedger } from '../controllers/distributorStockController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.get('/', getStock);
router.get('/ledger', getStockLedger);

export default router;
