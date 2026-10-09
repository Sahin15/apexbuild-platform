import mongoose from 'mongoose';

const boqSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  version: { type: String, default: 'v1.0' },
  status: { type: String, enum: ['DRAFT', 'APPROVED', 'LOCKED'], default: 'DRAFT' },
  totalAmount: { type: Number, default: 0 },
  importedFrom: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('BOQ', boqSchema);