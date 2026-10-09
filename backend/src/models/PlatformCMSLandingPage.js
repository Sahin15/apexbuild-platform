import mongoose from 'mongoose';

const platformCMSLandingPageSchema = new mongoose.Schema({
  campaignName: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  blocks: [{
    type: { type: String, enum: ['hero', 'features', 'testimonials', 'cta', 'html'], required: true },
    content: { type: Object, default: {} },
    order: { type: Number, default: 0 }
  }],
  conversionGoal: { type: String },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  metaTitle: { type: String },
  metaDescription: { type: String },
  viewCount: { type: Number, default: 0 },
  conversionCount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('PlatformCMSLandingPage', platformCMSLandingPageSchema);
