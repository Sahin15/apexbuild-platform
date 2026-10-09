import mongoose from 'mongoose';

const supplierDeliverySchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  challanNumber: { type: String, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOrder', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierCustomer', required: true },
  dispatchDate: { type: Date, required: true, default: Date.now },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierVehicle' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierDriver' },
  vehicleNumber: { type: String },
  driverName: { type: String },
  driverPhone: { type: String },
  transportCompany: { type: String },
  status: { type: String, enum: ['PENDING', 'DISPATCHED', 'DELIVERED', 'RETURNED'], default: 'PENDING' },
  deliveryNotes: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

supplierDeliverySchema.index({ organizationId: 1, challanNumber: 1 }, { unique: true });
supplierDeliverySchema.index({ organizationId: 1, order: 1 });

export default mongoose.model('SupplierDelivery', supplierDeliverySchema);
