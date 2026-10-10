import PettyCashAccount from '../models/PettyCashAccount.js';
import PettyCashTransaction from '../models/PettyCashTransaction.js';
import Expense from '../models/Expense.js';

export const getPettyCashAccounts = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (projectId && projectId !== 'ALL') filter.projectId = projectId;

    const accounts = await PettyCashAccount.find(filter)
      .populate('projectId', 'name projectCode')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { accounts }
    });
  } catch (error) {
    next(error);
  }
};

export const createPettyCashAccount = async (req, res, next) => {
  try {
    const {
      projectId,
      supervisorName,
      supervisorPhone,
      upiId,
      allocatedFloat,
      notes
    } = req.body;

    if (!projectId || !supervisorName) {
      return res.status(400).json({
        status: 'fail',
        message: 'Project and supervisor name are required'
      });
    }

    const floatAmt = Number(allocatedFloat) || 25000;

    const account = await PettyCashAccount.create({
      organizationId: req.user.organizationId,
      projectId,
      supervisorName,
      supervisorPhone: supervisorPhone || '',
      upiId: upiId || '',
      allocatedFloat: floatAmt,
      currentBalance: floatAmt,
      totalReceived: floatAmt,
      totalSpent: 0,
      notes: notes || ''
    });

    // Record initial top-up transaction
    const year = new Date().getFullYear();
    const count = await PettyCashTransaction.countDocuments({ organizationId: req.user.organizationId });
    const voucherNo = `TOP-${year}-${String(count + 1).padStart(3, '0')}`;

    await PettyCashTransaction.create({
      organizationId: req.user.organizationId,
      projectId,
      accountId: account._id,
      type: 'TOP_UP',
      voucherNo,
      date: new Date(),
      amount: floatAmt,
      category: 'OTHER',
      description: `Initial Sanctioned Imprest Cash Float for ${supervisorName}`,
      vendorName: 'Contractor Main Imprest',
      paymentMode: 'BANK_TRANSFER',
      status: 'APPROVED',
      approvedBy: req.user._id,
      approvalDate: new Date()
    });

    res.status(201).json({
      status: 'success',
      data: { account }
    });
  } catch (error) {
    next(error);
  }
};

export const getPettyCashTransactions = async (req, res, next) => {
  try {
    const { projectId, accountId, status, type } = req.query;
    const filter = { organizationId: req.user.organizationId };

    if (projectId && projectId !== 'ALL') filter.projectId = projectId;
    if (accountId && accountId !== 'ALL') filter.accountId = accountId;
    if (status && status !== 'ALL') filter.status = status;
    if (type && type !== 'ALL') filter.type = type;

    const transactions = await PettyCashTransaction.find(filter)
      .populate('accountId', 'supervisorName allocatedFloat currentBalance')
      .populate('projectId', 'name projectCode')
      .populate('approvedBy', 'name email')
      .sort('-date -createdAt');

    res.status(200).json({
      status: 'success',
      data: { transactions }
    });
  } catch (error) {
    next(error);
  }
};

export const createExpenseVoucher = async (req, res, next) => {
  try {
    const {
      projectId,
      accountId,
      date,
      amount,
      category,
      description,
      vendorName,
      billNumber,
      paymentMode,
      receiptUrl
    } = req.body;

    if (!projectId || !accountId || !amount || !description) {
      return res.status(400).json({
        status: 'fail',
        message: 'Project, Supervisor account, amount, and description are required'
      });
    }

    const account = await PettyCashAccount.findOne({
      _id: accountId,
      organizationId: req.user.organizationId
    });

    if (!account) {
      return res.status(404).json({ status: 'fail', message: 'Supervisor petty cash account not found' });
    }

    const count = await PettyCashTransaction.countDocuments({ organizationId: req.user.organizationId });
    const year = new Date().getFullYear();
    const voucherNo = `VCH-${year}-${String(count + 1).padStart(3, '0')}`;

    const transaction = await PettyCashTransaction.create({
      organizationId: req.user.organizationId,
      projectId,
      accountId,
      type: 'EXPENSE',
      voucherNo,
      date: date ? new Date(date) : new Date(),
      amount: Number(amount),
      category: category || 'SITE_HARDWARE',
      description,
      vendorName: vendorName || 'Local Site Vendor',
      billNumber: billNumber || '',
      paymentMode: paymentMode || 'CASH',
      receiptUrl: receiptUrl || '',
      submittedBy: account.supervisorName,
      status: 'PENDING'
    });

    res.status(201).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const topUpFloat = async (req, res, next) => {
  try {
    const { accountId, amount, paymentMode, referenceNumber, notes } = req.body;

    if (!accountId || !amount) {
      return res.status(400).json({ status: 'fail', message: 'Account and top-up amount are required' });
    }

    const topUpAmount = Number(amount);
    const account = await PettyCashAccount.findOne({
      _id: accountId,
      organizationId: req.user.organizationId
    });

    if (!account) {
      return res.status(404).json({ status: 'fail', message: 'Supervisor account not found' });
    }

    // Update Account balance
    account.currentBalance += topUpAmount;
    account.totalReceived += topUpAmount;
    account.lastTopUpDate = new Date();
    await account.save();

    // Record TOP_UP Transaction
    const count = await PettyCashTransaction.countDocuments({ organizationId: req.user.organizationId });
    const year = new Date().getFullYear();
    const voucherNo = `TOP-${year}-${String(count + 1).padStart(3, '0')}`;

    const transaction = await PettyCashTransaction.create({
      organizationId: req.user.organizationId,
      projectId: account.projectId,
      accountId,
      type: 'TOP_UP',
      voucherNo,
      date: new Date(),
      amount: topUpAmount,
      category: 'OTHER',
      description: `Cash Float Replenishment / Top-up (${paymentMode || 'UPI'} Ref: ${referenceNumber || 'Cash Handover'})`,
      vendorName: 'Contractor Main Treasury',
      paymentMode: paymentMode || 'UPI',
      status: 'APPROVED',
      approvedBy: req.user._id,
      approvalDate: new Date(),
      remarks: notes || ''
    });

    res.status(200).json({
      status: 'success',
      message: `Successfully topped up ₹${topUpAmount.toLocaleString()} to ${account.supervisorName}`,
      data: { account, transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const approveVoucher = async (req, res, next) => {
  try {
    const transaction = await PettyCashTransaction.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!transaction) {
      return res.status(404).json({ status: 'fail', message: 'Voucher transaction not found' });
    }

    if (transaction.status === 'APPROVED') {
      return res.status(400).json({ status: 'fail', message: 'Voucher is already approved' });
    }

    const account = await PettyCashAccount.findOne({
      _id: transaction.accountId,
      organizationId: req.user.organizationId
    });

    if (!account) {
      return res.status(404).json({ status: 'fail', message: 'Supervisor account not found' });
    }

    // Deduct from supervisor currentBalance and increase totalSpent
    account.currentBalance = Math.max(0, account.currentBalance - transaction.amount);
    account.totalSpent += transaction.amount;
    await account.save();

    // Create linked Expense in Project P&L
    let expenseCategory = 'Other';
    if (transaction.category === 'SITE_HARDWARE') expenseCategory = 'Material';
    else if (transaction.category === 'DIESEL_FUEL') expenseCategory = 'Equipment';
    else if (transaction.category === 'EMERGENCY_REPAIR') expenseCategory = 'Equipment';
    else if (transaction.category === 'LOCAL_CARTAGE') expenseCategory = 'Transport';
    else if (transaction.category === 'LABOUR_TEA_FOOD') expenseCategory = 'Labour';
    else if (transaction.category === 'OFFICE_STATIONERY') expenseCategory = 'Office';

    const linkedExpense = await Expense.create({
      organizationId: req.user.organizationId,
      projectId: transaction.projectId,
      date: transaction.date,
      description: `[Site Voucher ${transaction.voucherNo}] ${transaction.description} (${transaction.vendorName})`,
      category: expenseCategory,
      amount: transaction.amount,
      paidBy: req.user._id,
      status: 'Approved'
    });

    // Update Transaction Status
    transaction.status = 'APPROVED';
    transaction.approvedBy = req.user._id;
    transaction.approvalDate = new Date();
    transaction.linkedExpenseId = linkedExpense._id;
    await transaction.save();

    res.status(200).json({
      status: 'success',
      message: `Voucher ${transaction.voucherNo} approved successfully`,
      data: { transaction, account }
    });
  } catch (error) {
    next(error);
  }
};

export const rejectVoucher = async (req, res, next) => {
  try {
    const { rejectionReason } = req.body;
    const transaction = await PettyCashTransaction.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!transaction) {
      return res.status(404).json({ status: 'fail', message: 'Voucher not found' });
    }

    transaction.status = 'REJECTED';
    transaction.rejectionReason = rejectionReason || 'Rejected by contractor';
    await transaction.save();

    res.status(200).json({
      status: 'success',
      message: `Voucher ${transaction.voucherNo} rejected`,
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const getPettyCashSummary = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const filter = { organizationId: req.user.organizationId };
    if (projectId && projectId !== 'ALL') filter.projectId = projectId;

    const accounts = await PettyCashAccount.find(filter);
    const transactions = await PettyCashTransaction.find(filter);

    const totalFloatInField = accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0);
    const totalAllocatedFloat = accounts.reduce((sum, a) => sum + (a.allocatedFloat || 0), 0);
    const totalSpent = accounts.reduce((sum, a) => sum + (a.totalSpent || 0), 0);
    const totalReceived = accounts.reduce((sum, a) => sum + (a.totalReceived || 0), 0);

    const pendingVouchers = transactions.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING');
    const pendingAmount = pendingVouchers.reduce((sum, t) => sum + (t.amount || 0), 0);

    const lowBalanceAccounts = accounts.filter(a => a.currentBalance < 5000).length;

    res.status(200).json({
      status: 'success',
      data: {
        totalFloatInField,
        totalAllocatedFloat,
        totalSpent,
        totalReceived,
        pendingVouchersCount: pendingVouchers.length,
        pendingAmount,
        activeSupervisorsCount: accounts.length,
        lowBalanceAccounts
      }
    });
  } catch (error) {
    next(error);
  }
};
