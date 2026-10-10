import mongoose from 'mongoose';

const distributorSaleSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  saleNumber: { type: String, required: true },
  saleDate: { type: Date, required: true, default: Date.now },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorCustomer', required: true },
  weight: { type: Number, required: true }, // KG delivered
  sellingRate: { type: Number, required: true }, // Rate applied for this specific sale
  grossAmount: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  otherCharges: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'CREDIT', 'CANCELLED'], default: 'CREDIT' },
  customerSignature: { type: String },
  signedBy: { type: String },
  proofPhoto: { type: String },
  gpsLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }
  },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('DistributorSale', distributorSaleSchema);
