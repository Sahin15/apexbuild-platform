import mongoose from 'mongoose';

const labPaymentReceiptSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  receiptNumber: { type: String, required: true }, // E.g. REC-2026-00001
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  amount: { type: Number, required: true, min: [0.01, 'Payment amount must be greater than zero'] },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'], 
    default: 'Cash',
    required: true
  },
  transactionReference: { type: String, default: '' }, // UPI UTR / Card Auth Code / Cheque #
  cardLast4: { type: String, default: '' },
  upiVpa: { type: String, default: '' },
  
  // Financial Snapshot at Time of Payment
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  orderTotal: { type: Number, default: 0 },
  paidBeforeThis: { type: Number, default: 0 },
  balanceAfterThis: { type: Number, default: 0 },
  
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cashierName: { type: String, default: 'Cashier' },
  notes: { type: String, default: '' },
  paymentDate: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

labPaymentReceiptSchema.index({ organizationId: 1, receiptNumber: 1 }, { unique: true });

// Auto-generate serial receiptNumber REC-YYYY-XXXXX
labPaymentReceiptSchema.pre('validate', async function () {
  if (!this.receiptNumber) {
    const year = new Date().getFullYear();
    const lastDoc = await mongoose.model('LabPaymentReceipt')
      .findOne({ organizationId: this.organizationId })
      .sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastDoc && lastDoc.receiptNumber) {
      const match = lastDoc.receiptNumber.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.receiptNumber = `REC-${year}-${String(nextNum).padStart(5, '0')}`;
  }
});

export default mongoose.model('LabPaymentReceipt', labPaymentReceiptSchema);
