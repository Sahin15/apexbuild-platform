import SupplierCustomer from '../models/SupplierCustomer.js';
import AppError from '../utils/AppError.js';

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await SupplierCustomer.find({ organizationId: req.user.organizationId }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { customers } });
  } catch (error) { next(error); }
};

export const createCustomer = async (req, res, next) => {
  try {
    const customer = await SupplierCustomer.create({
      ...req.body,
      organizationId: req.user.organizationId,
      currentDue: req.body.openingBalance || 0
    });
    res.status(201).json({ status: 'success', data: { customer } });
  } catch (error) { next(error); }
};

export const getCustomer = async (req, res, next) => {
  try {
    const customer = await SupplierCustomer.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!customer) return next(new AppError('Customer not found', 404));
    res.status(200).json({ status: 'success', data: { customer } });
  } catch (error) { next(error); }
};

export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await SupplierCustomer.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!customer) return next(new AppError('Customer not found', 404));
    res.status(200).json({ status: 'success', data: { customer } });
  } catch (error) { next(error); }
};

export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await SupplierCustomer.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!customer) return next(new AppError('Customer not found', 404));
    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
