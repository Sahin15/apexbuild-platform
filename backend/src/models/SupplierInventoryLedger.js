import mongoose from 'mongoose';

const supplierInventoryLedgerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierProduct', required: true },
  transactionType: { 
    type: String, 
    enum: ['PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'DAMAGE'], 
    required: true 
  },
  quantityChange: { type: Number, required: true }, // Positive for incoming, negative for outgoing
  balanceQuantity: { type: Number, required: true }, // Snapshot of stock after this transaction
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // ID of Purchase, Order, etc.
  referenceModel: { type: String }, // e.g., 'SupplierPurchase'
  rate: { type: Number }, // Cost or selling rate at time of transaction
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

supplierInventoryLedgerSchema.index({ organizationId: 1, product: 1, createdAt: -1 });

export default mongoose.model('SupplierInventoryLedger', supplierInventoryLedgerSchema);
