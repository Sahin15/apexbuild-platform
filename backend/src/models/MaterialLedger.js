import mongoose from 'mongoose';

const materialLedgerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  type: { type: String, enum: ['RECEIPT', 'CONSUMPTION', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'], required: true },
  quantity: { type: Number, required: true }, // positive for in, negative for out
  referenceId: { type: String }, // ID of the PO, transfer ticket, etc.
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('MaterialLedger', materialLedgerSchema);
