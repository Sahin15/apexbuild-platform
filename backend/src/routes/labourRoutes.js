import express from 'express';
import { getWorkers, createWorker, markAttendance, getLabourSummary, getAttendanceHistory, addWorkerPayment } from '../controllers/labourController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/workers')
  .get(getWorkers)
  .post(createWorker);

router.route('/workers/:id/payment')
  .post(addWorkerPayment);

router.route('/attendance')
  .get(getAttendanceHistory)
  .post(markAttendance);

router.route('/summary')
  .get(getLabourSummary);

export default router;
