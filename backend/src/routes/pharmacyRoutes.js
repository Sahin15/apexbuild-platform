import express from 'express';
import { protect, requireOrganization } from '../middlewares/authMiddleware.js';
import * as pharmacyController from '../controllers/pharmacyController.js';

const router = express.Router();

// Enforce authentication & tenant boundary across all pharmacy endpoints
router.use(protect);
router.use(requireOrganization);

// Pharmacy Dashboard Live Analytics
router.get('/dashboard', pharmacyController.getDashboardAnalytics);

// Medicines Master Formulary Routes
router.route('/medicines')
  .get(pharmacyController.getMedicines)
  .post(pharmacyController.createMedicine);

router.route('/medicines/:id')
  .get(pharmacyController.getMedicineById)
  .patch(pharmacyController.updateMedicine);

// Batch Inventory & FEFO Routes
router.get('/inventory/batches', pharmacyController.getBatches);
router.post('/inventory/batches/:id/adjust', pharmacyController.adjustBatchStock);
router.post('/inventory/batches/:id/quarantine', pharmacyController.toggleBatchQuarantine);

// Authorized Suppliers / Distributors Directory
router.route('/suppliers')
  .get(pharmacyController.getSuppliers)
  .post(pharmacyController.createSupplier);

// Procurement: Purchase Orders (PO) Routes
router.route('/purchases/pos')
  .get(pharmacyController.getPurchaseOrders)
  .post(pharmacyController.createPurchaseOrder);

router.route('/purchases/pos/:id')
  .get(pharmacyController.getPurchaseOrderById);

router.patch('/purchases/pos/:id/status', pharmacyController.updatePOStatus);

// Procurement: Goods Received Notes (GRN) Inwarding Routes
router.route('/purchases/grn')
  .get(pharmacyController.getGoodsReceivedNotes)
  .post(pharmacyController.createGoodsReceivedNote);

router.route('/purchases/grn/:id')
  .get(pharmacyController.getGRNById);

router.post('/purchases/grn/:id/payment', pharmacyController.recordGRNPayment);

// Point of Sale & Customer Invoicing Routes
router.route('/sales')
  .get(pharmacyController.getSales)
  .post(pharmacyController.createSale);

router.get('/sales/schedule-register', pharmacyController.getScheduleRegister);

router.route('/sales/returns')
  .get(pharmacyController.getSalesReturns)
  .post(pharmacyController.createSalesReturn);

router.route('/sales/:id')
  .get(pharmacyController.getSaleById);

// Patient Directory, Chronic Refills & Khata Credit Ledger Routes
router.route('/customers')
  .get(pharmacyController.getCustomers)
  .post(pharmacyController.createCustomer);

router.get('/customers/refill-alerts', pharmacyController.getRefillAlerts);

router.route('/customers/:id')
  .get(pharmacyController.getCustomerById)
  .patch(pharmacyController.updateCustomer);

router.post('/customers/:id/khata-payment', pharmacyController.recordKhataPayment);

// Phase 6: Expiry Surveillance, Supplier Debit Notes & Statutory Destruction
router.get('/inventory/expiry-analytics', pharmacyController.getBatchExpiryAnalytics);

router.route('/debit-notes')
  .get(pharmacyController.getDebitNotes)
  .post(pharmacyController.createDebitNote);

router.route('/debit-notes/:id')
  .get(pharmacyController.getDebitNoteById);

router.put('/debit-notes/:id/settle', pharmacyController.settleDebitNote);

router.route('/disposals')
  .get(pharmacyController.getDisposalLogs)
  .post(pharmacyController.createDisposalLog);

export default router;
