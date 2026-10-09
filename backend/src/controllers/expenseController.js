import Expense from '../models/Expense.js';

export const getExpenses = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) {
      filter.projectId = req.params.projectId || req.query.projectId;
    }

    const expenses = await Expense.find(filter)
      .populate('projectId', 'name')
      .populate('paidBy', 'name')
      .sort('-date');
      
    res.status(200).json({ status: 'success', data: { expenses } });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req, res, next) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      projectId: req.params.projectId || req.body.projectId,
      organizationId: req.user.organizationId,
      paidBy: req.user._id
    });
    
    res.status(201).json({ status: 'success', data: { expense } });
  } catch (error) {
    next(error);
  }
};

export const updateExpenseStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.expenseId, organizationId: req.user.organizationId },
      { status },
      { new: true, runValidators: true }
    );

    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    
    res.status(200).json({ status: 'success', data: { expense } });
  } catch (error) {
    next(error);
  }
};
