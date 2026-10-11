/**
 * Firebase Cloud Messaging Service Worker
 * Official Firebase background message handler
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const defaultFirebaseConfig = {
  apiKey: 'AIzaSyDemoApexBuildKeyForFCMTesting',
  authDomain: 'apexbuild-platform.firebaseapp.com',
  projectId: 'apexbuild-platform',
  storageBucket: 'apexbuild-platform.appspot.com',
  messagingSenderId: '1029384756',
  appId: '1:1029384756:web:abcdef123456'
};

// Parse dynamic configuration from registration URL query parameters
let activeConfig = { ...defaultFirebaseConfig };
try {
  const params = new URLSearchParams(self.location.search);
  if (params.get('projectId')) {
    activeConfig = {
      apiKey: params.get('apiKey') || defaultFirebaseConfig.apiKey,
      authDomain: params.get('authDomain') || defaultFirebaseConfig.authDomain,
      projectId: params.get('projectId') || defaultFirebaseConfig.projectId,
      storageBucket: params.get('storageBucket') || defaultFirebaseConfig.storageBucket,
      messagingSenderId: params.get('messagingSenderId') || defaultFirebaseConfig.messagingSenderId,
      appId: params.get('appId') || defaultFirebaseConfig.appId
    };
  }
} catch (e) {
  // Use default fallback config
}

if (!firebase.apps.length) {
  firebase.initializeApp(activeConfig);
}

let messaging = null;
try {
  messaging = firebase.messaging();
} catch (e) {
  // Graceful fallback
}

if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || 'ApexBuild Alert';
    const options = {
      body: payload.notification?.body || payload.data?.body || '',
      icon: payload.notification?.icon || payload.notification?.imageUrl || '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data || { url: '/' },
      vibrate: [100, 50, 100],
      tag: payload.data?.tag || `apex-fcm-${Date.now()}`
    };

    self.registration.showNotification(title, options);
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if ('navigate' in client && targetUrl !== '/') {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
