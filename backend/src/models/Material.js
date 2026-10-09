import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional: If specific to a project
  name: { type: String, required: true },
  category: { type: String, required: true },
  unit: { type: String, required: true },
  minStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 }, // Computed/Updated field based on Ledger
  unitPrice: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Material', materialSchema);
