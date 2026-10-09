import OSProduct from '../models/OSProduct.js';
import OSPlan from '../models/OSPlan.js';
import Subscription from '../models/Subscription.js';
import AppError from '../utils/AppError.js';
import AuditLog from '../models/AuditLog.js';

// OS Products
export const getOSProducts = async (req, res, next) => {
  try {
    const products = await OSProduct.find();
    res.status(200).json({ status: 'success', data: { products } });
  } catch (error) { next(error); }
};

export const createOSProduct = async (req, res, next) => {
  try {
    const product = await OSProduct.create(req.body);
    res.status(201).json({ status: 'success', data: { product } });
  } catch (error) { next(error); }
};

// Plans
export const getOSPlans = async (req, res, next) => {
  try {
    const plans = await OSPlan.find().populate('osProductId');
    res.status(200).json({ status: 'success', data: { plans } });
  } catch (error) { next(error); }
};

export const createOSPlan = async (req, res, next) => {
  try {
    const plan = await OSPlan.create(req.body);
    res.status(201).json({ status: 'success', data: { plan } });
  } catch (error) { next(error); }
};

// Subscriptions
export const getSubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find().populate('organizationId osProductId osPlanId businessPartnerId');
    res.status(200).json({ status: 'success', data: { subscriptions } });
  } catch (error) { next(error); }
};

export const createSubscription = async (req, res, next) => {
  try {
    const plan = await OSPlan.findById(req.body.osPlanId);
    if (!plan) return next(new AppError('Plan not found', 404));

    // If new subscription is ACTIVE, cancel all other active subscriptions for this organization
    if (req.body.status === 'ACTIVE' || !req.body.status) {
      await Subscription.updateMany(
        { organizationId: req.body.organizationId, status: 'ACTIVE' },
        { $set: { status: 'CANCELLED', cancellationDate: new Date() } }
      );
    }

    const basePrice = req.body.billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;

    const sub = await Subscription.create({ 
      ...req.body, 
      basePrice,
      finalAmount: basePrice,
      createdBy: req.user._id 
    });
    res.status(201).json({ status: 'success', data: { subscription: sub } });
  } catch (error) { next(error); }
};

export const updateSubscription = async (req, res, next) => {
  try {
    const sub = await Subscription.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true });
    
    await AuditLog.create({
      action: 'SUBSCRIPTION_UPDATED',
      adminId: req.user._id,
      entityType: 'Subscription',
      entityId: sub._id,
      newValue: req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ status: 'success', data: { subscription: sub } });
  } catch (error) { next(error); }
};
