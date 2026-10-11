import mongoose from 'mongoose';

const fcmTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  platform: {
    type: String,
    enum: ['CHICKEN_DISTRIBUTOR', 'MATERIAL_SUPPLIER', 'CONTRACTOR', 'DIAGNOSTICS', 'ALL'],
    default: 'ALL',
    index: true
  },
  deviceType: {
    type: String,
    enum: ['android', 'ios', 'web', 'unknown'],
    default: 'web'
  },
  topics: [{
    type: String,
    trim: true
  }],
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

export default mongoose.model('FcmToken', fcmTokenSchema);
