import mongoose from 'mongoose';

const masterDataTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['BOQ_ITEM', 'MEDICAL_TEST', 'INVENTORY_CATEGORY', 'TAX_RULE', 'SETTINGS'] 
  },
  targetOS: { 
    type: String, 
    required: true,
    enum: ['CONTRACTOR', 'DIAGNOSTICS', 'CHICKEN_DISTRIBUTOR', 'MATERIAL_SUPPLIER', 'ALL']
  },
  description: { type: String, required: true },
  version: { type: Number, default: 1 },
  data: { type: mongoose.Schema.Types.Mixed, required: true }
}, { timestamps: true });

export default mongoose.model('MasterDataTemplate', masterDataTemplateSchema);
