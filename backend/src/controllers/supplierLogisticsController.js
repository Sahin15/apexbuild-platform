import SupplierVehicle from '../models/SupplierVehicle.js';
import SupplierDriver from '../models/SupplierDriver.js';
import AppError from '../utils/AppError.js';

export const getLogistics = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const [vehicles, drivers] = await Promise.all([
      SupplierVehicle.find({ organizationId: orgId }).sort('-createdAt'),
      SupplierDriver.find({ organizationId: orgId }).sort('-createdAt')
    ]);
    res.status(200).json({ status: 'success', data: { vehicles, drivers } });
  } catch (error) { next(error); }
};

export const createVehicle = async (req, res, next) => {
  try {
    const vehicle = await SupplierVehicle.create({ ...req.body, organizationId: req.user.organizationId });
    res.status(201).json({ status: 'success', data: { vehicle } });
  } catch (error) { next(error); }
};

export const createDriver = async (req, res, next) => {
  try {
    const driver = await SupplierDriver.create({ ...req.body, organizationId: req.user.organizationId });
    res.status(201).json({ status: 'success', data: { driver } });
  } catch (error) { next(error); }
};
