import Measurement from '../models/Measurement.js';
import RABill from '../models/RABill.js';
import BOQItem from '../models/BOQItem.js';
import AppError from '../utils/AppError.js';

export const getMeasurements = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) filter.projectId = req.params.projectId || req.query.projectId;

    const measurements = await Measurement.find(filter)
      .populate('projectId', 'name')
      .populate('boqItemId', 'itemCode description unit rate')
      .sort('-date');

    res.status(200).json({ status: 'success', data: { measurements } });
  } catch (error) {
    next(error);
  }
};

export const createMeasurement = async (req, res, next) => {
  try {
    const { boqItemId, mbRef, date, quantity } = req.body;
    const projectId = req.params.projectId || req.body.projectId;

    // Verify BOQ item belongs to this project
    const boqItem = await BOQItem.findOne({ _id: boqItemId, projectId });
    if (!boqItem) {
      return next(new AppError('BOQ Item not found in this project', 404));
    }

    const measurement = await Measurement.create({
      organizationId: req.user.organizationId,
      projectId,
      boqItemId,
      mbRef,
      date,
      quantity,
      measuredBy: req.user._id
    });

    res.status(201).json({ status: 'success', data: { measurement } });
  } catch (error) {
    next(error);
  }
};

export const updateMeasurement = async (req, res, next) => {
  try {
    const { projectId, boqItemId, mbRef, date, quantity } = req.body;

    // Verify BOQ item belongs to this project
    const boqItem = await BOQItem.findOne({ _id: boqItemId, projectId });
    if (!boqItem) {
      return next(new AppError('BOQ Item not found in this project', 404));
    }

    const measurement = await Measurement.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { projectId, boqItemId, mbRef, date, quantity },
      { new: true, runValidators: true }
    );

    if (!measurement) {
      return next(new AppError('Measurement not found', 404));
    }

    res.status(200).json({ status: 'success', data: { measurement } });
  } catch (error) {
    next(error);
  }
};

export const updateMeasurementStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const measurement = await Measurement.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { status, verifiedBy: status === 'VERIFIED' ? req.user._id : undefined },
      { new: true }
    );
    res.status(200).json({ status: 'success', data: { measurement } });
  } catch (error) {
    next(error);
  }
};

export const getBills = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) filter.projectId = req.params.projectId || req.query.projectId;

    const bills = await RABill.find(filter)
      .populate('projectId', 'name')
      .sort('-createdAt');

    res.status(200).json({ status: 'success', data: { bills } });
  } catch (error) {
    next(error);
  }
};

export const createBill = async (req, res, next) => {
  try {
    const { billNo, period, grossAmount, retentionPercentage } = req.body;
    const projectId = req.params.projectId || req.body.projectId;
    
    const retentionAmount = (grossAmount * (retentionPercentage || 0)) / 100;
    const netPayable = grossAmount - retentionAmount;

    const bill = await RABill.create({
      organizationId: req.user.organizationId,
      projectId,
      billNo,
      period,
      grossAmount,
      retentionAmount,
      netPayable,
      createdBy: req.user._id
    });

    res.status(201).json({ status: 'success', data: { bill } });
  } catch (error) {
    next(error);
  }
};

export const updateBillStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const bill = await RABill.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { status },
      { new: true }
    );
    res.status(200).json({ status: 'success', data: { bill } });
  } catch (error) {
    next(error);
  }
};
