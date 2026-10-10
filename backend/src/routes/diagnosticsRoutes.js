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
import * as paymentController from '../controllers/diagnosticsPaymentController.js';
import * as worklistController from '../controllers/diagnosticsWorklistController.js';
import * as alertController from '../controllers/diagnosticsAlertController.js';
import * as qcController from '../controllers/diagnosticsQCController.js';
import * as settingsController from '../controllers/diagnosticsSettingsController.js';

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

router.route('/patients/:id/cumulative-trends')
  .get(patientController.getPatientCumulativeTrends);

router.route('/patients/:id')
  .get(patientController.getPatient)
  .patch(patientController.updatePatient);

// --- Doctors Routes & Commission Engine ---
router.route('/doctors')
  .get(doctorController.getDoctors)
  .post(doctorController.createDoctor);

router.route('/doctors/payouts')
  .get(doctorController.getAllPayouts)
  .post(doctorController.recordDoctorPayout);

router.route('/doctors/:id')
  .patch(doctorController.updateDoctor);

router.route('/doctors/:id/ledger')
  .get(doctorController.getDoctorLedger);

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

// --- Payments & Cash Desk Shift Close Engine ---
router.route('/payments')
  .get(paymentController.getPayments)
  .post(paymentController.recordPayment);

router.route('/payments/shift-summary')
  .get(paymentController.getShiftSummary);

router.route('/payments/shift/open')
  .post(paymentController.openCashierShift);

router.route('/payments/shift/close')
  .post(paymentController.closeCashierShift);

router.route('/payments/shifts')
  .get(paymentController.getShiftHistory);

// --- Departmental Worklists & Clinical TAT SLA Engine ---
router.route('/worklists')
  .get(worklistController.getDepartmentalWorklist);

router.route('/worklists/tat-analytics')
  .get(worklistController.getTatAnalytics);

router.route('/worklists/batch-status')
  .patch(worklistController.batchUpdateWorklistStatus);

// --- Critical Panic Value Alerts & WhatsApp/SMS Dispatch Engine ---
router.route('/alerts')
  .get(alertController.getCriticalAlerts);

router.route('/alerts/summary')
  .get(alertController.getAlertsAndDispatchSummary);

router.route('/alerts/:id/communicate')
  .patch(alertController.logCriticalCommunication);

router.route('/dispatches')
  .get(alertController.getDispatches)
  .post(alertController.sendReportDispatch);

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

// --- Inventory Routes & Reagent Management ---
router.route('/inventory')
  .get(inventoryController.getInventoryItems)
  .post(inventoryController.addInventoryItem);

router.route('/inventory/logs')
  .get(inventoryController.getInventoryLogs);

router.route('/inventory/:id/stock')
  .patch(inventoryController.updateStock);

// --- Quality Control (IQC) & Levey-Jennings Engine ---
router.route('/qc/lots')
  .get(qcController.getQCLots)
  .post(qcController.createQCLot);

router.route('/qc/lots/:lotId/runs')
  .post(qcController.recordQCRun);

router.route('/qc/lots/:lotId/runs/:runId/corrective-action')
  .patch(qcController.logQCCorrectiveAction);

// --- Laboratory Settings & Letterhead Customization ---
router.route('/settings')
  .get(settingsController.getLabSettings)
  .patch(settingsController.updateLabSettings);

// --- Analytics Routes ---
router.route('/analytics/dashboard')
  .get(analyticsController.getDashboardAnalytics);

export default router;
