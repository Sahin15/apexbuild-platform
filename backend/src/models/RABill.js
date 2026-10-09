import mongoose from 'mongoose';

const raBillSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  billNo: { type: String, required: true }, 
  period: { type: String, required: true }, 
  grossAmount: { type: Number, required: true },
  retentionAmount: { type: Number, default: 0 },
  netPayable: { type: Number, required: true },
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'PAID'], default: 'DRAFT' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('RABill', raBillSchema);
