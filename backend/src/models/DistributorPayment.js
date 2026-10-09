import mongoose from 'mongoose';

const distributorPaymentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, enum: ['CUSTOMER_COLLECTION', 'SUPPLIER_PAYMENT'], required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorCustomer' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorSupplier' },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'], required: true },
  reference: { type: String },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('DistributorPayment', distributorPaymentSchema);
