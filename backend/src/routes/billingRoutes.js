import express from 'express';
import { 
  getMeasurements, createMeasurement, updateMeasurement, updateMeasurementStatus,
  getBills, createBill, updateBillStatus 
} from '../controllers/billingController.js';
import { getMySubscriptions, getMyInvoices, submitPayment, getAvailablePlans, requestPlanUpgrade } from '../controllers/tenantBillingController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

// --- Platform Billing Endpoints (Subscriptions & Invoices) ---
router.get('/my-subscriptions', getMySubscriptions);
router.get('/my-invoices', getMyInvoices);
router.post('/submit-payment', submitPayment);
router.get('/available-plans', getAvailablePlans);
router.post('/upgrade-plan', requestPlanUpgrade);

// --- Contractor OS Specific Billing (RA Bills & Measurements) ---

router.route('/measurements')
  .get(getMeasurements)
  .post(createMeasurement);

router.route('/measurements/:id')
  .put(updateMeasurement);

router.patch('/measurements/:id/status', updateMeasurementStatus);

router.route('/ra-bills')
  .get(getBills)
  .post(createBill);

router.patch('/ra-bills/:id/status', updateBillStatus);

export default router;
