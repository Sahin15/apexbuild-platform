import mongoose from 'mongoose';

const measurementSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  boqItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQItem', required: true },
  mbRef: { type: String, required: true }, 
  date: { type: Date, required: true },
  quantity: { type: Number, required: true },
  status: { type: String, enum: ['PENDING', 'VERIFIED', 'BILLED'], default: 'PENDING' },
  measuredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  raBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'RABill' } 
}, { timestamps: true });

export default mongoose.model('Measurement', measurementSchema);
