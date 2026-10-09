import express from 'express';
import { getMaterials, createMaterial, getLedger, createLedgerEntry, updateMaterial } from '../controllers/materialController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getMaterials)
  .post(createMaterial);

router.route('/ledger')
  .get(getLedger)
  .post(createLedgerEntry);

router.route('/:materialId')
  .patch(updateMaterial);

router.route('/:materialId/ledger')
  .get(getLedger);

export default router;
