import mongoose from 'mongoose';

const grnItemSchema = new mongoose.Schema({
  materialId: { type: mongoose.Schema.Types.ObjectId, ref: 'Material' },
  materialName: { type: String, required: true },
  category: { type: String, default: 'General' },
  unit: { type: String, required: true, default: 'Bags' },
  receivedQty: { type: Number, required: true, min: 0 },
  acceptedQty: { type: Number, required: true, min: 0 },
  rejectedQty: { type: Number, default: 0, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  totalAmount: { type: Number, default: 0, min: 0 },
  remarks: { type: String, default: 'Quality sound' }
}, { _id: false });

const goodsReceivedNoteSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  grnNo: { type: String, required: true }, // e.g. "GRN-2026-001"
  receivedDate: { type: Date, required: true, default: Date.now },
  
  // Vendor & Delivery details
  supplierName: { type: String, required: true },
  challanNo: { type: String, required: true },
  vehicleNo: { type: String, default: '' },
  driverName: { type: String, default: '' },
  poNumber: { type: String, default: '' },
  gatePassNo: { type: String, default: '' },
  
  // Line items
  items: [grnItemSchema],
  totalAmount: { type: Number, default: 0 },
  
  // Inspection & QA/QC
  qualityInspectionDone: { type: Boolean, default: true },
  inspectionNotes: { type: String, default: 'Visual inspection passed. Mill test certificates verified.' },
  
  status: { 
    type: String, 
    enum: ['RECEIVED', 'INSPECTED', 'ACCEPTED', 'REJECTED'], 
    default: 'ACCEPTED' 
  },
  
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  inspectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

goodsReceivedNoteSchema.pre('save', function () {
  if (Array.isArray(this.items)) {
    this.totalAmount = this.items.reduce((sum, item) => {
      const itemTotal = (Number(item.acceptedQty) || 0) * (Number(item.unitPrice) || 0);
      item.totalAmount = itemTotal;
      return sum + itemTotal;
    }, 0);
  }
});

export default mongoose.model('GoodsReceivedNote', goodsReceivedNoteSchema);
