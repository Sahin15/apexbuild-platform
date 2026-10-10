import mongoose from 'mongoose';

const criticalAlertSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  alertNumber: { type: String, required: true }, // e.g. ALT-2026-0001
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  result: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' },

  parameterName: { type: String, required: true },
  observedValue: { type: String, required: true },
  referenceRange: { type: String, default: '' },
  unit: { type: String, default: '' },
  criticalThreshold: { type: String, required: true }, // Reason for panic trigger
  severity: { 
    type: String, 
    enum: ['CRITICAL_PANIC', 'URGENT_ABNORMAL'], 
    default: 'CRITICAL_PANIC' 
  },

  // Statutory NABL Verbal Communication Audit Trail
  communicationStatus: {
    type: String,
    enum: ['PENDING_COMMUNICATION', 'COMMUNICATED', 'ESCALATED', 'UNREACHABLE'],
    default: 'PENDING_COMMUNICATION',
    index: true
  },
  communicatedTo: { type: String, default: '' }, // Dr. Name or Attendant Name
  communicatedToRole: { type: String, enum: ['Referring Doctor', 'Treating Physician', 'Patient Attendant', 'Ward Sister', 'Other'], default: 'Referring Doctor' },
  communicatedPhone: { type: String, default: '' },
  communicatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  communicatedByName: { type: String, default: '' },
  communicatedAt: { type: Date },
  readBackConfirmed: { type: Boolean, default: false }, // Mandatory NABL read-back confirmation
  clinicalNotes: { type: String, default: '' },

  detectedAt: { type: Date, default: Date.now }
}, { timestamps: true });

criticalAlertSchema.index({ organizationId: 1, alertNumber: 1 }, { unique: true });

criticalAlertSchema.pre('validate', async function () {
  if (!this.alertNumber) {
    const year = new Date().getFullYear();
    const lastDoc = await mongoose.model('CriticalAlert')
      .findOne({ organizationId: this.organizationId })
      .sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastDoc && lastDoc.alertNumber) {
      const match = lastDoc.alertNumber.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.alertNumber = `ALT-${year}-${String(nextNum).padStart(4, '0')}`;
  }
});

export default mongoose.model('CriticalAlert', criticalAlertSchema);
