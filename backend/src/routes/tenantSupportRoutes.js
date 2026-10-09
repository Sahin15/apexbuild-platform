import express from 'express';
import { createTicket, getMyTickets } from '../controllers/tenantSupportController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/tickets', getMyTickets);
router.post('/tickets', createTicket);

export default router;
