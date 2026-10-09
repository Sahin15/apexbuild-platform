import mongoose from 'mongoose';

const globalTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['BOQ_ITEM', 'MEDICAL_TEST', 'INVENTORY_CATEGORY', 'TAX_RULE'], required: true },
  targetOS: { type: String, enum: ['CONTRACTOR', 'DIAGNOSTICS', 'CHICKEN_DISTRIBUTOR', 'MATERIAL_SUPPLIER', 'ALL'], required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true }, // Dynamic payload depending on type
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 },
  description: { type: String }
}, { timestamps: true });

export default mongoose.model('GlobalTemplate', globalTemplateSchema);
