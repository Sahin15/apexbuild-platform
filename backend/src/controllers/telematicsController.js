import VehicleTelematics from '../models/VehicleTelematics.js';
import DistributorVehicle from '../models/DistributorVehicle.js';
import AppError from '../utils/AppError.js';

/**
 * Record a real-time GPS telemetry ping from driver's mobile device
 */
export const recordPing = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const driverId = req.user._id;

    const {
      vehicleId,
      tripId,
      latitude,
      longitude,
      accuracy = 10,
      heading = 0,
      speed = 0, // km/h
      altitude = 0,
      batteryLevel,
      odometer,
      platform = 'CHICKEN_DISTRIBUTOR'
    } = req.body;

    if (!vehicleId) {
      return next(new AppError('Vehicle ID is required', 400));
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return next(new AppError('Valid latitude and longitude coordinates are required', 400));
    }

    const numSpeed = Math.max(0, Number(speed) || 0);
    const numHeading = Math.max(0, Math.min(360, Number(heading) || 0));
    const status = numSpeed > 3 ? 'MOVING' : 'IDLE';

    const breadcrumb = {
      latitude: lat,
      longitude: lng,
      speed: numSpeed,
      heading: numHeading,
      timestamp: new Date()
    };

    const telematics = await VehicleTelematics.findOneAndUpdate(
      { organizationId: orgId, vehicleId },
      {
        $set: {
          driverId,
          tripId: tripId || null,
          platform,
          currentLocation: {
            latitude: lat,
            longitude: lng,
            accuracy: Number(accuracy) || 10,
            heading: numHeading,
            speed: numSpeed,
            altitude: Number(altitude) || 0
          },
          status,
          batteryLevel: batteryLevel !== undefined ? Number(batteryLevel) : undefined,
          currentOdometer: odometer ? Number(odometer) : undefined,
          lastPingAt: new Date()
        },
        $push: {
          locationHistory: {
            $each: [breadcrumb],
            $slice: -100 // retain latest 100 breadcrumbs
          }
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Optionally update vehicle current odometer
    if (odometer && Number(odometer) > 0) {
      await DistributorVehicle.findByIdAndUpdate(vehicleId, {
        currentOdometer: Number(odometer)
      }).catch(() => {});
    }

    res.status(200).json({
      status: 'success',
      data: {
        telematicsId: telematics._id,
        status: telematics.status,
        speed: numSpeed,
        lastPingAt: telematics.lastPingAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get real-time live positions of all active fleet vehicles in organization
 */
export const getLiveFleet = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const { platform } = req.query;

    const query = { organizationId: orgId };
    if (platform && platform !== 'ALL') {
      query.platform = platform;
    }

    const records = await VehicleTelematics.find(query)
      .populate('vehicleId', 'registrationNumber vehicleType capacity status currentOdometer')
      .populate('driverId', 'name phone email role')
      .lean();

    const now = Date.now();
    const OFFLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes without ping = OFFLINE

    const fleet = records.map(rec => {
      const timeSincePing = now - new Date(rec.lastPingAt).getTime();
      let liveStatus = rec.status;
      if (timeSincePing > OFFLINE_THRESHOLD_MS) {
        liveStatus = 'OFFLINE';
      }

      return {
        ...rec,
        status: liveStatus,
        timeSincePingSeconds: Math.floor(timeSincePing / 1000)
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalVehicles: fleet.length,
        movingCount: fleet.filter(f => f.status === 'MOVING').length,
        idleCount: fleet.filter(f => f.status === 'IDLE').length,
        offlineCount: fleet.filter(f => f.status === 'OFFLINE').length,
        fleet
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get route breadcrumb history and trip statistics for a specific vehicle
 */
export const getVehicleRouteHistory = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const { vehicleId } = req.params;

    const telematics = await VehicleTelematics.findOne({
      organizationId: orgId,
      vehicleId
    })
      .populate('vehicleId', 'registrationNumber vehicleType capacity currentOdometer')
      .populate('driverId', 'name phone')
      .lean();

    if (!telematics) {
      return next(new AppError('No telemetry records found for this vehicle', 404));
    }

    const history = telematics.locationHistory || [];
    const maxSpeed = history.reduce((max, pt) => Math.max(max, pt.speed || 0), 0);
    const avgSpeed = history.length > 0 
      ? Math.round(history.reduce((sum, pt) => sum + (pt.speed || 0), 0) / history.length) 
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        vehicle: telematics.vehicleId,
        driver: telematics.driverId,
        currentLocation: telematics.currentLocation,
        status: telematics.status,
        lastPingAt: telematics.lastPingAt,
        breadcrumbs: history,
        totalPoints: history.length,
        maxSpeed,
        avgSpeed
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Developer helper: Simulate telemetry movement for demonstration/testing
 */
export const simulateTelemetry = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId?._id || req.user.organizationId;
    const { vehicleId } = req.params;

    // Kolkata / New Town base coordinates as realistic simulation center
    const baseLat = 22.5726;
    const baseLng = 88.3639;

    // Small pseudo-random displacement along road corridor
    const offsetLat = (Math.random() - 0.5) * 0.04;
    const offsetLng = (Math.random() - 0.5) * 0.04;
    const speed = Math.floor(Math.random() * 45) + 15;
    const heading = Math.floor(Math.random() * 360);

    const breadcrumb = {
      latitude: baseLat + offsetLat,
      longitude: baseLng + offsetLng,
      speed,
      heading,
      timestamp: new Date()
    };

    const telematics = await VehicleTelematics.findOneAndUpdate(
      { organizationId: orgId, vehicleId },
      {
        $set: {
          driverId: req.user._id,
          platform: 'CHICKEN_DISTRIBUTOR',
          currentLocation: {
            latitude: baseLat + offsetLat,
            longitude: baseLng + offsetLng,
            accuracy: 8,
            heading,
            speed,
            altitude: 12
          },
          status: 'MOVING',
          batteryLevel: 88,
          lastPingAt: new Date()
        },
        $push: {
          locationHistory: {
            $each: [breadcrumb],
            $slice: -100
          }
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Telemetry coordinates simulated',
      data: { telematics }
    });
  } catch (error) {
    next(error);
  }
};
