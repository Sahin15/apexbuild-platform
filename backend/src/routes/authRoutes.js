import express from 'express';
import { registerOrganization, login, getMe } from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerOrganization);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
