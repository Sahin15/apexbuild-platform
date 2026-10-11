import express from 'express';
import { getClientConfig, registerToken, unregisterToken, sendTestMessage } from '../controllers/fcmController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public client Firebase config
router.get('/config', getClientConfig);

// Authenticated device endpoints
router.use(protect);
router.post('/register-token', registerToken);
router.post('/unregister-token', unregisterToken);
router.post('/test', sendTestMessage);

export default router;
