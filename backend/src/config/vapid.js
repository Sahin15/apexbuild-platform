import webpush from 'web-push';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCAL_KEY_FILE = path.join(__dirname, '../../.vapid-keys.json');

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

// If not provided in environment variables, check or generate local development keys
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  try {
    if (fs.existsSync(LOCAL_KEY_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_KEY_FILE, 'utf8'));
      if (data.publicKey && data.privateKey) {
        vapidKeys = data;
      }
    }
  } catch (err) {
    // Continue to generate new keys
  }

  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    const generated = webpush.generateVAPIDKeys();
    vapidKeys = generated;
    try {
      fs.writeFileSync(LOCAL_KEY_FILE, JSON.stringify(vapidKeys, null, 2), 'utf8');
    } catch (err) {
      // Ignore write error in read-only filesystems
    }
  }
}

const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@apexbuild.com';

try {
  webpush.setVapidDetails(
    vapidSubject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
} catch (err) {
  console.error('[WebPush] Error configuring VAPID details:', err.message);
}

export const getVapidPublicKey = () => vapidKeys.publicKey;
export default webpush;
