import mongoose from 'mongoose';

const platformCMSPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true }, // HTML or JSON-rich content
  status: { type: String, enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'], default: 'DRAFT' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seoTitle: { type: String },
  seoDescription: { type: String },
  seoKeywords: [{ type: String }],
  coverImage: { type: String }
}, { timestamps: true });

export default mongoose.model('PlatformCMSPage', platformCMSPageSchema);
