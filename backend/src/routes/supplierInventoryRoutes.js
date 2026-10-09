import express from 'express';
import { 
  getInventory, 
  getProductLedger
} from '../controllers/supplierInventoryController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'STORE_MANAGER', 'SALES', 'PURCHASE'));

router.get('/', getInventory);
router.get('/:productId/ledger', getProductLedger);

export default router;
