import express from 'express';
import { getExpenses, createExpense } from '../controllers/distributorExpenseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT'));

router.route('/')
  .get(getExpenses)
  .post(createExpense);

export default router;
