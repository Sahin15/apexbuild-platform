import express from 'express';
import { 
  getWorkers, 
  createWorker, 
  updateWorker,
  deleteWorker,
  markAttendance, 
  getLabourSummary, 
  getAttendanceHistory, 
  getMusterRollMatrix,
  generateWageSheet,
  getWageSheets,
  getWageSheetById,
  disburseWageSheet,
  addWorkerAdvance 
} from '../controllers/labourController.js';
import { protect, requireOrganization } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(requireOrganization);

router.get('/summary', getLabourSummary);
router.get('/muster-matrix', getMusterRollMatrix);

router.route('/workers')
  .get(getWorkers)
  .post(createWorker);

router.route('/workers/:id')
  .patch(updateWorker)
  .delete(deleteWorker);

router.route('/workers/:id/advance')
  .post(addWorkerAdvance);

router.route('/attendance')
  .get(getAttendanceHistory)
  .post(markAttendance);

router.route('/wage-sheets')
  .get(getWageSheets)
  .post(generateWageSheet);

router.route('/wage-sheets/:id')
  .get(getWageSheetById);

router.route('/wage-sheets/:id/disburse')
  .post(disburseWageSheet);

export default router;

