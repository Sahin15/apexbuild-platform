import express from 'express';
import { getEstimations, createEstimation, updateEstimation, deleteEstimation } from '../controllers/distributorEstimationController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT', 'SALES'));

router.route('/')
  .get(getEstimations)
  .post(createEstimation);

router.route('/:id')
  .put(updateEstimation)
  .delete(deleteEstimation);

export default router;
