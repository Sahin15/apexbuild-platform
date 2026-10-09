import mongoose from 'mongoose';

const distributorStockMovementSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  type: { 
    type: String, 
    enum: ['OPENING', 'PURCHASE', 'DELIVERY', 'ADJUSTMENT', 'RETURN', 'LOSS'], 
    required: true 
  },
  referenceId: { type: mongoose.Schema.Types.ObjectId }, // Can be Purchase ID, Sale ID, etc.
  referenceModel: { type: String }, // 'DistributorPurchase', 'DistributorSale'
  quantity: { type: Number, required: true }, // The amount changed (can be negative)
  unit: { type: String, default: 'KG' },
  rate: { type: Number, default: 0 }, // Value at the time of movement
  balance: { type: Number, required: true }, // The stock balance after this movement
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('DistributorStockMovement', distributorStockMovementSchema);
