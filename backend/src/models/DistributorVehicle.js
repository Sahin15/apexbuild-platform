import mongoose from 'mongoose';

const distributorVehicleSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  registrationNumber: { type: String, required: true },
  vehicleType: { type: String, required: true },
  capacity: { type: Number }, // in KG
  status: { type: String, enum: ['ACTIVE', 'MAINTENANCE', 'INACTIVE'], default: 'ACTIVE' },
  currentOdometer: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('DistributorVehicle', distributorVehicleSchema);
