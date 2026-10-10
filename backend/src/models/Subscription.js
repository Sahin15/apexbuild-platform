import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  businessPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessPartner' },
  osProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'OSProduct', required: true },
  osPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'OSPlan', required: true },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  basePrice: { type: Number, required: true },
  customPrice: { type: Number },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  nextBillingDate: { type: Date },
  dueDate: { type: Date },
  gracePeriodDays: { type: Number, default: 7 },
  status: { type: String, enum: ['PENDING_APPROVAL', 'PENDING_PAYMENT', 'ACTIVE', 'PAYMENT_DUE', 'GRACE_PERIOD', 'RESTRICTED', 'SUSPENDED', 'CANCELLED', 'EXPIRED'], default: 'PENDING_APPROVAL' },
  customEntitlements: { type: Object, default: {} },
  customUsageLimits: { type: Object, default: {} },
  cancellationDate: { type: Date },
  suspensionDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Subscription', subscriptionSchema);
