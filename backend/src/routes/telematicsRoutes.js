import express from 'express';
import { 
  recordPing, 
  getLiveFleet, 
  getVehicleRouteHistory, 
  simulateTelemetry 
} from '../controllers/telematicsController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/ping', recordPing);
router.get('/live', getLiveFleet);
router.get('/history/:vehicleId', getVehicleRouteHistory);
router.post('/simulate/:vehicleId', simulateTelemetry);

export default router;
