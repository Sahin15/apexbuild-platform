import Subscription from '../models/Subscription.js';

class PlatformSubscriptionService {
  async getUpcomingRenewals() {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return await Subscription.find({
      status: { $in: ['ACTIVE', 'GRACE_PERIOD', 'PAYMENT_DUE'] },
      nextBillingDate: {
        $gte: today,
        $lte: thirtyDaysFromNow
      }
    })
    .populate('organizationId', 'name businessType email phone')
    .populate('osProductId', 'name')
    .populate('osPlanId', 'name')
    .sort('nextBillingDate')
    .lean();
  }
  async getPaginatedSubscriptions(query) {
    const subscriptions = await Subscription.find()
      .populate('organizationId', 'name businessType email')
      .populate('osProductId', 'name')
      .populate('osPlanId', 'name')
      .sort('-createdAt')
      .lean();
    return { subscriptions };
  }

  async createSubscription(data, adminId, ip, userAgent) {
    // Add logic here to find plan and set basePrice if missing, or just accept data
    const subscription = await Subscription.create({
      ...data,
      createdBy: adminId
    });
    
    await import('../models/AuditLog.js').then(m => m.default.create({
      action: 'PLATFORM_SUBSCRIPTION_CREATED',
      adminId,
      entityType: 'Subscription',
      entityId: subscription._id,
      newValue: { status: subscription.status, finalAmount: subscription.finalAmount },
      ipAddress: ip,
      userAgent
    }));

    return subscription;
  }

  async updateSubscriptionStatus(id, status, adminId, ip, userAgent) {
    const subscription = await Subscription.findByIdAndUpdate(id, { status, updatedBy: adminId }, { new: true });
    if (!subscription) return null;

    await import('../models/AuditLog.js').then(m => m.default.create({
      action: 'PLATFORM_SUBSCRIPTION_STATUS_UPDATED',
      adminId,
      entityType: 'Subscription',
      entityId: subscription._id,
      newValue: { status },
      ipAddress: ip,
      userAgent
    }));

    return subscription;
  }
}

export default new PlatformSubscriptionService();
