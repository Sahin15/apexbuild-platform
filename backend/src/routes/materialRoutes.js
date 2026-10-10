import express from 'express';
import { 
  getMaterials, 
  createMaterial, 
  updateMaterial, 
  deleteMaterial,
  getLedger, 
  createLedgerEntry,
  getGRNs,
  createGRN,
  getStoreIssues,
  createStoreIssue,
  getIndents,
  createIndent,
  approveIndent,
  getStoreSummary
} from '../controllers/materialController.js';
import { protect, requireOrganization } from '../middlewares/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.use(protect);
router.use(requireOrganization);

router.get('/summary', getStoreSummary);

// Material Catalog
router.route('/')
  .get(getMaterials)
  .post(createMaterial);

// Goods Received Notes (GRN)
router.route('/grn')
  .get(getGRNs)
  .post(createGRN);

// Store Issue Slips (Consumption)
router.route('/issues')
  .get(getStoreIssues)
  .post(createStoreIssue);

// Material Indents (Requisitions)
router.route('/indents')
  .get(getIndents)
  .post(createIndent);

router.patch('/indents/:id/approve', approveIndent);

// Stock Ledger / Bin Card History
router.route('/ledger')
  .get(getLedger)
  .post(createLedgerEntry);

router.route('/:materialId')
  .patch(updateMaterial)
  .delete(deleteMaterial);

router.route('/:materialId/ledger')
  .get(getLedger);

export default router;

