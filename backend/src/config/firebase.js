import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_SERVICE_ACCOUNT = path.join(__dirname, '../../.firebase-service-account.json');

let firebaseApp = null;
let isConfigured = false;

try {
  let credential = null;

  // 1. Check local service account file
  const customPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const filePath = customPath || (fs.existsSync(LOCAL_SERVICE_ACCOUNT) ? LOCAL_SERVICE_ACCOUNT : null);

  if (filePath && fs.existsSync(filePath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    credential = admin.credential.cert(serviceAccount);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // 2. Check individual environment variables
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
  }

  if (credential) {
    firebaseApp = admin.initializeApp({
      credential,
      projectId: process.env.FIREBASE_PROJECT_ID
    });
    isConfigured = true;
    console.log('[FCM] Firebase Admin SDK initialized successfully');
  } else {
    console.log('[FCM] No Firebase credentials detected. Operating in simulated/development mode.');
  }
} catch (err) {
  console.warn('[FCM] Warning initializing Firebase Admin SDK:', err.message);
}

export const isFirebaseConfigured = () => isConfigured;
export const getFirebaseMessaging = () => (isConfigured ? admin.messaging() : null);
export const getFirebasePublicConfig = () => ({
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || `${process.env.FIREBASE_PROJECT_ID || 'apexbuild-platform'}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'apexbuild-platform',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID || 'apexbuild-platform'}.appspot.com`,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '',
  vapidKey: process.env.VITE_FIREBASE_VAPID_KEY || process.env.FIREBASE_VAPID_KEY || ''
});

export default admin;
