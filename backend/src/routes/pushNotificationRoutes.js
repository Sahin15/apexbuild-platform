import express from 'express';
import { getPublicKey, subscribe, unsubscribe, sendTest } from '../controllers/pushNotificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public key retrieval
router.get('/vapid-public-key', getPublicKey);

// Authenticated push subscription endpoints
router.use(protect);
router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);
router.post('/test', sendTest);

export default router;
