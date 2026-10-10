import Order from '../models/Order.js';
import Test from '../models/Test.js';
import Sample from '../models/Sample.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
import LabPaymentReceipt from '../models/LabPaymentReceipt.js';
import AppError from '../utils/AppError.js';

export const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ organizationId: req.user.organizationId._id || req.user.organizationId })
      .populate('patient', 'firstName lastName patientId phone')
      .populate('referringDoctor', 'name')
      .populate('tests.test', 'name testId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    
    // Create the order
    const orderData = {
      ...req.body,
      organizationId: orgId,
      createdBy: req.user._id
    };

    let order = await Order.create(orderData);

    // Auto-generate Samples
    if (req.body.tests && req.body.tests.length > 0) {
      const testIds = req.body.tests.map(t => t.test);
      const tests = await Test.find({ _id: { $in: testIds }, organizationId: orgId });
      
      const sampleGroups = {};
      
      tests.forEach(test => {
        if (test.sampleType && test.sampleType !== 'None' && test.containerType) {
          const key = `${test.sampleType}-${test.containerType}`;
          if (!sampleGroups[key]) {
            sampleGroups[key] = {
              sampleType: test.sampleType,
              containerType: test.containerType,
              tests: []
            };
          }
          sampleGroups[key].tests.push(test._id);
        }
      });

      const samplePromises = Object.values(sampleGroups).map(group => {
        return Sample.create({
          organizationId: orgId,
          order: order._id,
          patient: order.patient,
          tests: group.tests,
          sampleType: group.sampleType,
          containerType: group.containerType,
          status: 'Pending'
        });
      });

      const createdSamples = await Promise.all(samplePromises);

      // If samples are required, update order status
      if (createdSamples.length > 0) {
        order.orderStatus = 'Sample Pending';
        await order.save();
      }
    }

    // If initial payment was made at order registration, generate receipt
    let initialReceipt = null;
    if (order.paidAmount > 0) {
      initialReceipt = await LabPaymentReceipt.create({
        organizationId: orgId,
        order: order._id,
        patient: order.patient,
        amount: order.paidAmount,
        paymentMethod: order.paymentMethod || 'Cash',
        subtotal: order.subtotal,
        discount: order.totalDiscount,
        orderTotal: order.totalAmount,
        paidBeforeThis: 0,
        balanceAfterThis: order.dueAmount,
        cashier: req.user._id,
        cashierName: req.user.name || 'Registration Desk',
        notes: 'Initial registration payment'
      });

      order.payments = [{
        receiptNumber: initialReceipt.receiptNumber,
        receiptId: initialReceipt._id,
        amount: order.paidAmount,
        paymentMethod: order.paymentMethod || 'Cash',
        cashierName: req.user.name || 'Registration Desk',
        paidAt: new Date()
      }];
      await order.save();
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('patient', 'firstName lastName patientId phone age gender')
      .populate('referringDoctor', 'name')
      .populate('tests.test', 'name testId price');

    res.status(201).json({
      status: 'success',
      data: { order: populatedOrder, receipt: initialReceipt }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId._id || req.user.organizationId },
      { orderStatus: req.body.orderStatus },
      { new: true, runValidators: true }
    );

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('patient', 'firstName lastName patientId phone')
      .populate('referringDoctor', 'name')
      .populate('tests.test', 'name testId');

    res.status(200).json({
      status: 'success',
      data: { order: populatedOrder }
    });
  } catch (error) {
    next(error);
  }
};

export const addPayment = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const order = await Order.findOne({ 
      _id: req.params.id, 
      organizationId: orgId 
    });

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const amountToAdd = Number(req.body.amount);
    if (isNaN(amountToAdd) || amountToAdd <= 0) {
      return next(new AppError('Please provide a valid payment amount', 400));
    }

    if (order.paidAmount + amountToAdd > order.totalAmount) {
      return next(new AppError(`Payment exceeds total amount. Maximum allowed is ₹${order.totalAmount - order.paidAmount}`, 400));
    }

    const method = req.body.paymentMethod || 'Cash';
    const ref = req.body.transactionReference || '';
    const cashierName = req.user?.name || 'Cashier';
    const paidBefore = order.paidAmount;
    const balanceAfter = Math.max(0, order.dueAmount - amountToAdd);

    const receipt = await LabPaymentReceipt.create({
      organizationId: orgId,
      order: order._id,
      patient: order.patient,
      amount: amountToAdd,
      paymentMethod: method,
      transactionReference: ref,
      subtotal: order.subtotal,
      discount: order.totalDiscount,
      orderTotal: order.totalAmount,
      paidBeforeThis: paidBefore,
      balanceAfterThis: balanceAfter,
      cashier: req.user._id,
      cashierName,
      notes: req.body.notes || ''
    });

    order.paidAmount += amountToAdd;
    if (!order.payments) order.payments = [];
    order.payments.push({
      receiptNumber: receipt.receiptNumber,
      receiptId: receipt._id,
      amount: amountToAdd,
      paymentMethod: method,
      transactionReference: ref,
      cashierName,
      paidAt: new Date()
    });

    await order.save(); // Triggers pre('validate')

    const populatedOrder = await Order.findById(order._id)
      .populate('patient', 'firstName lastName patientId phone age gender')
      .populate('referringDoctor', 'name')
      .populate('tests.test', 'name testId price');

    const populatedReceipt = await LabPaymentReceipt.findById(receipt._id)
      .populate({
        path: 'order',
        populate: [
          { path: 'tests.test', select: 'name testId price department' },
          { path: 'referringDoctor', select: 'name specialization' }
        ]
      })
      .populate('patient')
      .populate('cashier', 'name role');

    res.status(200).json({
      status: 'success',
      data: { order: populatedOrder, receipt: populatedReceipt }
    });
  } catch (error) {
    next(error);
  }
};
