import express from 'express';
import {
  getPettyCashAccounts,
  createPettyCashAccount,
  getPettyCashTransactions,
  createExpenseVoucher,
  topUpFloat,
  approveVoucher,
  rejectVoucher,
  getPettyCashSummary
} from '../controllers/pettyCashController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);

// Summary KPI
router.get('/summary', getPettyCashSummary);

// Supervisor Accounts
router.get('/accounts', getPettyCashAccounts);
router.post('/accounts', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'), createPettyCashAccount);

// Vouchers & Transactions
router.get('/transactions', getPettyCashTransactions);
router.post('/vouchers', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR', 'ACCOUNTANT'), createExpenseVoucher);

// Top-up cash float
router.post('/top-up', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'), topUpFloat);

// 1-Click Approval / Rejection
router.patch('/vouchers/:id/approve', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'), approveVoucher);
router.patch('/vouchers/:id/reject', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT'), rejectVoucher);

export default router;
