import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
  quantity: { type: Number, required: true, min: 1 },
  rate: { type: Number, required: true, min: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  total: { type: Number, required: true }
});

const supplierOrderSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  orderNumber: { type: String, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierCustomer', required: true },
  orderDate: { type: Date, required: true },
  expectedDeliveryDate: { type: Date },
  items: [orderItemSchema],
  subTotal: { type: Number, required: true },
  taxTotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  transportCost: { type: Number, default: 0 },
  otherCost: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'], default: 'PENDING' },
  paymentStatus: { type: String, enum: ['UNPAID', 'PARTIAL', 'PAID'], default: 'UNPAID' },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  deliveryAddress: { type: String },
  notes: { type: String },
  attachments: [{ type: String }]
}, { timestamps: true });

supplierOrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
supplierOrderSchema.index({ organizationId: 1, customer: 1 });

export default mongoose.model('SupplierOrder', supplierOrderSchema);
