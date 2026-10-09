import mongoose from 'mongoose';
import SupplierOrder from '../models/SupplierOrder.js';
import SupplierProduct from '../models/SupplierProduct.js';
import SupplierCustomer from '../models/SupplierCustomer.js';
import SupplierInventoryLedger from '../models/SupplierInventoryLedger.js';
import SupplierInvoice from '../models/SupplierInvoice.js';
import SupplierDelivery from '../models/SupplierDelivery.js';
import AppError from '../utils/AppError.js';

export const getOrders = async (req, res, next) => {
  try {
    const orders = await SupplierOrder.find({ organizationId: req.user.organizationId })
      .populate('customer', 'name businessName')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { orders } });
  } catch (error) { next(error); }
};

export const createOrder = async (req, res, next) => {
  try {
    const { items, customer, dueAmount, grandTotal, paidAmount, deliverImmediately, vehicle, driver } = req.body;
    const orgId = req.user.organizationId;
    
    const count = await SupplierOrder.countDocuments({ organizationId: orgId });
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const order = new SupplierOrder({
      ...req.body,
      orderNumber,
      organizationId: orgId,
      status: deliverImmediately ? 'DELIVERED' : 'PENDING'
    });

    await order.save();

    // Update Customer Due
    if (dueAmount > 0) {
      await SupplierCustomer.findByIdAndUpdate(
        customer,
        { $inc: { currentDue: dueAmount } }
      );
    }

    // Process Inventory if delivering immediately
    if (deliverImmediately && items && items.length > 0) {
      for (const item of items) {
        const product = await SupplierProduct.findOne({ _id: item.product, organizationId: orgId });
        if (product) {
          if (product.currentStock < item.quantity) {
             throw new AppError(`Insufficient stock for ${product.name}. Required: ${item.quantity}, Available: ${product.currentStock}`, 400);
          }
          const newStock = product.currentStock - item.quantity;
          
          product.currentStock = newStock;
          await product.save();

          await SupplierInventoryLedger.create([{
            organizationId: orgId,
            product: product._id,
            transactionType: 'SALE',
            quantityChange: -item.quantity,
            balanceQuantity: newStock,
            referenceId: order._id,
            referenceModel: 'SupplierOrder',
            rate: item.rate,
            notes: `Order ${orderNumber}`,
            createdBy: req.user._id
          }]);
        }
      }

      // Generate Delivery Challan
      const deliveryCount = await SupplierDelivery.countDocuments({ organizationId: orgId });
      const challanNumber = `CH-${new Date().getFullYear()}-${String(deliveryCount + 1).padStart(4, '0')}`;
      
      await SupplierDelivery.create({
        organizationId: orgId,
        challanNumber,
        order: order._id,
        customer: customer,
        vehicle: vehicle || null,
        driver: driver || null,
        status: 'DELIVERED',
        deliveryNotes: `Auto-generated for immediate delivery of order ${orderNumber}`,
        recordedBy: req.user._id
      });
    }

    // Auto-generate Invoice for this order
    const invoiceCount = await SupplierInvoice.countDocuments({ organizationId: orgId });
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invoiceCount + 1).padStart(4, '0')}`;
    
    await SupplierInvoice.create([{
      organizationId: orgId,
      invoiceNumber,
      order: order._id,
      customer,
      invoiceDate: req.body.orderDate,
      items: items,
      subTotal: req.body.subTotal,
      transportCost: req.body.transportCost,
      otherCost: req.body.otherCost,
      grandTotal,
      paidAmount,
      dueAmount,
      status: dueAmount === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'ISSUED')
    }]);

    res.status(201).json({ status: 'success', data: { order } });
  } catch (error) {
    if (error.code === 11000) return next(new AppError('Order number already exists', 400));
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await SupplierOrder.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { status },
      { new: true, runValidators: true }
    );
    if (!order) return next(new AppError('Order not found', 404));
    res.status(200).json({ status: 'success', data: { order } });
  } catch (error) { next(error); }
};
