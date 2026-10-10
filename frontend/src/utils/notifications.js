/**
 * Web Push & Local PWA Notification Engine
 * Manages notification permissions, system tray alerts, and mobile notifications.
 */

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
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
    data: { url: '/distributor/sales' }
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
  getNotificationPermission,
  requestNotificationPermission,
  sendLocalNotification,
  notifyLowStock,
  notifyDprSubmitted,
  notifyOrderCreated,
  notifyDeliveryRecorded,
  notifySampleCollected
};
