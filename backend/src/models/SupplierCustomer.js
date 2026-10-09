import mongoose from 'mongoose';

const supplierCustomerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  businessName: { type: String },
  phone: { type: String, required: true },
  whatsappNumber: { type: String },
  email: { type: String },
  gstin: { type: String },
  billingAddress: { type: String },
  deliveryAddress: { type: String },
  contactPerson: { type: String },
  creditLimit: { type: Number, default: 0 },
  paymentTerms: { type: String },
  openingBalance: { type: Number, default: 0 },
  currentDue: { type: Number, default: 0 },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  notes: { type: String }
}, { timestamps: true });

// Indexing for faster queries within an organization
supplierCustomerSchema.index({ organizationId: 1, name: 1 });
supplierCustomerSchema.index({ organizationId: 1, phone: 1 });

export default mongoose.model('SupplierCustomer', supplierCustomerSchema);
