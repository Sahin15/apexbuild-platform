import DistributorVehicle from '../models/DistributorVehicle.js';
import DistributorExpense from '../models/DistributorExpense.js';
import DistributorTripLog from '../models/DistributorTripLog.js';

export const getVehicles = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const vehicles = await DistributorVehicle.find({ organizationId: orgId });
    
    // Compute total expenses and active trips for each vehicle
    const enrichedVehicles = await Promise.all(vehicles.map(async (v) => {
      const expenses = await DistributorExpense.aggregate([
        { $match: { organizationId: orgId, vehicleId: v._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const activeTrip = await DistributorTripLog.findOne({ vehicleId: v._id, status: 'ONGOING' }).populate('driverId', 'name');
      
      return {
        ...v.toObject(),
        totalExpenses: expenses[0]?.total || 0,
        activeDriver: activeTrip?.driverId?.name || null,
        activeRoute: activeTrip?.locations || null
      };
    }));

    res.status(200).json({ status: 'success', data: { vehicles: enrichedVehicles } });
  } catch (error) {
    next(error);
  }
};

export const addVehicle = async (req, res, next) => {
  try {
    const vehicle = await DistributorVehicle.create({
      ...req.body,
      organizationId: req.user.organizationId
    });
    res.status(201).json({ status: 'success', data: { vehicle } });
  } catch (error) {
    next(error);
  }
};

export const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await DistributorVehicle.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!vehicle) return res.status(404).json({ status: 'fail', message: 'Vehicle not found' });
    
    res.status(200).json({ status: 'success', data: { vehicle } });
  } catch (error) {
    next(error);
  }
};
