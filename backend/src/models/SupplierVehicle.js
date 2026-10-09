import mongoose from 'mongoose';

const supplierVehicleSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  vehicleNumber: { type: String, required: true },
  transportCompany: { type: String },
  capacity: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
}, { timestamps: true });

export default mongoose.model('SupplierVehicle', supplierVehicleSchema);
