import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const supplierPurchaseSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  purchaseNumber: { type: String, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierVendor', required: true },
  purchaseDate: { type: Date, required: true },
  items: [purchaseItemSchema],
  subTotal: { type: Number, required: true },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  transportCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  stockReceived: { type: Boolean, default: false }, // If true, inventory is updated
  notes: { type: String },
  attachments: [{ type: String }]
}, { timestamps: true });

supplierPurchaseSchema.index({ organizationId: 1, purchaseNumber: 1 }, { unique: true });
supplierPurchaseSchema.index({ organizationId: 1, vendor: 1 });

export default mongoose.model('SupplierPurchase', supplierPurchaseSchema);
