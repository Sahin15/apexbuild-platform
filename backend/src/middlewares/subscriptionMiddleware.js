import AppError from '../utils/AppError.js';
import Subscription from '../models/Subscription.js';
import OSPlan from '../models/OSPlan.js';
import OSProduct from '../models/OSProduct.js';

export const checkSubscriptionAccess = (osSlug) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user.organizationId;
      
      const osProduct = await OSProduct.findOne({ slug: osSlug });
      if (!osProduct) {
        return next(new AppError('OS Product not found', 404));
      }

      const subscription = await Subscription.findOne({
        organizationId,
        osProductId: osProduct._id,
      }).sort('-createdAt');

      if (!subscription) {
        return next(new AppError(`No subscription found for ${osSlug}`, 403));
      }

      // Allow access if active or in grace period
      if (!['ACTIVE', 'GRACE_PERIOD', 'RESTRICTED'].includes(subscription.status)) {
        return next(new AppError(`Subscription is ${subscription.status}. Access denied.`, 403));
      }

      // Attach subscription to request for further checks
      req.subscription = subscription;
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        return next(new AppError('Subscription context missing. Use checkSubscriptionAccess first.', 500));
      }

      // If subscription is RESTRICTED, block all write/advanced actions
      // (This requires careful tagging of routes, but generally restricted means read-only)
      if (req.subscription.status === 'RESTRICTED' && req.method !== 'GET') {
        return next(new AppError('Account is RESTRICTED due to overdue payment. Please pay to unlock features.', 403));
      }

      const plan = await OSPlan.findById(req.subscription.osPlanId);
      if (!plan) {
        return next(new AppError('Plan not found', 404));
      }

      const hasFeature = plan.featureEntitlements?.[featureKey] === true || plan.featureEntitlements?.[featureKey] === 'true';
      
      if (!hasFeature) {
        return next(new AppError(`Your current plan does not support the ${featureKey} feature. Please upgrade.`, 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const checkUsageLimit = (limitKey) => {
  return async (req, res, next) => {
    try {
      if (!req.subscription) {
        return next(new AppError('Subscription context missing.', 500));
      }

      const plan = await OSPlan.findById(req.subscription.osPlanId);
      if (!plan || !plan.usageLimits) {
        return next(); // No limits defined
      }

      const limit = plan.usageLimits[limitKey];
      if (limit === undefined || limit === -1) {
        return next(); // Unlimited
      }

      // Here you would typically count current usage from the DB.
      // Since this is generic, we'll attach the limit to the req for the controller to check,
      // OR we can pass a model and query it here, but attaching is simpler.
      req.usageLimit = limit;
      next();
    } catch (error) {
      next(error);
    }
  };
};
