import express from 'express';
import { 
  getVendors, 
  createVendor, 
  getVendor, 
  updateVendor, 
  deleteVendor 
} from '../controllers/supplierVendorController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'PURCHASE', 'ACCOUNTANT'));

router.route('/')
  .get(getVendors)
  .post(createVendor);

router.route('/:id')
  .get(getVendor)
  .put(updateVendor)
  .delete(deleteVendor);

export default router;
