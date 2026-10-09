import DistributorExpense from '../models/DistributorExpense.js';

export const getExpenses = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const filter = { organizationId: orgId };
    if (req.query.vehicleId) filter.vehicleId = req.query.vehicleId;
    const expenses = await DistributorExpense.find(filter).sort('-date -createdAt').populate('vehicleId');
    res.status(200).json({ status: 'success', data: { expenses } });
  } catch (error) { next(error); }
};

export const createExpense = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const newExpense = await DistributorExpense.create({ ...req.body, organizationId: orgId });
    res.status(201).json({ status: 'success', data: { expense: newExpense } });
  } catch (error) { next(error); }
};
