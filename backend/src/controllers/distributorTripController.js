import DistributorTripLog from '../models/DistributorTripLog.js';
import DistributorVehicle from '../models/DistributorVehicle.js';

export const getActiveTrip = async (req, res, next) => {
  try {
    const trip = await DistributorTripLog.findOne({
      organizationId: req.user.organizationId,
      driverId: req.user._id,
      status: 'ONGOING'
    }).populate('vehicleId', 'registrationNumber vehicleType');
    
    // For OWNER, they might have an active trip where they are the driver
    res.status(200).json({ status: 'success', data: { trip } });
  } catch (error) {
    next(error);
  }
};

export const startTrip = async (req, res, next) => {
  try {
    const { vehicleId, startOdometer, locations } = req.body;
    
    // Check if user already has an active trip
    const existingTrip = await DistributorTripLog.findOne({
      organizationId: req.user.organizationId,
      driverId: req.user._id,
      status: 'ONGOING'
    });
    
    if (existingTrip) {
      return res.status(400).json({ status: 'error', message: 'You already have an active trip. Please end it first.' });
    }

    const trip = await DistributorTripLog.create({
      organizationId: req.user.organizationId,
      vehicleId,
      driverId: req.user._id,
      startOdometer: Number(startOdometer),
      locations
    });

    // Update Vehicle
    const vehicle = await DistributorVehicle.findById(vehicleId);
    if (vehicle) {
      vehicle.activeDriver = req.user.name;
      vehicle.activeRoute = locations;
      vehicle.currentOdometer = Math.max(vehicle.currentOdometer, Number(startOdometer));
      await vehicle.save();
    }

    res.status(201).json({ status: 'success', data: { trip } });
  } catch (error) {
    next(error);
  }
};

export const endTrip = async (req, res, next) => {
  try {
    const { endOdometer } = req.body;
    const trip = await DistributorTripLog.findOne({
      organizationId: req.user.organizationId,
      driverId: req.user._id,
      status: 'ONGOING'
    });

    if (!trip) {
      return res.status(404).json({ status: 'error', message: 'No active trip found.' });
    }

    if (Number(endOdometer) < trip.startOdometer) {
      return res.status(400).json({ status: 'error', message: 'End odometer cannot be less than start odometer.' });
    }

    trip.endOdometer = Number(endOdometer);
    trip.status = 'COMPLETED';
    await trip.save();

    // Update Vehicle
    const vehicle = await DistributorVehicle.findById(trip.vehicleId);
    if (vehicle) {
      vehicle.activeDriver = null;
      vehicle.activeRoute = null;
      vehicle.currentOdometer = Math.max(vehicle.currentOdometer, Number(endOdometer));
      await vehicle.save();
    }

    res.status(200).json({ status: 'success', data: { trip } });
  } catch (error) {
    next(error);
  }
};
