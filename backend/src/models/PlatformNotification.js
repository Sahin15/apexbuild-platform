import mongoose from 'mongoose';

const platformNotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['SYSTEM', 'BILLING', 'SECURITY', 'ANNOUNCEMENT'],
    default: 'ANNOUNCEMENT'
  },
  targetAudience: {
    type: String,
    enum: ['ALL_TENANTS', 'SPECIFIC_TENANTS', 'SUPER_ADMINS'],
    default: 'ALL_TENANTS'
  },
  targetOrganizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }], // If SPECIFIC_TENANTS
  status: {
    type: String,
    enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('PlatformNotification', platformNotificationSchema);
