import mongoose from 'mongoose';
import SupplierPayment from '../models/SupplierPayment.js';
import SupplierCustomer from '../models/SupplierCustomer.js';
import SupplierVendor from '../models/SupplierVendor.js';
import AppError from '../utils/AppError.js';

export const getPayments = async (req, res, next) => {
  try {
    const payments = await SupplierPayment.find({ organizationId: req.user.organizationId })
      .populate('customer', 'name businessName')
      .populate('vendor', 'name')
      .populate('recordedBy', 'name')
      .sort('-paymentDate');
      
    res.status(200).json({ status: 'success', data: { payments } });
  } catch (error) { next(error); }
};

export const createPayment = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { type, amount, customer, vendor } = req.body;

    if (type === 'IN' && !customer) throw new AppError('Customer is required for incoming payments', 400);
    if (type === 'OUT' && !vendor) throw new AppError('Vendor is required for outgoing payments', 400);

    const count = await SupplierPayment.countDocuments({ organizationId: orgId });
    const prefix = type === 'IN' ? 'RCP' : 'PMT';
    const paymentNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = new SupplierPayment({
      ...req.body,
      paymentNumber,
      organizationId: orgId,
      recordedBy: req.user._id
    });

    await payment.save();

    // Deduct due/payable balances
    if (type === 'IN') {
      const cust = await SupplierCustomer.findOne({ _id: customer, organizationId: orgId });
      if (!cust) throw new AppError('Customer not found', 404);
      cust.currentDue = Math.max(0, cust.currentDue - amount);
      await cust.save();
    } else {
      const vend = await SupplierVendor.findOne({ _id: vendor, organizationId: orgId });
      if (!vend) throw new AppError('Vendor not found', 404);
      vend.currentPayable = Math.max(0, vend.currentPayable - amount);
      await vend.save();
    }

    res.status(201).json({ status: 'success', data: { payment } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Payment number already exists', 400));
    next(error);
  }
};
