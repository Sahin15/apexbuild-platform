import mongoose from 'mongoose';

const platformCMSMediaSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileType: { type: String, enum: ['IMAGE', 'VIDEO', 'DOCUMENT'], default: 'IMAGE' },
  mimeType: { type: String },
  url: { type: String, required: true },
  sizeBytes: { type: Number, default: 0 },
  altText: { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('PlatformCMSMedia', platformCMSMediaSchema);
