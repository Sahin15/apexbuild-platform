import mongoose from 'mongoose';

const supplierVendorSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  companyName: { type: String },
  phone: { type: String, required: true },
  whatsappNumber: { type: String },
  email: { type: String },
  gstin: { type: String },
  address: { type: String },
  paymentTerms: { type: String },
  creditLimit: { type: Number, default: 0 },
  openingBalance: { type: Number, default: 0 },
  currentPayable: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  notes: { type: String }
}, { timestamps: true });

supplierVendorSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model('SupplierVendor', supplierVendorSchema);
