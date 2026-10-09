import express from 'express';
import { getLogistics, createVehicle, createDriver } from '../controllers/supplierLogisticsController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('OWNER', 'ADMIN', 'STORE_MANAGER', 'SALES'));

router.get('/', getLogistics);
router.post('/vehicles', createVehicle);
router.post('/drivers', createDriver);

export default router;
