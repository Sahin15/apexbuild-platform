import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['CHICKEN_DISTRIBUTOR', 'MATERIAL_SUPPLIER', 'CONTRACTOR', 'DIAGNOSTICS', 'ALL'],
    default: 'ALL',
    index: true
  },
  endpoint: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expirationTime: {
    type: Date,
    default: null
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  userAgent: {
    type: String,
    default: ''
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
