import mongoose from 'mongoose';

const quotationItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 }
});

const supplierQuotationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  quotationNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierCustomer', required: true },
  quotationDate: { type: Date, required: true, default: Date.now },
  validUntil: { type: Date },
  items: [quotationItemSchema],
  subTotal: { type: Number, required: true, default: 0 },
  transportCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'], default: 'DRAFT' },
  notes: { type: String },
  termsAndConditions: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

supplierQuotationSchema.index({ organizationId: 1, quotationNumber: 1 }, { unique: true });
supplierQuotationSchema.index({ organizationId: 1, customer: 1 });

export default mongoose.model('SupplierQuotation', supplierQuotationSchema);
