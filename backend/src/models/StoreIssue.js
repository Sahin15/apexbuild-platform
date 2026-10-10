import mongoose from 'mongoose';

const storeIssueItemSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material', required: true },
  materialName: { type: String, required: true },
  unit: { type: String, required: true },
  issuedQty: { type: Number, required: true, min: 0.01 },
  unitPrice: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 }
}, { _id: false });

const storeIssueSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  issueSlipNo: { type: String, required: true }, // e.g. "ISS-2026-001"
  issueDate: { type: Date, required: true, default: Date.now },
  
  // Execution allocation
  issuedTo: { type: String, required: true }, // Contractor / Foreman / Gang name
  locationGrid: { type: String, required: true }, // e.g. "Raft Grid B2-E5"
  wbsCode: { type: String, default: '' },
  purpose: { type: String, required: true },
  
  items: [storeIssueItemSchema],
  totalCost: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['ISSUED', 'RETURNED', 'CANCELLED'],
    default: 'ISSUED'
  },
  
  issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Storekeeper
  receivedBySign: { type: String, default: 'Authorized Foreman' }
}, { timestamps: true });

storeIssueSchema.pre('save', function () {
  if (Array.isArray(this.items)) {
    this.totalCost = this.items.reduce((sum, item) => {
      const itemCost = (Number(item.issuedQty) || 0) * (Number(item.unitPrice) || 0);
      item.totalCost = itemCost;
      return sum + itemCost;
    }, 0);
  }
});

export default mongoose.model('StoreIssue', storeIssueSchema);
