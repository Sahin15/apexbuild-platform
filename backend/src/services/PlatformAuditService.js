import AuditLog from '../models/AuditLog.js';

class PlatformAuditService {
  async getAuditLogs(query) {
    const { page = 1, limit = 50, action, entityType } = query;
    
    const filter = {};
    if (action) filter.action = action;
    if (entityType) filter.entityType = entityType;

    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filter)
      .populate('adminId', 'name email platformRole')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await AuditLog.countDocuments(filter);

    return {
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getRecentActivity(limit = 10) {
    return await AuditLog.find()
      .populate('adminId', 'name')
      .sort('-createdAt')
      .limit(limit)
      .lean();
  }
}

export default new PlatformAuditService();
