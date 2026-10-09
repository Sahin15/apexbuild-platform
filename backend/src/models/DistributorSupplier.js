import mongoose from 'mongoose';

const distributorSupplierSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  companyName: { type: String },
  contactPerson: { type: String },
  phone: { type: String, required: true },
  whatsapp: { type: String },
  address: { type: String },
  gstin: { type: String },
  paymentTerms: { type: String },
  openingDue: { type: Number, default: 0 },
  currentPayable: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('DistributorSupplier', distributorSupplierSchema);
