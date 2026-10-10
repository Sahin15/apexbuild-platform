import mongoose from 'mongoose';

const raBillItemSchema = new mongoose.Schema({
  boqItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQItem', required: true },
  itemCode: { type: String, default: '' },
  description: { type: String, default: '' },
  unit: { type: String, default: 'cum' },
  rate: { type: Number, default: 0 },
  tenderQty: { type: Number, default: 0 },
  previousQty: { type: Number, default: 0 },
  currentQty: { type: Number, default: 0 },
  uptoDateQty: { type: Number, default: 0 },
  previousAmount: { type: Number, default: 0 },
  currentAmount: { type: Number, default: 0 },
  uptoDateAmount: { type: Number, default: 0 },
  measurementIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Measurement' }]
}, { _id: false });

const raBillSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  billNo: { type: String, required: true }, // e.g. "RA Bill #01"
  billSequence: { type: Number, default: 1 },
  billDate: { type: Date, default: Date.now },
  period: { type: String, required: true }, // e.g. "01 Aug 2026 - 31 Aug 2026"
  periodFrom: { type: Date },
  periodTo: { type: Date },
  items: [raBillItemSchema],
  
  // Gross Work Done
  grossCurrentAmount: { type: Number, required: true },
  grossPreviousAmount: { type: Number, default: 0 },
  grossUptoDateAmount: { type: Number, required: true },
  
  // Backward compatibility alias
  grossAmount: { type: Number, default: 0 },

  // Statutory Deductions & Recoveries
  retentionPercent: { type: Number, default: 5 },
  retentionAmount: { type: Number, default: 0 },
  retentionUptoDate: { type: Number, default: 0 },
  mobAdvanceRecovery: { type: Number, default: 0 },
  materialRecovery: { type: Number, default: 0 },
  labourCessPercent: { type: Number, default: 1 },
  labourCessAmount: { type: Number, default: 0 },
  tdsPercent: { type: Number, default: 2 },
  tdsAmount: { type: Number, default: 0 },
  otherDeductions: { type: Number, default: 0 },
  totalDeductions: { type: Number, default: 0 },

  // Net & Tax
  netPayableBeforeTax: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 18 },
  gstAmount: { type: Number, default: 0 },
  netPayable: { type: Number, required: true },

  // Payment Tracking
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  paymentDate: { type: Date },
  paymentReference: { type: String, default: '' },

  status: { 
    type: String, 
    enum: ['DRAFT', 'SUBMITTED', 'VERIFIED', 'APPROVED', 'PAID', 'REJECTED'], 
    default: 'DRAFT' 
  },
  engineerRemarks: { type: String, default: '' },
  clientRemarks: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { timestamps: true });

// Auto-sync backward compatibility fields before saving
raBillSchema.pre('save', function () {
  if (!this.grossAmount) this.grossAmount = this.grossCurrentAmount;
  if (!this.balanceDue && this.netPayable) this.balanceDue = Math.max(0, this.netPayable - (this.paidAmount || 0));
});

export default mongoose.model('RABill', raBillSchema);
