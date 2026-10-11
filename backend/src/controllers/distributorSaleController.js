import mongoose from 'mongoose';
import DistributorSale from '../models/DistributorSale.js';
import DistributorCustomer from '../models/DistributorCustomer.js';
import DistributorStock from '../models/DistributorStock.js';
import DistributorStockMovement from '../models/DistributorStockMovement.js';
import DistributorPayment from '../models/DistributorPayment.js';
import PushNotificationService from '../services/PushNotificationService.js';
import FcmNotificationService from '../services/FcmNotificationService.js';

export const getSales = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const sales = await DistributorSale.find({ organizationId: orgId })
      .populate('customer', 'shopName ownerName phone route')
      .sort('-saleDate -createdAt');
    res.status(200).json({ status: 'success', data: { sales } });
  } catch (error) { next(error); }
};

export const createSale = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const { customerId, weight, sellingRate, discount = 0, otherCharges = 0, paidAmount = 0, paymentMethod = 'CASH' } = req.body;

    const customer = await DistributorCustomer.findOne({ _id: customerId, organizationId: orgId });
    if (!customer) throw new Error('Customer not found');

    // Check Stock
    let stock = await DistributorStock.findOne({ organizationId: orgId });
    if (!stock || stock.currentStock < Number(weight)) {
      throw new Error(`Insufficient stock. Current stock is ${stock?.currentStock || 0} KG`);
    }

    const grossAmount = weight * sellingRate;
    const netAmount = grossAmount - Number(discount) + Number(otherCharges);
    const dueAmount = netAmount - Number(paidAmount);
    
    let paymentStatus = 'CREDIT';
    if (paidAmount >= netAmount) paymentStatus = 'PAID';
    else if (paidAmount > 0) paymentStatus = 'PARTIAL';

    const generateSaleNumber = () => {
      const date = new Date();
      return `SL-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    };

    const newSale = await DistributorSale.create([{
      organizationId: orgId,
      saleNumber: generateSaleNumber(),
      customer: customerId,
      weight: Number(weight),
      sellingRate: Number(sellingRate),
      grossAmount,
      discount: Number(discount),
      otherCharges: Number(otherCharges),
      netAmount,
      paidAmount: Number(paidAmount),
      dueAmount,
      paymentStatus
    }]);

    // Update Customer Due
    if (dueAmount > 0) {
      customer.currentDue += dueAmount;
      await customer.save();
    }

    // Record Payment if paidAmount > 0
    if (Number(paidAmount) > 0) {
      await DistributorPayment.create([{
        organizationId: orgId,
        type: 'CUSTOMER_COLLECTION',
        customer: customerId,
        amount: Number(paidAmount),
        paymentMethod,
        reference: newSale[0].saleNumber,
        notes: `Initial payment for Sale ${newSale[0].saleNumber}`
      }]);
    }

    // Update Stock
    stock.currentStock -= Number(weight);
    stock.lastUpdated = new Date();
    await stock.save();

    // Log Stock Movement
    await DistributorStockMovement.create([{
      organizationId: orgId,
      type: 'DELIVERY',
      referenceId: newSale[0]._id,
      referenceModel: 'DistributorSale',
      quantity: -Number(weight),
      unit: 'KG',
      rate: Number(sellingRate),
      balance: stock.currentStock,
      notes: `Delivered to ${customer.shopName}`
    }]);

    // Dispatch Web Push notification to distributor managers/dispatch
    PushNotificationService.sendNotification({
      organizationId: orgId,
      platform: 'CHICKEN_DISTRIBUTOR',
      title: '🚚 Chicken Delivery Dispatched',
      body: `Delivery recorded for ${customer.shopName}: ${Number(weight)} KG (₹${netAmount.toLocaleString()})`,
      url: '/distributor/deliveries',
      tag: `sale-${newSale[0]._id}`,
      data: { saleId: newSale[0]._id }
    }).catch(() => {});

    // Dispatch Firebase Cloud Message (FCM) to driver & mobile fleet
    FcmNotificationService.sendToOrganization(orgId, 'CHICKEN_DISTRIBUTOR', {
      title: '🚚 Chicken Delivery Dispatched',
      body: `Delivery recorded for ${customer.shopName}: ${Number(weight)} KG (₹${netAmount.toLocaleString()})`,
      clickAction: '/distributor/deliveries',
      data: { saleId: newSale[0]._id.toString() }
    }).catch(() => {});

    res.status(201).json({ status: 'success', data: { sale: newSale[0] } });
  } catch (error) {
    
    next(error);
  }
};
