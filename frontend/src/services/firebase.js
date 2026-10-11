/**
 * ApexBuild Firebase Cloud Messaging (FCM) Client Service
 * Manages device registration token generation and foreground messaging.
 */
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, deleteToken } from 'firebase/messaging';
import api from './api';

let firebaseApp = null;
let messagingInstance = null;

// Default fallback configuration (allows graceful initialization before custom env vars)
const defaultFirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoApexBuildKeyForFCMTesting',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'apexbuild-platform.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'apexbuild-platform',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'apexbuild-platform.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcdef123456',
  vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || ''
};

/**
 * Initialize Firebase client app and messaging
 */
export const initFirebase = async () => {
  if (typeof window === 'undefined') return null;

  try {
    let config = defaultFirebaseConfig;

    // Attempt to load dynamic public config from backend if available
    try {
      const res = await api.get('/fcm/config');
      if (res.data?.data?.config?.apiKey) {
        config = { ...defaultFirebaseConfig, ...res.data.data.config };
      }
    } catch (e) {
      // Use default fallback config
    }

    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApps()[0];
    }

    const supported = await isSupported();
    if (supported) {
      messagingInstance = getMessaging(firebaseApp);
    }
    return messagingInstance;
  } catch (err) {
    console.warn('[FCM-Client] Firebase initialization warning:', err.message);
    return null;
  }
};

/**
 * Request permission and obtain FCM registration token
 */
export const requestFcmToken = async (platform = 'ALL') => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, reason: 'permission_denied' };
    }

    if (!messagingInstance) {
      await initFirebase();
    }

    if (!messagingInstance) {
      return { success: false, reason: 'messaging_not_available' };
    }

    let swRegistration = null;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
      } catch (swErr) {
        try {
          swRegistration = await navigator.serviceWorker.ready;
        } catch (readyErr) {
          // Proceed without explicit registration if not supported
        }
      }
    }

    const tokenOptions = {};
    if (swRegistration) {
      tokenOptions.serviceWorkerRegistration = swRegistration;
    }
    if (defaultFirebaseConfig.vapidKey) {
      tokenOptions.vapidKey = defaultFirebaseConfig.vapidKey;
    }

    const token = await getToken(messagingInstance, tokenOptions);

    if (token) {
      // Register with backend
      await api.post('/fcm/register-token', {
        token,
        platform,
        deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'android' : (/iPhone|iPad/i.test(navigator.userAgent) ? 'ios' : 'web')
      });

      localStorage.setItem('apex_fcm_token', token);
      return { success: true, token };
    } else {
      return { success: false, reason: 'token_empty' };
    }
  } catch (error) {
    console.error('[FCM-Client] Error obtaining token:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Unregister current device FCM token
 */
export const unregisterFcmToken = async () => {
  try {
    const existingToken = localStorage.getItem('apex_fcm_token');
    if (messagingInstance) {
      await deleteToken(messagingInstance);
    }
    if (existingToken) {
      await api.post('/fcm/unregister-token', { token: existingToken });
      localStorage.removeItem('apex_fcm_token');
    }
    return { success: true };
  } catch (error) {
    console.error('[FCM-Client] Error unregistering token:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Listen for incoming messages while app is in foreground
 */
export const onForegroundMessage = (callback) => {
  if (!messagingInstance) return () => {};
  try {
    return onMessage(messagingInstance, (payload) => {
      callback(payload);
    });
  } catch (err) {
    console.warn('[FCM-Client] onMessage error:', err.message);
    return () => {};
  }
};

export default {
  initFirebase,
  requestFcmToken,
  unregisterFcmToken,
  onForegroundMessage
};
