import Result from '../models/Result.js';
import Order from '../models/Order.js';
import Sample from '../models/Sample.js';
import AppError from '../utils/AppError.js';

export const getPendingResults = async (req, res, next) => {
  try {
    // A test needs a result if it's on an order.
    // For MVP, we can just return orders that are 'Collected' or 'Sample Pending' (for non-sample tests)
    // To simplify: let's fetch all Orders that are not Completed.
    const orders = await Order.find({ 
      organizationId: req.user.organizationId._id || req.user.organizationId,
      orderStatus: { $in: ['Registered', 'Sample Pending', 'Collected', 'Partial Results'] }
    })
    .populate('patient', 'firstName lastName patientId')
    .populate('tests.test', 'name testId parameters isPackage');

    res.status(200).json({
      status: 'success',
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

export const saveResult = async (req, res, next) => {
  try {
    const { orderId, testId, parameters, status, remarks } = req.body;
    const orgId = req.user.organizationId._id || req.user.organizationId;

    // Check if result already exists
    let result = await Result.findOne({ order: orderId, test: testId, organizationId: orgId });

    if (result) {
      result.parameters = parameters;
      result.status = status;
      result.remarks = remarks;
      if (status === 'Verified') {
        result.verifiedBy = req.user._id;
        result.verifiedAt = new Date();
      }
      await result.save();
    } else {
      const order = await Order.findById(orderId);
      result = await Result.create({
        organizationId: orgId,
        order: orderId,
        test: testId,
        patient: order.patient,
        parameters,
        status,
        remarks,
        enteredBy: req.user._id
      });
    }

    // Auto-update sample status to Tested if applicable
    await Sample.updateMany(
      { order: orderId, tests: testId },
      { status: 'Tested' }
    );

    // Update order status logic (if all tests have Verified results -> Completed)
    // For simplicity, just mark 'Partial Results'
    await Order.findByIdAndUpdate(orderId, { orderStatus: 'Partial Results' });

    res.status(200).json({
      status: 'success',
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

export const getResultsByOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    const orgId = req.user.organizationId._id || req.user.organizationId;

    const order = await Order.findOne({ _id: orderId, organizationId: orgId })
      .populate('patient')
      .populate('referringDoctor');

    if (!order) return next(new AppError('Order not found', 404));

    const results = await Result.find({ order: orderId, organizationId: orgId })
      .populate('test', 'name category method testId')
      .populate('enteredBy', 'name')
      .populate('verifiedBy', 'name');

    res.status(200).json({
      status: 'success',
      data: { order, results }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyResult = async (req, res, next) => {
  try {
    const resultId = req.params.id;
    const orgId = req.user.organizationId._id || req.user.organizationId;

    const result = await Result.findOneAndUpdate(
      { _id: resultId, organizationId: orgId },
      { 
        status: 'Verified',
        verifiedBy: req.user._id,
        verifiedAt: new Date()
      },
      { new: true }
    );

    if (!result) return next(new AppError('Result not found', 404));

    // Check if all results for this order are Verified
    const allOrderResults = await Result.find({ order: result.order });
    const allVerified = allOrderResults.every(r => r.status === 'Verified');

    // If we have results for all tests and all are verified
    const order = await Order.findById(result.order);
    if (order.tests.length === allOrderResults.length && allVerified) {
      order.orderStatus = 'Completed';
      await order.save();
    }

    res.status(200).json({
      status: 'success',
      data: { result, allVerified }
    });
  } catch (error) {
    next(error);
  }
};
