import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  businessPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessPartner' },
  osProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'OSProduct' },
  subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], required: true },
  transactionReference: { type: String },
  paymentDate: { type: Date, default: Date.now },
  proofDocument: { type: String }, // URL or path to uploaded proof
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verificationDate: { type: Date },
  status: { type: String, enum: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REFUNDED', 'PARTIALLY_REFUNDED'], default: 'SUBMITTED' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
