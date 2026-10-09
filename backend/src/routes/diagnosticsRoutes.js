import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware.js';
import * as patientController from '../controllers/diagnosticsPatientController.js';
import * as doctorController from '../controllers/diagnosticsDoctorController.js';
import * as testController from '../controllers/diagnosticsTestController.js';
import * as orderController from '../controllers/diagnosticsOrderController.js';
import * as sampleController from '../controllers/diagnosticsSampleController.js';
import * as resultController from '../controllers/diagnosticsResultController.js';
import * as inventoryController from '../controllers/diagnosticsInventoryController.js';
import * as analyticsController from '../controllers/diagnosticsAnalyticsController.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Allow specific diagnostics roles
router.use(authorize('OWNER', 'ADMIN', 'RECEPTIONIST', 'TECHNICIAN', 'PHLEBOTOMIST', 'PATHOLOGIST', 'RADIOLOGIST', 'REPORT_VERIFIER'));

// --- Patients Routes ---
router.route('/patients')
  .get(patientController.getPatients)
  .post(patientController.createPatient);

router.route('/patients/:id/full')
  .get(patientController.getPatientFullDetails);

router.route('/patients/:id')
  .get(patientController.getPatient)
  .patch(patientController.updatePatient);

// --- Doctors Routes ---
router.route('/doctors')
  .get(doctorController.getDoctors)
  .post(doctorController.createDoctor);

// --- Tests Routes ---
router.route('/tests')
  .get(testController.getTests)
  .post(testController.createTest);

router.route('/tests/:id')
  .patch(testController.updateTest);

// --- Orders Routes ---
router.route('/orders')
  .get(orderController.getOrders)
  .post(orderController.createOrder);

router.route('/orders/:id/status')
  .patch(orderController.updateOrderStatus);

router.route('/orders/:id/payment')
  .patch(orderController.addPayment);

// --- Samples Routes ---
router.route('/samples')
  .get(sampleController.getSamples)
  .post(sampleController.createSample);

router.route('/samples/:id/status')
  .patch(sampleController.updateSampleStatus);

// --- Results Routes ---
router.route('/results/pending')
  .get(resultController.getPendingResults);

router.route('/results')
  .post(resultController.saveResult);

router.route('/results/order/:orderId')
  .get(resultController.getResultsByOrder);

router.route('/results/:id/verify')
  .patch(resultController.verifyResult);

// --- Inventory Routes ---
router.route('/inventory')
  .get(inventoryController.getInventoryItems)
  .post(inventoryController.addInventoryItem);

router.route('/inventory/:id/stock')
  .patch(inventoryController.updateStock);

// --- Analytics Routes ---
router.route('/analytics/dashboard')
  .get(analyticsController.getDashboardAnalytics);

export default router;
