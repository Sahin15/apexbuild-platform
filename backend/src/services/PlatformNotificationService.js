import PlatformNotification from '../models/PlatformNotification.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

class PlatformNotificationService {
  async getNotifications() {
    return await PlatformNotification.find()
      .populate('createdBy', 'name')
      .populate('targetOrganizations', 'name')
      .sort('-createdAt')
      .lean();
  }

  async createNotification(data, adminId, ip, userAgent) {
    const notification = await PlatformNotification.create({
      title: data.title,
      message: data.message,
      type: data.type,
      targetAudience: data.targetAudience,
      targetOrganizations: data.targetOrganizations || [],
      status: 'PUBLISHED', // Directly publishing for simplicity in Phase 12
      createdBy: adminId
    });

    await AuditLog.create({
      action: 'PLATFORM_NOTIFICATION_SENT',
      adminId,
      entityType: 'PlatformNotification',
      entityId: notification._id,
      newValue: { title: notification.title, type: notification.type },
      ipAddress: ip,
      userAgent
    });

    return notification;
  }

  async deleteNotification(id, adminId, ip, userAgent) {
    const notification = await PlatformNotification.findByIdAndDelete(id);
    if (!notification) throw new AppError('Notification not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_NOTIFICATION_DELETED',
      adminId,
      entityType: 'PlatformNotification',
      entityId: notification._id,
      newValue: { title: notification.title },
      ipAddress: ip,
      userAgent
    });

    return null;
  }
}

export default new PlatformNotificationService();
