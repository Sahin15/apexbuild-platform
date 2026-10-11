import webpush from '../config/vapid.js';
import PushSubscription from '../models/PushSubscription.js';
import Notification from '../models/Notification.js';

class PushNotificationService {
  /**
   * Dispatch a Web Push Notification to active subscribers
   */
  async sendNotification({
    organizationId,
    userIds,
    platform,
    title,
    body,
    icon = '/pwa-192x192.png',
    badge = '/pwa-192x192.png',
    url = '/',
    tag,
    data = {},
    actions = []
  }) {
    try {
      const query = { isActive: true };

      if (organizationId) {
        query.organizationId = organizationId;
      }

      if (userIds) {
        const idList = Array.isArray(userIds) ? userIds : [userIds];
        query.userId = { $in: idList };
      }

      if (platform && platform !== 'ALL') {
        query.$or = [{ platform }, { platform: 'ALL' }];
      }

      const subscriptions = await PushSubscription.find(query);

      if (!subscriptions || subscriptions.length === 0) {
        return { success: true, sent: 0, failed: 0, message: 'No active subscriptions found' };
      }

      const payload = JSON.stringify({
        title: title || 'ApexBuild Alert',
        body: body || '',
        icon,
        badge,
        tag: tag || `apex-alert-${Date.now()}`,
        data: {
          url: url || '/',
          timestamp: Date.now(),
          platform,
          ...data
        },
        vibrate: [100, 50, 100],
        actions
      });

      let sentCount = 0;
      let failedCount = 0;

      const sendPromises = subscriptions.map(async (sub) => {
        const pushConfig = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth
          }
        };

        try {
          await webpush.sendNotification(pushConfig, payload);
          sentCount++;
          // Update last used timestamp
          await PushSubscription.updateOne({ _id: sub._id }, { lastUsedAt: new Date() });
        } catch (err) {
          failedCount++;
          // HTTP 410 (Gone) or 404 (Not Found) means expired/unregistered push token
          if (err.statusCode === 410 || err.statusCode === 404) {
            await PushSubscription.updateOne({ _id: sub._id }, { isActive: false });
          }
        }
      });

      await Promise.allSettled(sendPromises);

      // Create in-app notification records for audit / notification tray
      if (userIds && organizationId) {
        const targetUsers = Array.isArray(userIds) ? userIds : [userIds];
        const notifDocs = targetUsers.map(uId => ({
          recipientId: uId,
          organizationId,
          type: tag || 'SYSTEM_PUSH',
          title: title || 'System Notification',
          message: body || '',
          metadata: { url, platform, ...data }
        }));
        try {
          await Notification.insertMany(notifDocs);
        } catch (notifErr) {
          // In-app log failure non-blocking
        }
      }

      return {
        success: true,
        sent: sentCount,
        failed: failedCount,
        total: subscriptions.length
      };
    } catch (error) {
      console.error('[PushNotificationService] Error dispatching push:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new PushNotificationService();
