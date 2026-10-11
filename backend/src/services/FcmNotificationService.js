import { isFirebaseConfigured, getFirebaseMessaging } from '../config/firebase.js';
import FcmToken from '../models/FcmToken.js';
import Notification from '../models/Notification.js';

class FcmNotificationService {
  /**
   * Send FCM message to a single device token
   */
  async sendToDevice(token, { title, body, data = {}, icon = '/pwa-192x192.png', clickAction = '/' }) {
    if (!isFirebaseConfigured()) {
      console.log(`[FCM-SIMULATED] -> Device (${token.substring(0, 10)}...): "${title}" - "${body}"`);
      return { success: true, simulated: true };
    }

    const messaging = getFirebaseMessaging();
    const stringifiedData = {};
    for (const [k, v] of Object.entries(data)) {
      stringifiedData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }

    const message = {
      token,
      notification: {
        title,
        body,
        imageUrl: icon
      },
      data: {
        ...stringifiedData,
        click_action: clickAction,
        url: clickAction
      },
      webpush: {
        fcmOptions: {
          link: clickAction
        },
        notification: {
          icon,
          badge: '/pwa-192x192.png',
          vibrate: [100, 50, 100]
        }
      }
    };

    try {
      const response = await messaging.send(message);
      await FcmToken.updateOne({ token }, { lastUsedAt: new Date() });
      return { success: true, messageId: response };
    } catch (error) {
      if (
        error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token'
      ) {
        await FcmToken.updateOne({ token }, { isActive: false });
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Send FCM message to a Topic (e.g. 'tenant-orgId-drivers')
   */
  async sendToTopic(topic, { title, body, data = {}, icon = '/pwa-192x192.png', clickAction = '/' }) {
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]+/g, '_');

    if (!isFirebaseConfigured()) {
      console.log(`[FCM-SIMULATED] -> Topic (${sanitizedTopic}): "${title}" - "${body}"`);
      return { success: true, simulated: true, topic: sanitizedTopic };
    }

    const messaging = getFirebaseMessaging();
    const stringifiedData = {};
    for (const [k, v] of Object.entries(data)) {
      stringifiedData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }

    const message = {
      topic: sanitizedTopic,
      notification: {
        title,
        body,
        imageUrl: icon
      },
      data: {
        ...stringifiedData,
        click_action: clickAction,
        url: clickAction
      },
      webpush: {
        fcmOptions: {
          link: clickAction
        },
        notification: {
          icon,
          badge: '/pwa-192x192.png'
        }
      }
    };

    try {
      const response = await messaging.send(message);
      return { success: true, messageId: response, topic: sanitizedTopic };
    } catch (error) {
      console.error('[FCM] Error sending to topic:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send FCM message to all active tokens of an Organization/Platform
   */
  async sendToOrganization(organizationId, platform, { title, body, data = {}, icon = '/pwa-192x192.png', clickAction = '/' }) {
    try {
      const query = { organizationId, isActive: true };
      if (platform && platform !== 'ALL') {
        query.$or = [{ platform }, { platform: 'ALL' }];
      }

      const fcmDocs = await FcmToken.find(query);
      if (!fcmDocs || fcmDocs.length === 0) {
        return { success: true, sent: 0, message: 'No active FCM tokens for this organization' };
      }

      const results = await Promise.allSettled(
        fcmDocs.map(doc => this.sendToDevice(doc.token, { title, body, data, icon, clickAction }))
      );

      const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;

      // Also persist in-app notification record
      try {
        await Notification.create({
          organizationId,
          type: 'FCM_BROADCAST',
          title,
          message: body,
          metadata: { clickAction, platform, ...data }
        });
      } catch (e) {
        // non-blocking
      }

      return {
        success: true,
        sent: successful,
        total: fcmDocs.length
      };
    } catch (error) {
      console.error('[FCM] Error in sendToOrganization:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe an array of registration tokens to an FCM Topic
   */
  async subscribeToTopic(tokens, topic) {
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]+/g, '_');
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];

    if (!isFirebaseConfigured()) {
      return { success: true, simulated: true, subscribedCount: tokenList.length };
    }

    try {
      const messaging = getFirebaseMessaging();
      const response = await messaging.subscribeToTopic(tokenList, sanitizedTopic);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        topic: sanitizedTopic
      };
    } catch (error) {
      console.error('[FCM] Error subscribing to topic:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Unsubscribe registration tokens from an FCM Topic
   */
  async unsubscribeFromTopic(tokens, topic) {
    const sanitizedTopic = topic.replace(/[^a-zA-Z0-9-_.~%]+/g, '_');
    const tokenList = Array.isArray(tokens) ? tokens : [tokens];

    if (!isFirebaseConfigured()) {
      return { success: true, simulated: true };
    }

    try {
      const messaging = getFirebaseMessaging();
      const response = await messaging.unsubscribeFromTopic(tokenList, sanitizedTopic);
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        topic: sanitizedTopic
      };
    } catch (error) {
      console.error('[FCM] Error unsubscribing from topic:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default new FcmNotificationService();
