import express from 'express';
import { 
  getProducts, 
  createProduct, 
  getProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/supplierProductController.js';
import { protect, authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);
// Most roles can view products, but restrict creation/editing
router.get('/', getProducts);
router.get('/:id', getProduct);

router.use(authorize('OWNER', 'ADMIN', 'STORE_MANAGER', 'PURCHASE'));

router.post('/', createProduct);
router.route('/:id')
  .put(updateProduct)
  .delete(deleteProduct);

export default router;
