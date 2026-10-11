/**
 * Web Push & Local PWA Notification Engine
 * Manages VAPID subscriptions, system tray alerts, and mobile notifications.
 */
import api from '../services/api';

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const isPushSupported = () => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'denied';
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
};

/**
 * Convert base64 URL-safe string to Uint8Array for VAPID key
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Subscribe user browser to backend Web Push with VAPID
 */
export const subscribeToWebPush = async (platform = 'ALL') => {
  if (!isPushSupported()) {
    return { success: false, reason: 'push_not_supported' };
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { success: false, reason: 'permission_denied' };
  }

  try {
    // 1. Fetch VAPID Public Key from backend
    const vapidRes = await api.get('/notifications/vapid-public-key');
    const publicKey = vapidRes.data?.data?.publicKey;

    if (!publicKey) {
      throw new Error('VAPID public key not received from server');
    }

    // 2. Wait for Service Worker registration
    const registration = await navigator.serviceWorker.ready;

    // 3. Check for existing subscription or subscribe
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(publicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    // 4. Send subscription payload to backend
    const subJSON = subscription.toJSON();
    await api.post('/notifications/subscribe', {
      subscription: subJSON,
      platform,
      userAgent: navigator.userAgent,
      deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    });

    return { success: true, subscription };
  } catch (err) {
    console.error('[WebPush] Error subscribing to push:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Unsubscribe user browser from backend Web Push
 */
export const unsubscribeFromWebPush = async () => {
  if (!isPushSupported()) return { success: false };

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();
      try {
        await api.post('/notifications/unsubscribe', { endpoint: subscription.endpoint });
      } catch (err) {
        // Non-blocking server cleanup
      }
    }

    return { success: true };
  } catch (err) {
    console.error('[WebPush] Error unsubscribing:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Trigger an immediate test push notification from backend
 */
export const triggerTestPush = async () => {
  try {
    const res = await api.post('/notifications/test');
    return res.data;
  } catch (err) {
    console.error('[WebPush] Test push failed:', err);
    throw err;
  }
};

/**
 * Display a system notification via Service Worker (or fallback to window.Notification)
 */
export const sendLocalNotification = async (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions = {
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    vibrate: [80, 40, 80],
    requireInteraction: false,
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }

    // Direct fallback
    new Notification(title, defaultOptions);
    return true;
  } catch (err) {
    console.warn('Failed to send notification:', err);
    return false;
  }
};

/**
 * Platform Specific Notification Triggers
 */

export const notifyLowStock = ({ productName, currentStock, minStock, unit = 'units' }) => {
  return sendLocalNotification('⚠️ Low Inventory Alert', {
    body: `${productName} stock is down to ${currentStock} ${unit} (Threshold: ${minStock} ${unit}). Re-order recommended.`,
    tag: `low-stock-${productName}`,
    data: { url: '/supplier/inventory' }
  });
};

export const notifyDprSubmitted = ({ dprNo, projectName }) => {
  return sendLocalNotification('📋 Daily Progress Report Filed', {
    body: `${dprNo} for ${projectName} has been recorded and submitted for engineer sign-off.`,
    tag: `dpr-${dprNo}`,
    data: { url: '/site-reports' }
  });
};

export const notifyOrderCreated = ({ orderNo, customerName, totalAmount }) => {
  return sendLocalNotification('📦 New Sales Order Created', {
    body: `Order #${orderNo} for ${customerName} (₹${Number(totalAmount).toLocaleString()}) logged.`,
    tag: `order-${orderNo}`,
    data: { url: '/supplier/orders' }
  });
};

export const notifyDeliveryRecorded = ({ saleNumber, shopName, weight }) => {
  return sendLocalNotification('🚚 Delivery Completed & Billed', {
    body: `Delivered ${weight} KG live chicken to ${shopName}. Invoice #${saleNumber} saved.`,
    tag: `delivery-${saleNumber}`,
    data: { url: '/distributor/deliveries' }
  });
};

export const notifySampleCollected = ({ sampleId, patientName, testCount }) => {
  return sendLocalNotification('🧪 Specimen Tube Accessioned', {
    body: `Sample #${sampleId} for ${patientName} (${testCount} tests) marked as collected.`,
    tag: `sample-${sampleId}`,
    data: { url: '/diagnostics/samples' }
  });
};

export default {
  isNotificationSupported,
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToWebPush,
  unsubscribeFromWebPush,
  triggerTestPush,
  sendLocalNotification,
  notifyLowStock,
  notifyDprSubmitted,
  notifyOrderCreated,
  notifyDeliveryRecorded,
  notifySampleCollected
};
