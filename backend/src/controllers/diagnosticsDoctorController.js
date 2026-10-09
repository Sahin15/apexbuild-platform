import Doctor from '../models/Doctor.js';
import AppError from '../utils/AppError.js';

export const getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ organizationId: req.user.organizationId._id || req.user.organizationId })
      .sort({ name: 1 });

    res.status(200).json({
      status: 'success',
      results: doctors.length,
      data: { doctors }
    });
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req, res, next) => {
  try {
    const doctorData = {
      ...req.body,
      organizationId: req.user.organizationId._id || req.user.organizationId,
      createdBy: req.user._id
    };

    const doctor = await Doctor.create(doctorData);

    res.status(201).json({
      status: 'success',
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};
