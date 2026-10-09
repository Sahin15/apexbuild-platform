import mongoose from 'mongoose';
import DistributorPayment from '../models/DistributorPayment.js';
import DistributorCustomer from '../models/DistributorCustomer.js';
import DistributorSupplier from '../models/DistributorSupplier.js';

export const getPayments = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const payments = await DistributorPayment.find({ organizationId: orgId })
      .populate('customer', 'shopName route')
      .populate('supplier', 'name companyName')
      .sort('-date -createdAt');
    res.status(200).json({ status: 'success', data: { payments } });
  } catch (error) { next(error); }
};

export const createPayment = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { type, amount, paymentMethod, customerId, supplierId, notes, reference } = req.body;

    const newPayment = await DistributorPayment.create([{
      organizationId: orgId,
      type,
      amount: Number(amount),
      paymentMethod,
      customer: type === 'CUSTOMER_COLLECTION' ? customerId : undefined,
      supplier: type === 'SUPPLIER_PAYMENT' ? supplierId : undefined,
      notes,
      reference
    }]);

    if (type === 'CUSTOMER_COLLECTION') {
      const customer = await DistributorCustomer.findOne({ _id: customerId, organizationId: orgId });
      if (!customer) throw new Error('Customer not found');
      customer.currentDue -= Number(amount);
      await customer.save();
    } else if (type === 'SUPPLIER_PAYMENT') {
      const supplier = await DistributorSupplier.findOne({ _id: supplierId, organizationId: orgId });
      if (!supplier) throw new Error('Supplier not found');
      supplier.currentPayable -= Number(amount);
      await supplier.save();
    }

    

    res.status(201).json({ status: 'success', data: { payment: newPayment[0] } });
  } catch (error) {
    
    next(error);
  }
};
