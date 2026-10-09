import mongoose from 'mongoose';

const distributorStockSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  currentStock: { type: Number, default: 0 }, // Represents total KG available
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('DistributorStock', distributorStockSchema);
