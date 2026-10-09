import express from 'express';
import { getActiveTrip, startTrip, endTrip } from '../controllers/distributorTripController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.get('/active', getActiveTrip);
router.post('/start', startTrip);
router.post('/end', endTrip);

export default router;
