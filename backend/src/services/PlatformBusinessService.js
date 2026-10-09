import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import AuditLog from '../models/AuditLog.js';

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
    
    const subscriptions = await Subscription.find({ organizationId: id }).lean();

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

    // We don't necessarily create a user here, or we can create a temporary admin user
    // A standard SaaS would create the OWNER user
    const tempPasswordHash = 'xyz1234567890dummyhash'; // will be hashed by pre-save hook
    await User.create({
      organizationId: account._id,
      name: `${name} Admin`,
      email,
      passwordHash: tempPasswordHash,
      role: 'OWNER',
      status: 'inactive' // pending invite acceptance
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
}

export default new PlatformBusinessService();
