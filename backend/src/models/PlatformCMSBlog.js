import mongoose from 'mongoose';

const platformCMSBlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  excerpt: { type: String },
  category: { type: String, default: 'Uncategorized' },
  tags: [{ type: String }],
  status: { type: String, enum: ['PUBLISHED', 'DRAFT', 'ARCHIVED'], default: 'DRAFT' },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  seoTitle: { type: String },
  seoDescription: { type: String },
  coverImage: { type: String },
  publishedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('PlatformCMSBlog', platformCMSBlogSchema);
