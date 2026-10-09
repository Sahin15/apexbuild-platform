import mongoose from 'mongoose';

const distributorTripLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorVehicle', required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now },
  startOdometer: { type: Number, required: true },
  endOdometer: { type: Number }, // To be filled at end of trip
  locations: { type: String }, // e.g., 'Sector V, Newtown'
  status: { type: String, enum: ['ONGOING', 'COMPLETED'], default: 'ONGOING' }
}, { timestamps: true });

export default mongoose.model('DistributorTripLog', distributorTripLogSchema);
