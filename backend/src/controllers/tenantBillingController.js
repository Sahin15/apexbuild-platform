import Subscription from '../models/Subscription.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';
import AppError from '../utils/AppError.js';
import OSProduct from '../models/OSProduct.js';
import OSPlan from '../models/OSPlan.js';
import Organization from '../models/Organization.js';

export const getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ organizationId: req.user.organizationId })
      .populate('osProductId', 'name slug')
      .populate('osPlanId', 'name monthlyPrice yearlyPrice setupFee description featureEntitlements usageLimits supportLevel')
      .sort('-createdAt');
      
    res.status(200).json({ status: 'success', data: { subscriptions } });
  } catch (error) { next(error); }
};

export const getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ organizationId: req.user.organizationId })
      .populate('osProductId', 'name slug')
      .populate('osPlanId', 'name monthlyPrice yearlyPrice')
      .sort('-issueDate');
      
    res.status(200).json({ status: 'success', data: { invoices } });
  } catch (error) { next(error); }
};

export const submitPayment = async (req, res, next) => {
  try {
    const { invoiceId, subscriptionId, amount, paymentMethod, transactionReference } = req.body;
    
    // Validate invoice belongs to this organization
    const invoice = await Invoice.findOne({ _id: invoiceId, organizationId: req.user.organizationId });
    if (!invoice) return next(new AppError('Invoice not found or access denied', 404));

    // Create a payment record
    const payment = await Payment.create({
      organizationId: req.user.organizationId,
      invoiceId,
      subscriptionId,
      amount: Number(amount) || invoice.dueAmount,
      paymentMethod: paymentMethod || 'UPI',
      transactionReference,
      status: 'SUBMITTED',
      paymentDate: new Date()
    });

    res.status(201).json({ status: 'success', data: { payment } });
  } catch (error) { next(error); }
};

export const getAvailablePlans = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return next(new AppError('Organization not found', 404));

    const slugMap = {
      'CONTRACTOR': 'contractor',
      'MATERIAL_SUPPLIER': 'supplier',
      'CHICKEN_DISTRIBUTOR': 'distributor',
      'DIAGNOSTICS': 'diagnostics'
    };
    
    const osSlug = slugMap[org.businessType] || org.businessType.toLowerCase();
    
    const osProduct = await OSProduct.findOne({ slug: osSlug });
    if (!osProduct) return res.status(200).json({ status: 'success', data: { plans: [] } });

    const plans = await OSPlan.find({ osProductId: osProduct._id, isActive: true });
    res.status(200).json({ status: 'success', data: { plans } });
  } catch (error) { next(error); }
};

export const requestPlanUpgrade = async (req, res, next) => {
  try {
    const { planId, billingCycle } = req.body;
    const plan = await OSPlan.findById(planId);
    if (!plan) return next(new AppError('Plan not found', 404));
    
    const amount = billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1001).padStart(5, '0')}`;
    const tax = amount * 0.18;
    const total = amount + tax;
    
    const invoice = await Invoice.create({
      organizationId: req.user.organizationId,
      osProductId: plan.osProductId,
      osPlanId: plan._id,
      invoiceNumber,
      type: 'SUBSCRIPTION',
      subscriptionFee: amount,
      tax,
      total,
      dueAmount: total,
      paidAmount: 0,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'ISSUED'
    });

    res.status(200).json({ status: 'success', message: 'Upgrade requested. Invoice generated.', data: { invoice } });
  } catch(error) { next(error); }
};
