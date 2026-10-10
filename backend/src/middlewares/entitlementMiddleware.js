import EntitlementService from '../services/EntitlementService.js';
import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

/**
 * Middleware that restricts access to endpoints unless the tenant's plan or subscription has the required feature entitlement.
 * @param {string} featureKey - Key from FEATURE_REGISTRY (e.g. 'civilPnL', 'drawingVault', 'snagVault')
 */
export const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      // 1. Superadmin bypasses all feature locks
      if (req.user?.platformRole === 'SUPER_ADMIN') {
        return next();
      }

      const orgId = req.user?.organizationId?._id || req.user?.organizationId;
      if (!orgId) {
        return next(new AppError('No organization associated with user session', 403));
      }

      // 2. Check if calling organization is SUPERADMIN businessType
      const org = await Organization.findById(orgId).lean();
      if (org?.businessType === 'SUPERADMIN') {
        return next();
      }

      // 3. Evaluate entitlement
      const result = await EntitlementService.checkEntitlement(orgId, featureKey);

      if (!result.isEntitled) {
        return res.status(403).json({
          status: 'fail',
          code: 'FEATURE_NOT_ENTITLED',
          feature: featureKey,
          featureName: result.featureName,
          currentTier: result.currentTier,
          requiredTier: result.requiredTier,
          planName: result.planName,
          message: `${result.featureName} is available exclusively on the ${result.requiredTier} Plan. Your workspace is currently on ${result.planName} (${result.currentTier} tier). Upgrade your subscription to unlock.`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware that checks if creating a new project would exceed the plan's quota
 */
export const enforceProjectLimit = async (req, res, next) => {
  try {
    if (req.user?.platformRole === 'SUPER_ADMIN') {
      return next();
    }

    const orgId = req.user?.organizationId?._id || req.user?.organizationId;
    if (!orgId) return next();

    const limitCheck = await EntitlementService.checkProjectLimit(orgId);
    if (!limitCheck.allowed) {
      return res.status(403).json({
        status: 'fail',
        code: 'USAGE_LIMIT_EXCEEDED',
        resource: 'projects',
        current: limitCheck.current,
        max: limitCheck.max,
        message: `Plan project limit reached: You have ${limitCheck.current}/${limitCheck.max} active projects. Please upgrade to unlock unlimited projects.`
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
