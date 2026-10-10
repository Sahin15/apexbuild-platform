import mongoose from 'mongoose';

const indentItemSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  materialName: { type: String, required: true },
  unit: { type: String, required: true },
  requiredQty: { type: Number, required: true, min: 0.01 },
  estimatedRate: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  purpose: { type: String, default: '' }
}, { _id: false });

const materialIndentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  indentNo: { type: String, required: true }, // e.g. "IND-2026-001"
  requestDate: { type: Date, required: true, default: Date.now },
  requiredByDate: { type: Date, required: true },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  wbsActivity: { type: String, default: '' },
  remarks: { type: String, default: '' },
  
  items: [indentItemSchema],
  totalEstimatedCost: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PO_ISSUED', 'FULFILLED', 'REJECTED'],
    default: 'PENDING_APPROVAL'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String, default: '' }
}, { timestamps: true });

materialIndentSchema.pre('save', function () {
  if (Array.isArray(this.items)) {
    this.totalEstimatedCost = this.items.reduce((sum, item) => {
      return sum + ((Number(item.requiredQty) || 0) * (Number(item.estimatedRate) || 0));
    }, 0);
  }
});

export default mongoose.model('MaterialIndent', materialIndentSchema);
