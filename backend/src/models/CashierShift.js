import mongoose from 'mongoose';

const cashierShiftSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  shiftNumber: { type: String, required: true }, // SFT-2026-0001
  cashier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cashierName: { type: String, default: 'Cashier' },
  shiftDate: { type: Date, default: Date.now, index: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open', index: true },
  
  openingCashFloat: { type: Number, default: 0 },
  
  // System computed amounts during shift
  systemCash: { type: Number, default: 0 },
  systemUPI: { type: Number, default: 0 },
  systemCard: { type: Number, default: 0 },
  systemBankTransfer: { type: Number, default: 0 },
  systemCheque: { type: Number, default: 0 },
  systemTotal: { type: Number, default: 0 },
  totalTransactions: { type: Number, default: 0 },

  // Cash Denominations counted at closing
  denominations: {
    note500: { type: Number, default: 0 },
    note200: { type: Number, default: 0 },
    note100: { type: Number, default: 0 },
    note50: { type: Number, default: 0 },
    note20: { type: Number, default: 0 },
    note10: { type: Number, default: 0 },
    coins: { type: Number, default: 0 }
  },
  
  physicalCashCounted: { type: Number, default: 0 },
  variance: { type: Number, default: 0 }, // physicalCashCounted - (openingCashFloat + systemCash)
  
  handoverTo: { type: String, default: '' },
  closingNotes: { type: String, default: '' },
  closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

cashierShiftSchema.index({ organizationId: 1, shiftNumber: 1 }, { unique: true });

cashierShiftSchema.pre('validate', async function () {
  if (!this.shiftNumber) {
    const year = new Date().getFullYear();
    const lastDoc = await mongoose.model('CashierShift')
      .findOne({ organizationId: this.organizationId })
      .sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastDoc && lastDoc.shiftNumber) {
      const match = lastDoc.shiftNumber.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.shiftNumber = `SFT-${year}-${String(nextNum).padStart(4, '0')}`;
  }
});

export default mongoose.model('CashierShift', cashierShiftSchema);
