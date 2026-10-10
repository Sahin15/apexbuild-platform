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
      .populate('organizationId', 'name businessType email phone city state')
      .populate('osProductId', 'name slug')
      .populate('osPlanId', 'name monthlyPrice yearlyPrice setupFee description featureEntitlements')
      .sort('-createdAt')
      .lean();
    return { subscriptions };
  }

  async createSubscription(data, adminId, ip, userAgent) {
    let finalAmount = data.finalAmount;
    if (finalAmount === undefined) {
      const base = Number(data.customPrice || data.basePrice) || 0;
      const discount = Number(data.discount) || 0;
      finalAmount = Math.max(0, base - discount);
    }

    const subscription = await Subscription.create({
      ...data,
      finalAmount,
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

  async updateSubscription(id, data, adminId, ip, userAgent) {
    const sub = await Subscription.findById(id);
    if (!sub) return null;

    if (data.basePrice !== undefined) sub.basePrice = Number(data.basePrice);
    if (data.customPrice !== undefined) sub.customPrice = Number(data.customPrice);
    if (data.discount !== undefined) sub.discount = Number(data.discount);
    if (data.billingCycle) sub.billingCycle = data.billingCycle;
    if (data.osPlanId) sub.osPlanId = data.osPlanId;
    if (data.osProductId) sub.osProductId = data.osProductId;
    if (data.status) sub.status = data.status;
    if (data.nextBillingDate) sub.nextBillingDate = new Date(data.nextBillingDate);

    const price = sub.customPrice !== undefined && sub.customPrice !== null ? sub.customPrice : sub.basePrice;
    sub.finalAmount = Math.max(0, (price || 0) - (sub.discount || 0));
    sub.updatedBy = adminId;

    await sub.save();

    await import('../models/AuditLog.js').then(m => m.default.create({
      action: 'PLATFORM_SUBSCRIPTION_UPDATED',
      adminId,
      entityType: 'Subscription',
      entityId: sub._id,
      newValue: { status: sub.status, finalAmount: sub.finalAmount, billingCycle: sub.billingCycle },
      ipAddress: ip,
      userAgent
    }));

    return sub;
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
