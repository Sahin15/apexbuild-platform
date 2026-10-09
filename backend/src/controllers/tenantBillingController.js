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
      .populate('osPlanId', 'name features')
      .sort('-createdAt');
      
    res.status(200).json({ status: 'success', data: { subscriptions } });
  } catch (error) { next(error); }
};

export const getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ organizationId: req.user.organizationId })
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
      amount,
      paymentMethod,
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
    
    const invoice = await Invoice.create({
      organizationId: req.user.organizationId,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      subtotal: amount,
      taxAmount: amount * 0.18, // 18% GST approx
      total: amount * 1.18,
      dueAmount: amount * 1.18,
      status: 'PENDING'
    });

    res.status(200).json({ status: 'success', message: 'Upgrade requested. Invoice generated.', data: { invoice } });
  } catch(error) { next(error); }
};
