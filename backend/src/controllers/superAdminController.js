import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import AppError from '../utils/AppError.js';

export const getAllOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find({ businessType: { $ne: 'SUPERADMIN' } }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { organizations: orgs } });
  } catch (error) { next(error); }
};

export const updateOrganizationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const org = await Organization.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true });
    
    if (!org) return next(new AppError('Organization not found', 404));

    // Also update all users belonging to this organization to match status
    const userStatus = status === 'active' ? 'active' : 'inactive';
    await User.updateMany({ organizationId: org._id }, { status: userStatus });

    res.status(200).json({ status: 'success', data: { organization: org } });
  } catch (error) { next(error); }
};

export const updateOrganizationSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;
    const org = await Organization.findByIdAndUpdate(req.params.id, { subscription }, { new: true, runValidators: true });
    
    if (!org) return next(new AppError('Organization not found', 404));

    res.status(200).json({ status: 'success', data: { organization: org } });
  } catch (error) { next(error); }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const totalOrgs = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' } });
    const pendingOrgs = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' }, status: 'pending' });
    const activeOrgs = await Organization.countDocuments({ businessType: { $ne: 'SUPERADMIN' }, status: 'active' });
    
    // Premium orgs can now mean organizations with an active subscription
    const premiumOrgs = await Subscription.countDocuments({ status: 'ACTIVE' });

    // Calculate MRR and ARR
    const activeSubscriptions = await Subscription.find({ status: 'ACTIVE' });
    let mrr = 0;
    let arr = 0;

    activeSubscriptions.forEach(sub => {
      if (sub.billingCycle === 'monthly') {
        mrr += sub.finalAmount;
        arr += sub.finalAmount * 12;
      } else if (sub.billingCycle === 'yearly') {
        arr += sub.finalAmount;
        mrr += sub.finalAmount / 12;
      }
    });

    res.status(200).json({ 
      status: 'success', 
      data: { 
        stats: { totalOrgs, pendingOrgs, activeOrgs, premiumOrgs, mrr: Math.round(mrr), arr: Math.round(arr) } 
      } 
    });
  } catch (error) { next(error); }
};
