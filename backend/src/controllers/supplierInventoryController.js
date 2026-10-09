import SupplierProduct from '../models/SupplierProduct.js';
import SupplierInventoryLedger from '../models/SupplierInventoryLedger.js';
import AppError from '../utils/AppError.js';

export const getInventory = async (req, res, next) => {
  try {
    const products = await SupplierProduct.find({ organizationId: req.user.organizationId })
      .select('name sku unit currentStock minStockLevel category purchasePrice sellingPrice status')
      .sort('name');
    res.status(200).json({ status: 'success', data: { inventory: products } });
  } catch (error) { next(error); }
};

export const getProductLedger = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const ledger = await SupplierInventoryLedger.find({ 
      organizationId: req.user.organizationId,
      product: productId
    })
    .populate('createdBy', 'name')
    .sort('-createdAt');
    
    res.status(200).json({ status: 'success', data: { ledger } });
  } catch (error) { next(error); }
};
