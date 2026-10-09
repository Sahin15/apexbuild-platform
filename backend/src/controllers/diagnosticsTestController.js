import Test from '../models/Test.js';
import AppError from '../utils/AppError.js';

export const getTests = async (req, res, next) => {
  try {
    const tests = await Test.find({ organizationId: req.user.organizationId._id || req.user.organizationId })
      .populate('includedTests')
      .sort({ category: 1, name: 1 });

    res.status(200).json({
      status: 'success',
      results: tests.length,
      data: { tests }
    });
  } catch (error) {
    next(error);
  }
};

export const createTest = async (req, res, next) => {
  try {
    const testData = {
      ...req.body,
      organizationId: req.user.organizationId._id || req.user.organizationId,
      createdBy: req.user._id
    };

    const test = await Test.create(testData);

    res.status(201).json({
      status: 'success',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTest = async (req, res, next) => {
  try {
    const test = await Test.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId._id || req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!test) {
      return next(new AppError('Test not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};
