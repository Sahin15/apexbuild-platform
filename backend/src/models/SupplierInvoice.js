import mongoose from 'mongoose';

const supplierInvoiceSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  invoiceNumber: { type: String, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierOrder' }, // Optional, can be direct invoice
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierCustomer', required: true },
  invoiceDate: { type: Date, required: true },
  dueDate: { type: Date },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
    quantity: { type: Number, required: true, min: 1 },
    rate: { type: Number, required: true, min: 0 },
    taxAmount: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  subTotal: { type: Number, required: true },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  transportCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  status: { type: String, enum: ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'CANCELLED'], default: 'DRAFT' },
  notes: { type: String },
  termsAndConditions: { type: String }
}, { timestamps: true });

supplierInvoiceSchema.index({ organizationId: 1, invoiceNumber: 1 }, { unique: true });
supplierInvoiceSchema.index({ organizationId: 1, customer: 1 });

export default mongoose.model('SupplierInvoice', supplierInvoiceSchema);
