import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import Subscription from '../models/Subscription.js';

class PlatformFinanceService {
  // --- INVOICES ---
  async getInvoices() {
    return await Invoice.find()
      .populate('organizationId', 'name businessType email phone city state')
      .populate('osProductId', 'name slug')
      .populate('osPlanId', 'name monthlyPrice yearlyPrice setupFee')
      .sort('-createdAt')
      .lean();
  }

  async getImplementationFees() {
    return await Invoice.find({ type: 'IMPLEMENTATION' })
      .populate('organizationId', 'name businessType email phone city state')
      .populate('osProductId', 'name slug')
      .sort('-createdAt')
      .lean();
  }

  async getInvoiceDetails(id) {
    return await Invoice.findById(id)
      .populate('organizationId', 'name legalName businessType email phone address city state gstNumber')
      .populate('osProductId', 'name slug')
      .populate('osPlanId', 'name monthlyPrice yearlyPrice setupFee featureEntitlements')
      .populate('subscriptionId')
      .lean();
  }

  async getRevenueAnalytics() {
    const activeSubscriptions = await Subscription.find({ status: { $in: ['ACTIVE', 'GRACE_PERIOD', 'PAYMENT_DUE'] } });
    
    let mrr = 0;
    let arr = 0;
    
    for (const sub of activeSubscriptions) {
      if (sub.billingCycle === 'monthly') {
        mrr += sub.finalAmount;
        arr += (sub.finalAmount * 12);
      } else {
        arr += sub.finalAmount;
        mrr += (sub.finalAmount / 12);
      }
    }

    const completedPayments = await Payment.find({ status: 'COMPLETED' });
    const totalCollected = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    const pendingInvoices = await Invoice.find({ status: { $in: ['ISSUED', 'PENDING', 'PARTIALLY_PAID', 'OVERDUE'] } });
    const totalOutstanding = pendingInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

    return {
      mrr,
      arr,
      totalCollected,
      totalOutstanding
    };
  }

  async createInvoice(data, adminId, ip, userAgent) {
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1001).padStart(5, '0')}`;
    
    // Automatically calculate tax and totals if missing
    const subtotal = (Number(data.implementationFee) || 0) + (Number(data.subscriptionFee) || 0);
    const tax = data.tax !== undefined && data.tax !== '' ? Number(data.tax) : (subtotal * 0.18); // Default 18% GST approx
    const discount = Number(data.discount) || 0;
    const total = Math.max(0, subtotal + tax - discount);
    
    const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invoice = await Invoice.create({
      ...data,
      invoiceNumber,
      tax,
      total,
      dueAmount: total,
      dueDate,
      status: data.status || 'ISSUED'
    });

    await AuditLog.create({
      action: 'INVOICE_GENERATED',
      adminId,
      entityType: 'Invoice',
      entityId: invoice._id,
      newValue: { invoiceNumber, total, type: data.type },
      ipAddress: ip,
      userAgent
    });

    return invoice;
  }

  async updateInvoiceStatus(id, status, adminId, ip, userAgent) {
    const invoice = await Invoice.findById(id);
    if (!invoice) return null;

    invoice.status = status;
    if (status === 'PAID') {
      invoice.paidAmount = invoice.total;
      invoice.dueAmount = 0;
      if (invoice.subscriptionId) {
        await Subscription.findByIdAndUpdate(invoice.subscriptionId, { status: 'ACTIVE' });
      }
    } else if (status === 'CANCELLED') {
      invoice.dueAmount = 0;
    } else if (status === 'ISSUED' || status === 'PENDING') {
      invoice.dueAmount = Math.max(0, invoice.total - invoice.paidAmount);
    }
    await invoice.save();

    await AuditLog.create({
      action: 'INVOICE_STATUS_UPDATED',
      adminId,
      entityType: 'Invoice',
      entityId: invoice._id,
      newValue: { status, paidAmount: invoice.paidAmount, dueAmount: invoice.dueAmount },
      ipAddress: ip,
      userAgent
    });

    return invoice;
  }

  // --- PAYMENTS ---
  async getPayments() {
    return await Payment.find()
      .populate('organizationId', 'name email businessType')
      .populate('invoiceId', 'invoiceNumber')
      .sort('-paymentDate')
      .lean();
  }

  async createPayment(data, adminId, ip, userAgent) {
    const payment = await Payment.create({
      ...data,
      submittedBy: adminId,
      status: 'VERIFIED', // Super Admin created payments are auto-verified
      verificationDate: new Date(),
      verifiedBy: adminId
    });

    // If an invoice is linked, update its paid amount
    if (data.invoiceId) {
      const invoice = await Invoice.findById(data.invoiceId);
      if (invoice) {
        invoice.paidAmount += data.amount;
        invoice.dueAmount = Math.max(0, invoice.total - invoice.paidAmount);
        if (invoice.dueAmount === 0) {
          invoice.status = 'PAID';
        } else if (invoice.paidAmount > 0) {
          invoice.status = 'PARTIALLY_PAID';
        }
        await invoice.save();
      }
    }

    await AuditLog.create({
      action: 'PAYMENT_RECORDED',
      adminId,
      entityType: 'Payment',
      entityId: payment._id,
      newValue: { amount: data.amount, method: data.paymentMethod },
      ipAddress: ip,
      userAgent
    });

    return payment;
  }

  async verifyPayment(id, status, adminId, ip, userAgent) {
    const payment = await Payment.findById(id);
    if (!payment) return null;

    payment.status = status; // 'VERIFIED' or 'REJECTED'
    if (status === 'VERIFIED') {
      payment.verifiedBy = adminId;
      payment.verificationDate = new Date();

      if (payment.invoiceId) {
        const invoice = await Invoice.findById(payment.invoiceId);
        if (invoice) {
          invoice.paidAmount += payment.amount;
          invoice.dueAmount = Math.max(0, invoice.total - invoice.paidAmount);
          if (invoice.dueAmount === 0) {
            invoice.status = 'PAID';
          } else if (invoice.paidAmount > 0) {
            invoice.status = 'PARTIALLY_PAID';
          }
          await invoice.save();
        }
      }
    }
    
    await payment.save();

    await AuditLog.create({
      action: `PAYMENT_${status}`,
      adminId,
      entityType: 'Payment',
      entityId: payment._id,
      ipAddress: ip,
      userAgent
    });

    return payment;
  }
}

export default new PlatformFinanceService();
