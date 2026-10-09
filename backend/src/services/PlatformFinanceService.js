import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import Subscription from '../models/Subscription.js';

class PlatformFinanceService {
  // --- INVOICES ---
  async getInvoices() {
    return await Invoice.find()
      .populate('organizationId', 'name businessType email')
      .populate('osProductId', 'name')
      .sort('-createdAt')
      .lean();
  }

  async getImplementationFees() {
    return await Invoice.find({ type: 'IMPLEMENTATION' })
      .populate('organizationId', 'name businessType email')
      .populate('osProductId', 'name')
      .sort('-createdAt')
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

    const pendingInvoices = await Invoice.find({ status: { $in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] } });
    const totalOutstanding = pendingInvoices.reduce((sum, i) => sum + i.dueAmount, 0);

    return {
      mrr,
      arr,
      totalCollected,
      totalOutstanding
    };
  }

  async createInvoice(data, adminId, ip, userAgent) {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    
    // Automatically calculate tax and totals if missing
    const subtotal = (data.implementationFee || 0) + (data.subscriptionFee || 0);
    const tax = data.tax ?? (subtotal * 0.18); // Default 18% tax if not specified
    const total = subtotal + tax - (data.discount || 0);
    
    const dueDate = data.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

    const invoice = await Invoice.create({
      ...data,
      invoiceNumber,
      tax,
      total,
      dueAmount: total,
      dueDate,
      status: 'ISSUED'
    });

    await AuditLog.create({
      action: 'INVOICE_GENERATED',
      adminId,
      entityType: 'Invoice',
      entityId: invoice._id,
      newValue: { invoiceNumber, total },
      ipAddress: ip,
      userAgent
    });

    return invoice;
  }

  async updateInvoiceStatus(id, status, adminId, ip, userAgent) {
    const invoice = await Invoice.findByIdAndUpdate(id, { status }, { new: true });
    if (!invoice) return null;

    await AuditLog.create({
      action: 'INVOICE_STATUS_UPDATED',
      adminId,
      entityType: 'Invoice',
      entityId: invoice._id,
      newValue: { status },
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
