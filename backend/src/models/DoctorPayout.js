import mongoose from 'mongoose';

const doctorPayoutSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  voucherNumber: { type: String, required: true },
  
  periodStart: { type: Date },
  periodEnd: { type: Date },
  
  grossReferredAmount: { type: Number, default: 0 },
  commissionRate: { type: Number, default: 15 },
  commissionAmount: { type: Number, required: true },
  taxDeduction: { type: Number, default: 0 }, // TDS (if applicable)
  netPaidAmount: { type: Number, required: true },
  
  paymentMethod: { 
    type: String, 
    enum: ['UPI', 'Bank Transfer', 'NEFT', 'Cash', 'Cheque'], 
    default: 'UPI' 
  },
  transactionReference: { type: String }, // UTR, Transaction ID, or Cheque number
  paidAt: { type: Date, default: Date.now },
  notes: { type: String },
  
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

doctorPayoutSchema.index({ organizationId: 1, voucherNumber: 1 }, { unique: true });

// Auto-generate voucher number VOC-YYYY-XXXXX
doctorPayoutSchema.pre('validate', async function () {
  if (!this.voucherNumber) {
    const lastDoc = await mongoose.model('DoctorPayout').findOne({ organizationId: this.organizationId }).sort({ createdAt: -1 });
    const year = new Date().getFullYear();
    let nextNum = 1;
    if (lastDoc && lastDoc.voucherNumber) {
      const match = lastDoc.voucherNumber.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.voucherNumber = `VOC-${year}-${String(nextNum).padStart(4, '0')}`;
  }
});

export default mongoose.model('DoctorPayout', doctorPayoutSchema);
