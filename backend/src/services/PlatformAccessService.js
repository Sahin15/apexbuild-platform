import User from '../models/User.js';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

class PlatformAccessService {
  async getTeamMembers() {
    // Platform members are identified by having a platformRole that is not 'NONE'
    return await User.find({ platformRole: { $ne: 'NONE' } })
      .select('-passwordHash')
      .sort('-createdAt')
      .lean();
  }

  async createTeamMember(data, adminId, ip, userAgent) {
    // Platform users must be tied to the master "HQ" Organization.
    // If it doesn't exist, we will attach them to a dummy or the first org for now,
    // but ideally, the system configures a Super Admin Org. 
    // We will find the org the admin belongs to and reuse it since the admin is creating them.
    const adminUser = await User.findById(adminId);
    if (!adminUser) throw new AppError('Admin user not found', 404);

    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) throw new AppError('A user with this email already exists', 400);

    const newUser = await User.create({
      organizationId: adminUser.organizationId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      passwordHash: data.password, // handled by pre-save hook
      role: 'ADMIN', // Generic business role
      platformRole: data.platformRole,
      status: 'active'
    });

    await AuditLog.create({
      action: 'TEAM_MEMBER_CREATED',
      adminId,
      entityType: 'User',
      entityId: newUser._id,
      newValue: { email: newUser.email, platformRole: newUser.platformRole },
      ipAddress: ip,
      userAgent
    });

    const userObj = newUser.toObject();
    delete userObj.passwordHash;
    return userObj;
  }

  async updateTeamMemberStatus(id, status, adminId, ip, userAgent) {
    if (id.toString() === adminId.toString()) {
      throw new AppError('You cannot suspend your own account', 400);
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select('-passwordHash');
    if (!user) return null;

    await AuditLog.create({
      action: 'TEAM_MEMBER_STATUS_UPDATED',
      adminId,
      entityType: 'User',
      entityId: user._id,
      newValue: { status },
      ipAddress: ip,
      userAgent
    });

    return user;
  }
}

export default new PlatformAccessService();
