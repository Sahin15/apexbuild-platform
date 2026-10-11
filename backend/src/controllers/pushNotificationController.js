import { getVapidPublicKey } from '../config/vapid.js';
import PushSubscription from '../models/PushSubscription.js';
import PushNotificationService from '../services/PushNotificationService.js';
import AppError from '../utils/AppError.js';

/**
 * Get VAPID Public Key for client browser subscription
 */
export const getPublicKey = (req, res) => {
  const publicKey = getVapidPublicKey();
  if (!publicKey) {
    return res.status(500).json({
      status: 'error',
      message: 'VAPID public key is not configured'
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      publicKey
    }
  });
};

/**
 * Register or update a browser push subscription
 */
export const subscribe = async (req, res, next) => {
  try {
    const { subscription, platform, userAgent, deviceType } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return next(new AppError('Invalid subscription object. Endpoint and keys are required.', 400));
    }

    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const userId = req.user._id;

    const subDoc = await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        organizationId: orgId,
        userId: userId,
        platform: platform || req.user.organizationId?.businessType || 'ALL',
        expirationTime: subscription.expirationTime || null,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        },
        userAgent: userAgent || req.headers['user-agent'] || '',
        deviceType: deviceType || 'unknown',
        isActive: true,
        lastUsedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      status: 'success',
      message: 'Push subscription registered successfully',
      data: {
        subscriptionId: subDoc._id,
        platform: subDoc.platform
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unsubscribe or deactivate a browser push subscription
 */
export const unsubscribe = async (req, res, next) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return next(new AppError('Subscription endpoint is required', 400));
    }

    await PushSubscription.updateMany(
      { endpoint, userId: req.user._id },
      { isActive: false }
    );

    res.status(200).json({
      status: 'success',
      message: 'Push subscription deactivated'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Send an immediate test notification to the authenticated user
 */
export const sendTest = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const userId = req.user._id;
    const businessType = req.user.organizationId?.businessType || 'ALL';

    const result = await PushNotificationService.sendNotification({
      organizationId: orgId,
      userIds: [userId],
      platform: businessType,
      title: '🔔 ApexBuild Test Notification',
      body: `Your push notification channel is active and operational for ${req.user.name || 'User'}!`,
      url: '/',
      tag: 'test-notification',
      data: {
        type: 'TEST_PUSH',
        timestamp: Date.now()
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Test notification dispatched',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
