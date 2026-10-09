import SupplierDelivery from '../models/SupplierDelivery.js';
import SupplierOrder from '../models/SupplierOrder.js';
import AppError from '../utils/AppError.js';

export const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await SupplierDelivery.find({ organizationId: req.user.organizationId })
      .populate('customer', 'name phone')
      .populate('order', 'orderNumber')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { deliveries } });
  } catch (error) { next(error); }
};

export const createDelivery = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    
    const count = await SupplierDelivery.countDocuments({ organizationId: orgId });
    const challanNumber = `CH-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const delivery = await SupplierDelivery.create({
      ...req.body,
      challanNumber,
      organizationId: orgId,
      recordedBy: req.user._id
    });

    await SupplierOrder.findOneAndUpdate(
      { _id: req.body.order, status: 'PENDING' },
      { status: 'PROCESSING' }
    );

    res.status(201).json({ status: 'success', data: { delivery } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Challan number already exists', 400));
    next(error);
  }
};

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const delivery = await SupplierDelivery.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { status },
      { new: true, runValidators: true }
    );
    if (!delivery) return next(new AppError('Delivery record not found', 404));

    if (status === 'DELIVERED') {
      await SupplierOrder.findOneAndUpdate(
        { _id: delivery.order },
        { status: 'DELIVERED' }
      );
    }

    res.status(200).json({ status: 'success', data: { delivery } });
  } catch (error) { next(error); }
};
