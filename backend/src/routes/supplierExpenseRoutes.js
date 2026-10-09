import express from 'express';
import { 
  getExpenses, 
  createExpense,
  deleteExpense
} from '../controllers/supplierExpenseController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'ACCOUNTANT'));

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .delete(deleteExpense);

export default router;
