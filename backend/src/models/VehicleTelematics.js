import mongoose from 'mongoose';

const vehicleTelematicsSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  vehicleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DistributorVehicle', 
    required: true, 
    index: true 
  },
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    index: true 
  },
  tripId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'DistributorTripLog' 
  },
  platform: { 
    type: String, 
    enum: ['CHICKEN_DISTRIBUTOR', 'MATERIAL_SUPPLIER', 'CONTRACTOR', 'DIAGNOSTICS'], 
    default: 'CHICKEN_DISTRIBUTOR',
    index: true
  },
  currentLocation: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracy: { type: Number, default: 10 }, // meters
    heading: { type: Number, default: 0 }, // 0 - 360 degrees
    speed: { type: Number, default: 0 }, // km/h
    altitude: { type: Number, default: 0 }
  },
  status: { 
    type: String, 
    enum: ['MOVING', 'IDLE', 'STOPPED', 'OFFLINE'], 
    default: 'IDLE' 
  },
  batteryLevel: { type: Number }, // 0 - 100 %
  currentOdometer: { type: Number },
  lastPingAt: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  locationHistory: [
    {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
      speed: { type: Number, default: 0 },
      heading: { type: Number, default: 0 },
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

// Compound index for fast queries by organization and lastPingAt
vehicleTelematicsSchema.index({ organizationId: 1, lastPingAt: -1 });
vehicleTelematicsSchema.index({ vehicleId: 1, organizationId: 1 }, { unique: true });

export default mongoose.model('VehicleTelematics', vehicleTelematicsSchema);
