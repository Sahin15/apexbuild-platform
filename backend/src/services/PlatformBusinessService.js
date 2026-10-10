import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import AuditLog from '../models/AuditLog.js';
import OSPlan from '../models/OSPlan.js';
import Invoice from '../models/Invoice.js';

class PlatformBusinessService {
  async getPaginatedAccounts(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { businessType: { $ne: 'SUPERADMIN' } };

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } }
      ];
    }

    if (query.businessType && query.businessType !== 'ALL') {
      filter.businessType = query.businessType;
    }

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    const total = await Organization.countDocuments(filter);
    const accounts = await Organization.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('partnerId', 'name')
      .lean();

    return {
      accounts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAccountDetails(id) {
    const account = await Organization.findById(id).populate('partnerId', 'name').lean();
    if (!account) return null;

    const usersCount = await User.countDocuments({ organizationId: id });
    const activeUsersCount = await User.countDocuments({ organizationId: id, status: 'active' });
    
    // Attempt to get last login across users
    const lastLoginUser = await User.findOne({ organizationId: id }).sort('-lastLoginAt').lean();
    
    const subscriptions = await Subscription.find({ organizationId: id })
      .populate('osProductId')
      .populate('osPlanId')
      .lean();

    return {
      ...account,
      technicalState: {
        totalUsers: usersCount,
        activeUsers: activeUsersCount,
        lastActiveAt: lastLoginUser?.lastLoginAt || account.createdAt,
      },
      subscriptions
    };
  }

  async createAccount(data, adminId, ip, userAgent) {
    const { name, email, phone, businessType } = data;
    
    // Check if email already exists in users or orgs
    const existingOrg = await Organization.findOne({ email });
    const existingUser = await User.findOne({ email });
    
    if (existingOrg || existingUser) {
      throw new Error('Email is already registered in the system.');
    }

    const account = await Organization.create({
      name,
      email,
      phone,
      businessType,
      status: 'pending'
    });

    const tempPasswordHash = 'xyz1234567890dummyhash';
    await User.create({
      organizationId: account._id,
      name: `${name} Admin`,
      email,
      passwordHash: tempPasswordHash,
      role: 'OWNER',
      status: 'inactive'
    });

    await AuditLog.create({
      action: 'BUSINESS_ACCOUNT_CREATED',
      adminId,
      entityType: 'Organization',
      entityId: account._id,
      newValue: { name, email, businessType },
      ipAddress: ip,
      userAgent: userAgent
    });

    return account;
  }

  async updateAccountStatus(id, updateData, adminId, ip, userAgent) {
    const account = await Organization.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!account) return null;

    if (updateData.status) {
      const userStatus = updateData.status === 'active' ? 'active' : 'inactive';
      await User.updateMany({ organizationId: account._id }, { status: userStatus });
    }

    await AuditLog.create({
      action: 'BUSINESS_ACCOUNT_UPDATED',
      adminId,
      entityType: 'Organization',
      entityId: account._id,
      newValue: updateData,
      ipAddress: ip,
      userAgent: userAgent
    });

    return account;
  }

  async verifyAndActivateAccount(id, verificationData, adminId, ip, userAgent) {
    const org = await Organization.findById(id);
    if (!org) return null;

    const {
      osProductId,
      osPlanId,
      billingCycle = 'monthly',
      customPrice,
      discount = 0,
      setupFee = 0,
      internalNotes
    } = verificationData;

    let plan = null;
    if (osPlanId) {
      plan = await OSPlan.findById(osPlanId);
    }

    const basePrice = plan ? (billingCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice) : 0;
    const finalPrice = customPrice !== undefined && customPrice !== '' ? Number(customPrice) : basePrice;
    const discountAmount = Number(discount) || 0;
    const recurringAmount = Math.max(0, finalPrice - discountAmount);
    const implementationCost = Number(setupFee) || (plan?.setupFee || 0);

    // 1. Activate Organization
    org.status = 'active';
    org.approvalDate = new Date();
    if (internalNotes) org.internalNotes = internalNotes;
    if (plan) org.subscription = plan.name;
    await org.save();

    // 2. Activate all users for this Organization
    await User.updateMany({ organizationId: org._id }, { status: 'active' });

    // 3. Create or Update Subscription if plan provided
    let subscription = null;
    if (plan) {
      const nextBilling = new Date();
      if (billingCycle === 'yearly') {
        nextBilling.setFullYear(nextBilling.getFullYear() + 1);
      } else {
        nextBilling.setMonth(nextBilling.getMonth() + 1);
      }

      subscription = await Subscription.findOneAndUpdate(
        { organizationId: org._id },
        {
          organizationId: org._id,
          osProductId: osProductId || plan.osProductId,
          osPlanId: plan._id,
          billingCycle,
          basePrice,
          customPrice: finalPrice,
          discount: discountAmount,
          finalAmount: recurringAmount,
          status: 'ACTIVE',
          startDate: new Date(),
          nextBillingDate: nextBilling,
          createdBy: adminId,
          updatedBy: adminId
        },
        { upsert: true, new: true }
      );

      // 4. Create Initial Invoice if applicable
      const totalFirstInvoice = recurringAmount + implementationCost;
      if (totalFirstInvoice > 0) {
        const invoiceCount = await Invoice.countDocuments();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1001).padStart(5, '0')}`;
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 14);

        await Invoice.create({
          invoiceNumber,
          organizationId: org._id,
          osProductId: osProductId || plan.osProductId,
          subscriptionId: subscription._id,
          osPlanId: plan._id,
          type: implementationCost > 0 ? 'IMPLEMENTATION' : 'SUBSCRIPTION',
          implementationFee: implementationCost,
          subscriptionFee: recurringAmount,
          discount: discountAmount,
          total: totalFirstInvoice,
          paidAmount: 0,
          dueAmount: totalFirstInvoice,
          status: 'ISSUED',
          issueDate: new Date(),
          dueDate
        });
      }
    }

    // 5. Create Audit Trail
    await AuditLog.create({
      action: 'BUSINESS_ACCOUNT_VERIFIED_AND_ACTIVATED',
      adminId,
      entityType: 'Organization',
      entityId: org._id,
      newValue: {
        status: 'active',
        planName: plan?.name,
        billingCycle,
        recurringAmount,
        implementationCost,
        internalNotes
      },
      ipAddress: ip,
      userAgent
    });

    return { account: org, subscription };
  }
}

export default new PlatformBusinessService();
