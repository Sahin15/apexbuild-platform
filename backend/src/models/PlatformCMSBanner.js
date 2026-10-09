import mongoose from 'mongoose';

const platformCMSBannerSchema = new mongoose.Schema({
  message: { type: String, required: true },
  linkUrl: { type: String },
  buttonText: { type: String },
  colorScheme: { 
    type: String, 
    enum: ['indigo', 'emerald', 'amber', 'rose', 'slate'],
    default: 'indigo'
  },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('PlatformCMSBanner', platformCMSBannerSchema);
