import express from 'express';
import {
  getEquipments,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  getEquipmentLogs,
  createEquipmentLog,
  deleteEquipmentLog,
  getEquipmentSummary
} from '../controllers/equipmentController.js';
import { protect, requireOrganization, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireOrganization);

// Summary & KPI
router.get('/summary', getEquipmentSummary);

// Equipment fleet master
router.get('/', getEquipments);
router.post('/', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), createEquipment);
router.patch('/:id', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER'), updateEquipment);
router.delete('/:id', authorize('OWNER', 'ADMIN'), deleteEquipment);

// Daily machine & fuel logs
router.get('/logs', getEquipmentLogs);
router.post('/logs', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'SUPERVISOR'), createEquipmentLog);
router.delete('/logs/:id', authorize('OWNER', 'ADMIN', 'PROJECT_MANAGER'), deleteEquipmentLog);

export default router;
