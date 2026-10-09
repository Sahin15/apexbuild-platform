import mongoose from 'mongoose';

const osProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  businessType: { type: String },
  status: { type: String, enum: ['beta', 'production', 'disabled', 'maintenance'], default: 'production' },
  icon: { type: String },
  version: { type: String, default: '1.0.0' }
}, { timestamps: true });

export default mongoose.model('OSProduct', osProductSchema);
