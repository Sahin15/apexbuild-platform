import express from 'express';
import { getClients, createClient } from '../controllers/clientController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });
router.use(protect);

router.route('/')
  .get(getClients)
  .post(createClient);

export default router;
