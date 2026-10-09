import mongoose from 'mongoose';

const distributorPurchaseSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  purchaseNumber: { type: String, required: true },
  purchaseDate: { type: Date, required: true, default: Date.now },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorSupplier', required: true },
  birdType: { type: String, default: 'BROILER' },
  quantity: { type: Number }, // Number of pieces or crates
  weight: { type: Number, required: true }, // Weight in KG
  unit: { type: String, default: 'KG' },
  purchaseRate: { type: Number, required: true },
  grossAmount: { type: Number, required: true },
  otherCharges: { type: Number, default: 0 },
  transportCost: { type: Number, default: 0 },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorVehicle' },
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'UNPAID'], default: 'UNPAID' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('DistributorPurchase', distributorPurchaseSchema);
