import SupplierExpense from '../models/SupplierExpense.js';
import AppError from '../utils/AppError.js';

export const getExpenses = async (req, res, next) => {
  try {
    const expenses = await SupplierExpense.find({ organizationId: req.user.organizationId })
      .populate('recordedBy', 'name')
      .sort('-date');
    res.status(200).json({ status: 'success', data: { expenses } });
  } catch (error) { next(error); }
};

export const createExpense = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    
    const expense = await SupplierExpense.create({
      ...req.body,
      organizationId: orgId,
      recordedBy: req.user._id
    });

    res.status(201).json({ status: 'success', data: { expense } });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req, res, next) => {
  try {
    const expense = await SupplierExpense.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!expense) return next(new AppError('Expense not found', 404));

    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
