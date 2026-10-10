import mongoose from 'mongoose';

const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String },
  referenceRange: { type: String },
  method: { type: String },
  notes: { type: String },
  isOptional: { type: Boolean, default: false }
});

const testSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  testId: { type: String, required: true }, // e.g., TST-001
  name: { type: String, required: true },
  category: { type: String }, // e.g., Biochemistry, Hematology
  department: { type: String }, // e.g., Pathology, Radiology
  sampleType: { type: String }, // e.g., Blood, Urine, None
  containerType: { type: String }, // e.g., EDTA, SST, Plain
  price: { type: Number, required: true },
  preparationInstructions: { type: String }, // e.g., Fasting 10-12 hours
  turnaroundTime: { type: String, default: '4 Hours' }, // e.g., 2 Hours, 24 Hours
  tatHours: { type: Number, default: 4 }, // Standard turnaround time SLA in hours
  method: { type: String },
  notes: { type: String },
  parameters: [parameterSchema],
  isPackage: { type: Boolean, default: false }, // If true, this test groups other tests
  includedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }], // For packages
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

testSchema.index({ organizationId: 1, testId: 1 }, { unique: true });

testSchema.pre('validate', async function () {
  if (!this.testId) {
    const lastDoc = await mongoose.model('Test').findOne({ organizationId: this.organizationId }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastDoc && lastDoc.testId) {
      const match = lastDoc.testId.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.testId = `TST-${String(nextNum).padStart(4, '0')}`;
  }
});

export default mongoose.model('Test', testSchema);
