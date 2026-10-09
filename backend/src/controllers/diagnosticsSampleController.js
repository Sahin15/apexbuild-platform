import Sample from '../models/Sample.js';
import Order from '../models/Order.js';
import AppError from '../utils/AppError.js';

export const getSamples = async (req, res, next) => {
  try {
    const samples = await Sample.find({ organizationId: req.user.organizationId._id || req.user.organizationId })
      .populate('patient', 'firstName lastName patientId age gender')
      .populate('order', 'orderId')
      .populate('tests', 'name')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: samples.length,
      data: { samples }
    });
  } catch (error) {
    next(error);
  }
};

export const createSample = async (req, res, next) => {
  try {
    const sampleData = {
      ...req.body,
      organizationId: req.user.organizationId._id || req.user.organizationId
    };

    const sample = await Sample.create(sampleData);
    
    // Auto update Order status to 'Sample Pending' if it's Registered
    await Order.findOneAndUpdate(
      { _id: sample.order, orderStatus: 'Registered' },
      { orderStatus: 'Sample Pending' }
    );

    res.status(201).json({
      status: 'success',
      data: { sample }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSampleStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    
    const updateData = {
      $set: { status },
      $unset: {}
    };
    
    // Track timestamps based on new status
    if (status === 'Collected') {
      updateData.$set.collectedAt = new Date();
      updateData.$set.collectedBy = req.user._id;
      // Clear downstream timestamps if backtracking
      updateData.$unset = { receivedInLabAt: 1, processingAt: 1, testedAt: 1, rejectionReason: 1 };
    } else if (status === 'In Lab') {
      updateData.$set.receivedInLabAt = new Date();
      updateData.$set.receivedInLabBy = req.user._id;
      updateData.$unset = { processingAt: 1, testedAt: 1, rejectionReason: 1 };
    } else if (status === 'Processing') {
      updateData.$set.processingAt = new Date();
      updateData.$set.processedBy = req.user._id;
      updateData.$unset = { testedAt: 1, rejectionReason: 1 };
    } else if (status === 'Tested') {
      updateData.$set.testedAt = new Date();
      updateData.$set.testedBy = req.user._id;
      updateData.$unset = { rejectionReason: 1 };
    } else if (status === 'Rejected') {
      updateData.$set.rejectionReason = rejectionReason;
    } else if (status === 'Pending') {
      // Complete backtrack
      updateData.$unset = { collectedAt: 1, receivedInLabAt: 1, processingAt: 1, testedAt: 1, rejectionReason: 1 };
    }

    if (Object.keys(updateData.$unset).length === 0) {
      delete updateData.$unset;
    }

    const sample = await Sample.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId._id || req.user.organizationId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!sample) {
      return next(new AppError('Sample not found', 404));
    }
    
    // Also update order status if sample is collected
    if (status === 'Collected') {
      await Order.findByIdAndUpdate(sample.order, { orderStatus: 'Processing' });
    }

    // Populate the sample before returning to prevent frontend blanking
    const populatedSample = await Sample.findById(sample._id)
      .populate('patient', 'firstName lastName patientId age gender')
      .populate('order', 'orderId')
      .populate('tests', 'name')
      .populate('collectedBy', 'name');

    res.status(200).json({
      status: 'success',
      data: { sample: populatedSample }
    });
  } catch (error) {
    next(error);
  }
};
