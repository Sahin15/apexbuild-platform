import { getFirebasePublicConfig, isFirebaseConfigured } from '../config/firebase.js';
import FcmToken from '../models/FcmToken.js';
import FcmNotificationService from '../services/FcmNotificationService.js';
import AppError from '../utils/AppError.js';

/**
 * Get client public Firebase configuration
 */
export const getClientConfig = (req, res) => {
  const config = getFirebasePublicConfig();
  res.status(200).json({
    status: 'success',
    data: {
      config,
      isServerConfigured: isFirebaseConfigured()
    }
  });
};

/**
 * Register or refresh a device FCM registration token
 */
export const registerToken = async (req, res, next) => {
  try {
    const { token, deviceType = 'web', platform } = req.body;

    if (!token) {
      return next(new AppError('FCM registration token is required', 400));
    }

    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const userId = req.user._id;
    const resolvedPlatform = platform || req.user.organizationId?.businessType || 'ALL';

    const tenantTopic = `tenant_${orgId}`;
    const platformTopic = `tenant_${orgId}_${resolvedPlatform.toLowerCase()}`;
    const topics = [tenantTopic, platformTopic];

    const tokenDoc = await FcmToken.findOneAndUpdate(
      { token },
      {
        userId,
        organizationId: orgId,
        platform: resolvedPlatform,
        deviceType,
        topics,
        isActive: true,
        lastUsedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Auto-subscribe token to tenant topics
    await FcmNotificationService.subscribeToTopic(token, tenantTopic);
    await FcmNotificationService.subscribeToTopic(token, platformTopic);

    res.status(201).json({
      status: 'success',
      message: 'FCM device token registered and subscribed to topics',
      data: {
        tokenId: tokenDoc._id,
        topics: tokenDoc.topics
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate or unregister an FCM token
 */
export const unregisterToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new AppError('Token is required', 400));
    }

    await FcmToken.updateMany(
      { token, userId: req.user._id },
      { isActive: false }
    );

    res.status(200).json({
      status: 'success',
      message: 'FCM device token unregistered'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send test FCM push notification to current user
 */
export const sendTestMessage = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const orgId = req.user.organizationId?._id || req.user.organizationId;

    const tokens = await FcmToken.find({ userId, isActive: true });

    if (!tokens || tokens.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'No active FCM tokens registered for this user account. Please enable FCM on this device first.',
        data: { sent: 0 }
      });
    }

    const title = '🔥 ApexBuild Firebase Cloud Message';
    const body = `FCM notification channel is verified live for ${req.user.name || 'User'}!`;
    const clickAction = '/';

    const results = await Promise.allSettled(
      tokens.map(t =>
        FcmNotificationService.sendToDevice(t.token, {
          title,
          body,
          data: { source: 'fcm_test', timestamp: Date.now() },
          clickAction
        })
      )
    );

    const sentCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;

    res.status(200).json({
      status: 'success',
      message: `Test FCM push dispatched to ${sentCount}/${tokens.length} device(s)`,
      data: {
        sentCount,
        totalTokens: tokens.length,
        isServerConfigured: isFirebaseConfigured()
      }
    });
  } catch (error) {
    next(error);
  }
};
