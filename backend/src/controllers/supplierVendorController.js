import SupplierVendor from '../models/SupplierVendor.js';
import AppError from '../utils/AppError.js';

export const getVendors = async (req, res, next) => {
  try {
    const vendors = await SupplierVendor.find({ organizationId: req.user.organizationId }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { vendors } });
  } catch (error) { next(error); }
};

export const createVendor = async (req, res, next) => {
  try {
    const vendor = await SupplierVendor.create({
      ...req.body,
      organizationId: req.user.organizationId,
      currentPayable: req.body.openingBalance || 0
    });
    res.status(201).json({ status: 'success', data: { vendor } });
  } catch (error) { next(error); }
};

export const getVendor = async (req, res, next) => {
  try {
    const vendor = await SupplierVendor.findOne({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!vendor) return next(new AppError('Vendor not found', 404));
    res.status(200).json({ status: 'success', data: { vendor } });
  } catch (error) { next(error); }
};

export const updateVendor = async (req, res, next) => {
  try {
    const vendor = await SupplierVendor.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!vendor) return next(new AppError('Vendor not found', 404));
    res.status(200).json({ status: 'success', data: { vendor } });
  } catch (error) { next(error); }
};

export const deleteVendor = async (req, res, next) => {
  try {
    const vendor = await SupplierVendor.findOneAndDelete({ _id: req.params.id, organizationId: req.user.organizationId });
    if (!vendor) return next(new AppError('Vendor not found', 404));
    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};
