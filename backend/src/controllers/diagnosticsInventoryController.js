import InventoryItem from '../models/InventoryItem.js';
import InventoryLog from '../models/InventoryLog.js';
import AppError from '../utils/AppError.js';

export const getInventoryItems = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const items = await InventoryItem.find({ organizationId: orgId })
      .populate('linkedTests', 'name testId category')
      .sort({ createdAt: -1 });

    const now = new Date();

    // Enrich items with expiry alerts
    const enrichedItems = items.map((item) => {
      const obj = item.toObject();
      let daysUntilExpiry = null;
      let isExpiringSoon = false;

      if (obj.expiryDate) {
        const exp = new Date(obj.expiryDate);
        const diffTime = exp.getTime() - now.getTime();
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          isExpiringSoon = true;
        }
      }

      return {
        ...obj,
        daysUntilExpiry,
        isExpiringSoon
      };
    });

    // Summary statistics
    const stats = {
      totalItems: items.length,
      totalValuation: items.reduce((sum, i) => sum + (i.currentStock * (i.pricePerUnit || 0)), 0),
      lowStockCount: items.filter(i => i.status === 'Low Stock' || i.status === 'Out of Stock').length,
      expiredCount: enrichedItems.filter(i => i.status === 'Expired' || (i.daysUntilExpiry !== null && i.daysUntilExpiry <= 0)).length,
      expiringSoonCount: enrichedItems.filter(i => i.isExpiringSoon).length
    };

    res.status(200).json({
      status: 'success',
      results: items.length,
      data: { 
        items: enrichedItems,
        stats 
      }
    });
  } catch (error) {
    next(error);
  }
};

export const addInventoryItem = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const itemData = {
      ...req.body,
      organizationId: orgId
    };

    const item = await InventoryItem.create(itemData);

    // Record initial stock entry if stock > 0
    if (item.currentStock > 0) {
      await InventoryLog.create({
        organizationId: orgId,
        item: item._id,
        type: 'STOCK_IN',
        quantity: item.currentStock,
        previousStock: 0,
        newStock: item.currentStock,
        batchNumber: item.batchNumber,
        notes: `Initial stock opening balance (Batch: ${item.batchNumber || 'N/A'})`,
        performedBy: req.user._id
      });
    }

    const populatedItem = await InventoryItem.findById(item._id).populate('linkedTests', 'name testId');

    res.status(201).json({
      status: 'success',
      data: { item: populatedItem }
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { quantity, action, notes, batchNumber, newExpiryDate } = req.body; 
    // action: 'add' (Purchase/Receive), 'consume' (Lab use), 'discard' (Expiry/Damage), 'adjust' (Audit balance)

    const item = await InventoryItem.findOne({ _id: req.params.id, organizationId: orgId });
    if (!item) return next(new AppError('Item not found', 404));

    const previousStock = item.currentStock;
    let newStock = previousStock;
    let logType = 'STOCK_IN';

    if (action === 'add') {
      newStock = previousStock + Number(quantity);
      logType = 'STOCK_IN';
      if (batchNumber) item.batchNumber = batchNumber;
      if (newExpiryDate) item.expiryDate = new Date(newExpiryDate);
    } else if (action === 'consume') {
      if (previousStock < Number(quantity)) {
        return next(new AppError('Insufficient inventory stock to consume requested quantity', 400));
      }
      newStock = previousStock - Number(quantity);
      logType = 'MANUAL_CONSUMED';
    } else if (action === 'discard') {
      if (previousStock < Number(quantity)) {
        return next(new AppError('Quantity to discard exceeds current stock', 400));
      }
      newStock = previousStock - Number(quantity);
      logType = 'EXPIRED_DISCARD';
    } else if (action === 'adjust') {
      newStock = Number(quantity);
      logType = 'ADJUSTMENT';
    }

    item.currentStock = Math.max(0, newStock);
    await item.save();

    // Log the transaction
    await InventoryLog.create({
      organizationId: orgId,
      item: item._id,
      type: logType,
      quantity: Math.abs(newStock - previousStock),
      previousStock,
      newStock,
      batchNumber: item.batchNumber,
      notes: notes || `Stock updated via ${action}`,
      performedBy: req.user._id
    });

    const populatedItem = await InventoryItem.findById(item._id).populate('linkedTests', 'name testId');

    res.status(200).json({
      status: 'success',
      data: { item: populatedItem }
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryLogs = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const filter = { organizationId: orgId };

    if (req.query.itemId) {
      filter.item = req.query.itemId;
    }

    const logs = await InventoryLog.find(filter)
      .populate('item', 'name itemId unit category')
      .populate('test', 'name')
      .populate('order', 'orderId')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: { logs }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Enterprise automated depletion: when a test is resulted, deplete all reagents mapped to it
 */
export const autoDepleteReagents = async (orgId, testId, orderId, userId) => {
  try {
    const linkedItems = await InventoryItem.find({
      organizationId: orgId,
      linkedTests: testId,
      currentStock: { $gt: 0 }
    });

    for (const item of linkedItems) {
      const prev = item.currentStock;
      item.currentStock = Math.max(0, prev - 1); // deduct 1 test run
      await item.save();

      await InventoryLog.create({
        organizationId: orgId,
        item: item._id,
        type: 'AUTO_CONSUMED',
        quantity: 1,
        previousStock: prev,
        newStock: item.currentStock,
        order: orderId,
        test: testId,
        batchNumber: item.batchNumber,
        notes: `Automated test run depletion for Test ID ${testId}`,
        performedBy: userId
      });
    }
  } catch (err) {
    console.error('Auto reagent depletion error:', err);
  }
};
