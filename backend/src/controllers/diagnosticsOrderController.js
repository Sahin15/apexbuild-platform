import Order from '../models/Order.js';
import Test from '../models/Test.js';
import Sample from '../models/Sample.js';
import Patient from '../models/Patient.js';
import Doctor from '../models/Doctor.js';
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

    const populatedOrder = await Order.findById(order._id)
      .populate('patient', 'firstName lastName patientId phone')
      .populate('tests.test', 'name testId');

    res.status(201).json({
      status: 'success',
      data: { order: populatedOrder }
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
    const order = await Order.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId._id || req.user.organizationId 
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

    order.paidAmount += amountToAdd;
    await order.save(); // This triggers the pre('validate') hook to recalculate dueAmount and paymentStatus

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
