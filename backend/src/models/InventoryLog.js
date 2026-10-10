import mongoose from 'mongoose';

const inventoryLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true, index: true },
  type: { 
    type: String, 
    enum: ['STOCK_IN', 'AUTO_CONSUMED', 'MANUAL_CONSUMED', 'EXPIRED_DISCARD', 'ADJUSTMENT'], 
    required: true 
  },
  quantity: { type: Number, required: true },
  previousStock: { type: Number, required: true },
  newStock: { type: Number, required: true },
  
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  
  batchNumber: { type: String },
  notes: { type: String },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('InventoryLog', inventoryLogSchema);
