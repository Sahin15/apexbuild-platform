import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  sampleId: { type: String, required: true }, // e.g. SMP-2023-0001
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  // Can be mapped to multiple tests if they share the same tube
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }], 
  
  sampleType: { type: String, required: true }, // e.g., Blood, Urine
  containerType: { type: String, required: true }, // e.g., SST, EDTA
  
  status: { 
    type: String, 
    enum: ['Pending', 'Collected', 'In Lab', 'Processing', 'Tested', 'Rejected'], 
    default: 'Pending' 
  },
  
  barcode: { type: String },
  
  collectedAt: { type: Date },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  receivedInLabAt: { type: Date },
  receivedInLabBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  processingAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  testedAt: { type: Date },
  testedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  rejectionReason: { type: String },
  notes: { type: String }
}, { timestamps: true });

sampleSchema.index({ organizationId: 1, sampleId: 1 }, { unique: true });

sampleSchema.pre('validate', async function () {
  if (!this.sampleId) {
    const lastDoc = await mongoose.model('Sample').findOne({ organizationId: this.organizationId }).sort({ createdAt: -1 });
    const year = new Date().getFullYear();
    let nextNum = 1;
    if (lastDoc && lastDoc.sampleId) {
      const match = lastDoc.sampleId.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.sampleId = `SMP-${year}-${String(nextNum).padStart(5, '0')}`;
    if (!this.barcode) this.barcode = this.sampleId;
  }
});

export default mongoose.model('Sample', sampleSchema);
