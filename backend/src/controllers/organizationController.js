import Organization from '../models/Organization.js';
import Subscription from '../models/Subscription.js';
import SupportTicket from '../models/SupportTicket.js';
import PlatformNotification from '../models/PlatformNotification.js';
import AppError from '../utils/AppError.js';

export const getOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return next(new AppError('Organization not found', 404));

    // Fetch active subscription if present
    const subscription = await Subscription.findOne({
      organizationId: req.user.organizationId,
      status: { $in: ['ACTIVE', 'PENDING_APPROVAL', 'PAYMENT_DUE', 'GRACE_PERIOD'] }
    })
      .populate('osProductId', 'name slug businessType')
      .populate('osPlanId', 'name monthlyPrice yearlyPrice setupFee description featureEntitlements usageLimits supportLevel')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      data: { 
        organization: org,
        activeSubscription: subscription || null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const existingOrg = await Organization.findById(req.user.organizationId);
    if (!existingOrg) return next(new AppError('Organization not found', 404));

    // Explicitly sanitize allowed fields to protect subscription, status, and system metadata
    const {
      name,
      legalName,
      phone,
      address,
      city,
      state,
      pincode,
      gstNumber,
      panNumber,
      logo,
      ownerName,
      settings
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (legalName !== undefined) updateData.legalName = legalName;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (panNumber !== undefined) updateData.panNumber = panNumber;
    if (logo !== undefined) updateData.logo = logo;
    if (ownerName !== undefined) updateData.ownerName = ownerName;

    // Deep merge settings
    if (settings && typeof settings === 'object') {
      const currentSettings = existingOrg.settings || {};
      const currentBranding = currentSettings.branding || {};
      const incomingBranding = settings.branding || {};

      updateData.settings = {
        ...currentSettings,
        ...settings,
        branding: {
          ...currentBranding,
          ...incomingBranding
        }
      };
    }

    const org = await Organization.findByIdAndUpdate(
      req.user.organizationId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { organization: org }
    });
  } catch (error) {
    next(error);
  }
};

export const requestUpgrade = async (req, res, next) => {
  try {
    const { targetPlanName, targetPlanTier, billingCycle, note } = req.body;
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return next(new AppError('Organization not found', 404));

    // 1. Create a support ticket for Superadmin HQ
    const ticket = await SupportTicket.create({
      organizationId: org._id,
      subject: `Subscription Plan Upgrade Request: ${targetPlanName || targetPlanTier || 'Higher Tier'}`,
      description: `Tenant "${org.name}" (${org.businessType}) requested a plan upgrade to "${targetPlanName || targetPlanTier}".
Billing Cadence: ${billingCycle || 'monthly'}
Current Tier: ${org.subscription || 'free'}
Requested By: ${req.user.name || 'Admin'} (${req.user.email})
Additional Notes: ${note || 'None provided'}`,
      osProduct: org.businessType || 'CONTRACTOR',
      priority: 'HIGH',
      status: 'OPEN'
    });

    // 2. Notify Superadmins via PlatformNotification
    try {
      await PlatformNotification.create({
        title: `Plan Upgrade Request: ${org.name}`,
        message: `${org.name} has requested an upgrade to ${targetPlanName || targetPlanTier} (${billingCycle || 'monthly'}). Review in Superadmin Support Desk.`,
        type: 'BILLING',
        targetAudience: 'SUPER_ADMINS',
        status: 'PUBLISHED',
        createdBy: req.user._id
      });
    } catch (notifErr) {
      console.warn('PlatformNotification creation warning:', notifErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Upgrade request submitted to Superadmin HQ. Our platform administrator will review and activate your plan.',
      data: { ticketId: ticket._id }
    });
  } catch (error) {
    next(error);
  }
};
