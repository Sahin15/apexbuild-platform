import Organization from '../models/Organization.js';
import AppError from '../utils/AppError.js';

export const getOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.user.organizationId);
    if (!org) return next(new AppError('Organization not found', 404));

    res.status(200).json({
      status: 'success',
      data: { organization: org }
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndUpdate(
      req.user.organizationId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!org) return next(new AppError('Organization not found', 404));

    res.status(200).json({
      status: 'success',
      data: { organization: org }
    });
  } catch (error) {
    next(error);
  }
};
