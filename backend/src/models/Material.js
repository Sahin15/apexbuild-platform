import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  materialCode: { type: String, default: '' }, // e.g. "CEM-OPC-53"
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  minStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 }, // Synchronized via GRN and Store Issues
  unitPrice: { type: Number, default: 0 },
  hsnCode: { type: String, default: '' },
  storageLocation: { type: String, default: 'Main Yard / Central Store' },
  specification: { type: String, default: '' }
}, { timestamps: true });

materialSchema.virtual('totalValue').get(function () {
  return (this.currentStock || 0) * (this.unitPrice || 0);
});

materialSchema.set('toJSON', { virtuals: true });
materialSchema.set('toObject', { virtuals: true });

export default mongoose.model('Material', materialSchema);
