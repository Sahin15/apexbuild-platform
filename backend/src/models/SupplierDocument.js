import mongoose from 'mongoose';

const supplierDocumentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['INVOICE', 'CHALLAN', 'RECEIPT', 'CONTRACT', 'OTHER'], default: 'OTHER' },
  fileUrl: { type: String, required: true }, // URL or path
  fileType: { type: String },
  fileSize: { type: Number },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

supplierDocumentSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.model('SupplierDocument', supplierDocumentSchema);
