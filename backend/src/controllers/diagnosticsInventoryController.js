import InventoryItem from '../models/InventoryItem.js';
import AppError from '../utils/AppError.js';

export const getInventoryItems = async (req, res, next) => {
  try {
    const items = await InventoryItem.find({ organizationId: req.user.organizationId._id || req.user.organizationId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { items }
    });
  } catch (error) {
    next(error);
  }
};

export const addInventoryItem = async (req, res, next) => {
  try {
    const itemData = {
      ...req.body,
      organizationId: req.user.organizationId._id || req.user.organizationId
    };
    const item = await InventoryItem.create(itemData);

    res.status(201).json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req, res, next) => {
  try {
    const { quantity, action } = req.body; // action: 'add' or 'consume'
    
    const item = await InventoryItem.findOne({ _id: req.params.id, organizationId: req.user.organizationId._id || req.user.organizationId });
    if (!item) return next(new AppError('Item not found', 404));

    if (action === 'add') {
      item.currentStock += quantity;
    } else if (action === 'consume') {
      if (item.currentStock < quantity) {
        return next(new AppError('Insufficient stock', 400));
      }
      item.currentStock -= quantity;
    }

    await item.save();

    res.status(200).json({
      status: 'success',
      data: { item }
    });
  } catch (error) {
    next(error);
  }
};
