import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  businessPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessPartner' },
  osProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'OSProduct' },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  osPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'OSPlan' },
  billingPeriodStart: { type: Date },
  billingPeriodEnd: { type: Date },
  type: { type: String, enum: ['SUBSCRIPTION', 'IMPLEMENTATION', 'ADDON', 'CUSTOM'], default: 'SUBSCRIPTION' },
  implementationFee: { type: Number, default: 0 },
  subscriptionFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true },
  status: { type: String, enum: ['DRAFT', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED'], default: 'ISSUED' },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model('Invoice', invoiceSchema);
