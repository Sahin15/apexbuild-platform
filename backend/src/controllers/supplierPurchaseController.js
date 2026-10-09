import mongoose from 'mongoose';
import SupplierPurchase from '../models/SupplierPurchase.js';
import SupplierProduct from '../models/SupplierProduct.js';
import SupplierVendor from '../models/SupplierVendor.js';
import SupplierInventoryLedger from '../models/SupplierInventoryLedger.js';
import AppError from '../utils/AppError.js';

export const getPurchases = async (req, res, next) => {
  try {
    const purchases = await SupplierPurchase.find({ organizationId: req.user.organizationId })
      .populate('vendor', 'name companyName')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { purchases } });
  } catch (error) { next(error); }
};

export const createPurchase = async (req, res, next) => {
  try {
    const { items, vendor, stockReceived, dueAmount, grandTotal, paidAmount } = req.body;
    const orgId = req.user.organizationId;
    
    // Generate Purchase Number (Mock generation for simplicity)
    const count = await SupplierPurchase.countDocuments({ organizationId: orgId });
    const purchaseNumber = `PUR-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const purchase = new SupplierPurchase({
      ...req.body,
      purchaseNumber,
      organizationId: orgId
    });

    await purchase.save();

    // Update Vendor Payable
    if (dueAmount > 0) {
      await SupplierVendor.findByIdAndUpdate(
        vendor,
        { $inc: { currentPayable: dueAmount } }
      );
    }

    // Process Inventory if stock is received immediately
    if (stockReceived && items && items.length > 0) {
      for (const item of items) {
        // Find product to get current stock
        const product = await SupplierProduct.findOne({ _id: item.product, organizationId: orgId });
        if (product) {
          const newStock = product.currentStock + item.quantity;
          
          // Update product
          product.currentStock = newStock;
          await product.save();

          // Create ledger entry
          await SupplierInventoryLedger.create([{
            organizationId: orgId,
            product: product._id,
            transactionType: 'PURCHASE',
            quantityChange: item.quantity,
            balanceQuantity: newStock,
            referenceId: purchase._id,
            referenceModel: 'SupplierPurchase',
            rate: item.rate,
            notes: `Purchase ${purchaseNumber}`,
            createdBy: req.user._id
          }]);
        }
      }
    }

    res.status(201).json({ status: 'success', data: { purchase } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Purchase number already exists', 400));
    next(error);
  }
};

export const getPurchase = async (req, res, next) => {
  try {
    const purchase = await SupplierPurchase.findOne({ _id: req.params.id, organizationId: req.user.organizationId })
      .populate('vendor')
      .populate('items.product', 'name sku unit');
    if (!purchase) return next(new AppError('Purchase not found', 404));
    res.status(200).json({ status: 'success', data: { purchase } });
  } catch (error) { next(error); }
};

// Receiving stock separately after creation
export const receivePurchaseStock = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const purchase = await SupplierPurchase.findOne({ _id: req.params.id, organizationId: orgId });
    
    if (!purchase) return next(new AppError('Purchase not found', 404));
    if (purchase.stockReceived) return next(new AppError('Stock already received for this purchase', 400));

    // Process Inventory Update
    for (const item of purchase.items) {
      const product = await SupplierProduct.findOne({ _id: item.product, organizationId: orgId });
      if (product) {
        const newStock = product.currentStock + item.quantity;
        product.currentStock = newStock;
        await product.save();

        await SupplierInventoryLedger.create([{
          organizationId: orgId,
          product: product._id,
          transactionType: 'PURCHASE',
          quantityChange: item.quantity,
          balanceQuantity: newStock,
          referenceId: purchase._id,
          referenceModel: 'SupplierPurchase',
          rate: item.rate,
          notes: `Purchase ${purchase.purchaseNumber}`,
          createdBy: req.user._id
        }]);
      }
    }

    purchase.stockReceived = true;
    await purchase.save();

    res.status(200).json({ status: 'success', data: { purchase } });
  } catch (error) {
    next(error);
  }
};
