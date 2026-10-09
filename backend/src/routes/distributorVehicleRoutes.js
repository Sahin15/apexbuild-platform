import express from 'express';
import { getVehicles, addVehicle, updateVehicle } from '../controllers/distributorVehicleController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getVehicles);
router.post('/', authorize('OWNER', 'ADMIN', 'MANAGER'), addVehicle);
router.put('/:id', authorize('OWNER', 'ADMIN', 'MANAGER'), updateVehicle);

export default router;
