import mongoose from 'mongoose';

const partnerLedgerSchema = new mongoose.Schema({
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessPartner', required: true },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // The referred account
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }, // The invoice that triggered this commission
  amount: { type: Number, required: true },
  type: { type: String, enum: ['COMMISSION', 'PAYOUT', 'ADJUSTMENT'], required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'CANCELLED'], default: 'PENDING' },
  description: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('PartnerLedger', partnerLedgerSchema);
