import SupplierInvoice from '../models/SupplierInvoice.js';
import SupplierCustomer from '../models/SupplierCustomer.js';
import AppError from '../utils/AppError.js';

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await SupplierInvoice.find({ organizationId: req.user.organizationId })
      .populate('customer', 'name email phone businessName')
      .populate('order', 'orderNumber')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { invoices } });
  } catch (error) { next(error); }
};

export const createInvoice = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    
    const count = await SupplierInvoice.countDocuments({ organizationId: orgId });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const invoice = await SupplierInvoice.create({
      ...req.body,
      invoiceNumber,
      organizationId: orgId
    });

    // We do NOT update the customer's due balance here if it was already updated during Order creation.
    // If the invoice is generated independently, we would update it here.
    // Assuming for simplicity that 'Orders' handle inventory and 'Invoices' handle formal billing.
    // If it's a direct invoice (no order), update the customer balance.
    if (!req.body.order && req.body.dueAmount > 0) {
      await SupplierCustomer.findByIdAndUpdate(
        req.body.customer,
        { $inc: { currentDue: req.body.dueAmount } }
      );
    }

    res.status(201).json({ status: 'success', data: { invoice } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Invoice number already exists', 400));
    next(error);
  }
};
