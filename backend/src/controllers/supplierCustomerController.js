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

import SupplierInvoice from '../models/SupplierInvoice.js';
import SupplierPayment from '../models/SupplierPayment.js';

export const getCustomerLedger = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const customerId = req.params.id;

    const customer = await SupplierCustomer.findOne({ _id: customerId, organizationId: orgId });
    if (!customer) return next(new AppError('Customer not found', 404));

    // Fetch invoices and payments
    const [invoices, payments] = await Promise.all([
      SupplierInvoice.find({ customer: customerId, organizationId: orgId }).sort('invoiceDate createdAt'),
      SupplierPayment.find({ customer: customerId, organizationId: orgId, type: 'IN' }).sort('paymentDate createdAt')
    ]);

    // Build timeline entries
    const entries = [];

    // Opening balance entry if set
    if (customer.openingBalance && customer.openingBalance > 0) {
      entries.push({
        date: customer.createdAt,
        type: 'OPENING_BALANCE',
        referenceNumber: 'OPENING',
        description: 'Opening Balance (Initial Credit)',
        debit: customer.openingBalance,
        credit: 0
      });
    }

    invoices.forEach(inv => {
      entries.push({
        _id: inv._id,
        date: inv.invoiceDate || inv.createdAt,
        type: 'INVOICE',
        referenceNumber: inv.invoiceNumber,
        description: `Tax Invoice (${inv.items?.length || 0} items)`,
        debit: inv.grandTotal,
        credit: 0,
        status: inv.status
      });

      // If invoice had an immediate advance/paidAmount recorded directly with it
      if (inv.paidAmount && inv.paidAmount > 0) {
        entries.push({
          _id: `${inv._id}-adv`,
          date: inv.invoiceDate || inv.createdAt,
          type: 'PAYMENT',
          referenceNumber: `REC-${inv.invoiceNumber}`,
          description: `Advance recorded on Invoice #${inv.invoiceNumber}`,
          debit: 0,
          credit: inv.paidAmount,
          paymentMode: 'DIRECT'
        });
      }
    });

    payments.forEach(pmt => {
      entries.push({
        _id: pmt._id,
        date: pmt.paymentDate || pmt.createdAt,
        type: 'PAYMENT',
        referenceNumber: pmt.paymentNumber,
        description: pmt.notes || `Payment Received via ${pmt.paymentMode}`,
        debit: 0,
        credit: pmt.amount,
        paymentMode: pmt.paymentMode,
        transactionRef: pmt.referenceNumber
      });
    });

    // Sort chronologically ascending to compute accurate running balance
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningBalance = 0;
    let totalDebit = 0;
    let totalCredit = 0;

    const ledger = entries.map(item => {
      totalDebit += item.debit;
      totalCredit += item.credit;
      runningBalance += (item.debit - item.credit);
      return {
        ...item,
        runningBalance: Math.max(0, runningBalance)
      };
    });

    // Reverse for latest first display
    const displayLedger = [...ledger].reverse();
    const currentDue = customer.currentDue !== undefined ? customer.currentDue : Math.max(0, runningBalance);

    res.status(200).json({
      status: 'success',
      data: {
        customer,
        summary: {
          openingBalance: customer.openingBalance || 0,
          totalBilled: totalDebit,
          totalPaid: totalCredit,
          currentDue: currentDue,
          creditLimit: customer.creditLimit || 0,
          creditUtilizationPercent: customer.creditLimit > 0 
            ? Math.round((currentDue / customer.creditLimit) * 100) 
            : 0,
          isOverLimit: customer.creditLimit > 0 && currentDue > customer.creditLimit
        },
        ledger: displayLedger
      }
    });
  } catch (error) { next(error); }
};

export const recordCustomerPayment = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const customerId = req.params.id;
    const { amount, paymentMode = 'CASH', referenceNumber = '', notes = '', paymentDate = new Date() } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return next(new AppError('Valid payment amount is required', 400));
    }

    const customer = await SupplierCustomer.findOne({ _id: customerId, organizationId: orgId });
    if (!customer) return next(new AppError('Customer not found', 404));

    const count = await SupplierPayment.countDocuments({ organizationId: orgId });
    const paymentNumber = `RCP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const payment = await SupplierPayment.create({
      organizationId: orgId,
      paymentNumber,
      type: 'IN',
      customer: customerId,
      amount: numAmount,
      paymentDate,
      paymentMode,
      referenceNumber,
      notes,
      recordedBy: req.user._id
    });

    customer.currentDue = Math.max(0, customer.currentDue - numAmount);
    await customer.save();

    res.status(201).json({
      status: 'success',
      data: {
        payment,
        customer
      }
    });
  } catch (error) { next(error); }
};
