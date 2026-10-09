import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import AppError from '../utils/AppError.js';
import Subscription from '../models/Subscription.js';
import AuditLog from '../models/AuditLog.js';
import Organization from '../models/Organization.js';
import BusinessPartner from '../models/BusinessPartner.js';
import PartnerLedger from '../models/PartnerLedger.js';

export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find().populate('organizationId osProductId subscriptionId');
    res.status(200).json({ status: 'success', data: { invoices } });
  } catch (error) { next(error); }
};

export const createInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.create(req.body);
    res.status(201).json({ status: 'success', data: { invoice } });
  } catch (error) { next(error); }
};

export const getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find().populate('organizationId invoiceId subscriptionId').sort('-paymentDate');
    res.status(200).json({ status: 'success', data: { payments } });
  } catch (error) { next(error); }
};

export const createManualPayment = async (req, res, next) => {
  try {
    const { organizationId, amount, paymentMethod, transactionReference } = req.body;
    
    const payment = await Payment.create({
      organizationId,
      amount,
      paymentMethod,
      transactionReference,
      status: 'VERIFIED',
      verifiedBy: req.user._id,
      verificationDate: Date.now(),
      paymentDate: Date.now()
    });

    await AuditLog.create({
      action: 'MANUAL_PAYMENT_ADDED',
      adminId: req.user._id,
      entityType: 'Payment',
      entityId: payment._id,
      newValue: { amount, organizationId },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ status: 'success', data: { payment } });
  } catch (error) { next(error); }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return next(new AppError('Payment not found', 404));

    payment.status = 'VERIFIED';
    payment.verifiedBy = req.user._id;
    payment.verificationDate = Date.now();
    await payment.save();

    // Update Invoice
    if (payment.invoiceId) {
      const invoice = await Invoice.findById(payment.invoiceId);
      if (invoice) {
        invoice.paidAmount += payment.amount;
        invoice.dueAmount = invoice.total - invoice.paidAmount;
        invoice.status = invoice.dueAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';
        await invoice.save();
      }
    }

    // Update Subscription if this was for subscription activation
    if (payment.subscriptionId) {
      const sub = await Subscription.findById(payment.subscriptionId);
      if (sub && ['PENDING_PAYMENT', 'PAYMENT_DUE', 'GRACE_PERIOD', 'RESTRICTED', 'SUSPENDED'].includes(sub.status)) {
        sub.status = 'ACTIVE';
        await sub.save();
      }
    }

    // Process Partner Commission (Reseller Logic)
    if (payment.organizationId && payment.amount > 0) {
      const org = await Organization.findById(payment.organizationId);
      if (org && org.partnerId) {
        const partner = await BusinessPartner.findById(org.partnerId);
        if (partner && partner.status === 'active') {
          const commissionAmount = payment.amount * ((partner.commissionRate || 0) / 100);
          
          partner.totalPending += commissionAmount;
          partner.lifetimeRevenue += payment.amount;
          await partner.save();

          await PartnerLedger.create({
            partnerId: partner._id,
            tenantId: org._id,
            invoiceId: payment.invoiceId,
            amount: commissionAmount,
            type: 'COMMISSION',
            description: `Commission for payment verification of ₹${payment.amount}`
          });
        }
      }
    }

    // Create Audit Log
    await AuditLog.create({
      action: 'PAYMENT_VERIFIED',
      adminId: req.user._id,
      entityType: 'Payment',
      entityId: payment._id,
      newValue: {
        amount: payment.amount,
        organizationId: payment.organizationId,
        invoiceId: payment.invoiceId,
        subscriptionId: payment.subscriptionId
      },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: { payment } });
  } catch (error) { next(error); }
};
