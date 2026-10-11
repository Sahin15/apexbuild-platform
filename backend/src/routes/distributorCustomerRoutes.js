import express from 'express';
import { 
  getCustomers, 
  createCustomer, 
  getCustomer, 
  updateCustomer, 
  addCustomerLog,
  getCustomerLedger,
  recordCustomerPayment
} from '../controllers/distributorCustomerController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.route('/')
  .get(getCustomers)
  .post(createCustomer);

router.route('/:id/ledger')
  .get(getCustomerLedger);

router.route('/:id/payments')
  .post(recordCustomerPayment);

router.route('/:id')
  .get(getCustomer)
  .put(updateCustomer);

router.post('/:id/logs', addCustomerLog);

export default router;
