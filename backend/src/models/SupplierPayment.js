import mongoose from 'mongoose';

const supplierPaymentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  paymentNumber: { type: String, required: true },
  type: { type: String, enum: ['IN', 'OUT'], required: true }, // IN = Received from Customer, OUT = Paid to Vendor
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierCustomer' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierVendor' },
  amount: { type: Number, required: true, min: 1 },
  paymentDate: { type: Date, required: true, default: Date.now },
  paymentMode: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], required: true },
  referenceNumber: { type: String }, // Transaction ID or Cheque No
  notes: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

supplierPaymentSchema.index({ organizationId: 1, paymentNumber: 1 }, { unique: true });
supplierPaymentSchema.index({ organizationId: 1, customer: 1 });
supplierPaymentSchema.index({ organizationId: 1, vendor: 1 });

export default mongoose.model('SupplierPayment', supplierPaymentSchema);
