import express from 'express';
import { 
  getCustomers, 
  createCustomer, 
  getCustomer, 
  updateCustomer, 
  deleteCustomer 
} from '../controllers/supplierCustomerController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
// Restrict all to supplier roles who have access to customers
router.use(authorize('OWNER', 'ADMIN', 'SALES', 'ACCOUNTANT'));

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
