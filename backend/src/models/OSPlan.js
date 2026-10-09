import mongoose from 'mongoose';

const osPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  osProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'OSProduct', required: true },
  monthlyPrice: { type: Number, required: true },
  yearlyPrice: { type: Number, required: true },
  setupFee: { type: Number, default: 0 },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  featureEntitlements: { type: Object, default: {} },
  usageLimits: {
    users: { type: Number, default: -1 }, // -1 means unlimited
    storageGB: { type: Number, default: 5 },
    projects: { type: Number, default: -1 },
    transactions: { type: Number, default: -1 }
  },
  supportLevel: { type: String, enum: ['standard', 'priority', 'dedicated'], default: 'standard' }
}, { timestamps: true });

export default mongoose.model('OSPlan', osPlanSchema);
