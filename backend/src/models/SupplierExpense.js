import mongoose from 'mongoose';

const supplierExpenseSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  category: { type: String, required: true }, // e.g., Rent, Salary, Utilities, Transport, Marketing, Misc
  amount: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true, default: Date.now },
  paymentMode: { type: String, enum: ['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'OTHER'], required: true },
  referenceNumber: { type: String },
  description: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

supplierExpenseSchema.index({ organizationId: 1, date: -1 });

export default mongoose.model('SupplierExpense', supplierExpenseSchema);
