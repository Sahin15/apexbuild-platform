import express from 'express';
import { getExpenses, createExpense, updateExpenseStatus } from '../controllers/expenseController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:expenseId/status')
  .patch(updateExpenseStatus);

export default router;
