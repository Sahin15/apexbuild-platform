import mongoose from 'mongoose';

const reportDispatchSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  dispatchId: { type: String, required: true }, // e.g. DSP-2026-00001
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },

  recipientType: { 
    type: String, 
    enum: ['PATIENT', 'DOCTOR'], 
    default: 'PATIENT' 
  },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  
  channel: { 
    type: String, 
    enum: ['WHATSAPP', 'SMS', 'EMAIL'], 
    default: 'WHATSAPP' 
  },
  status: { 
    type: String, 
    enum: ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'], 
    default: 'SENT',
    index: true 
  },

  messageContent: { type: String, required: true },
  reportDownloadUrl: { type: String, default: '' },
  
  hasCriticalValues: { type: Boolean, default: false },
  dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dispatchedByName: { type: String, default: 'Automated Dispatch' },
  dispatchedAt: { type: Date, default: Date.now },
  deliveryNotes: { type: String, default: '' }
}, { timestamps: true });

reportDispatchSchema.index({ organizationId: 1, dispatchId: 1 }, { unique: true });

reportDispatchSchema.pre('validate', async function () {
  if (!this.dispatchId) {
    const year = new Date().getFullYear();
    const lastDoc = await mongoose.model('ReportDispatch')
      .findOne({ organizationId: this.organizationId })
      .sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastDoc && lastDoc.dispatchId) {
      const match = lastDoc.dispatchId.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.dispatchId = `DSP-${year}-${String(nextNum).padStart(5, '0')}`;
  }
});

export default mongoose.model('ReportDispatch', reportDispatchSchema);
