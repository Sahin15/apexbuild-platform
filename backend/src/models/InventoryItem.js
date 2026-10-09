import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Reagent', 'Consumable', 'Equipment', 'Other'], default: 'Reagent' },
  unit: { type: String, required: true }, // e.g., ml, kit, box, pcs
  currentStock: { type: Number, required: true, default: 0 },
  minimumStock: { type: Number, required: true, default: 10 },
  batchNumber: { type: String },
  expiryDate: { type: Date },
  supplier: { type: String },
  pricePerUnit: { type: Number },
  status: { type: String, enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired'], default: 'In Stock' }
}, { timestamps: true });

inventoryItemSchema.pre('save', async function (next) {
  if (!this.itemId) {
    const count = await mongoose.model('InventoryItem').countDocuments({ organizationId: this.organizationId });
    this.itemId = `INV-${String(count + 1).padStart(4, '0')}`;
  }
  
  if (this.currentStock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minimumStock) {
    this.status = 'Low Stock';
  } else if (this.expiryDate && this.expiryDate < new Date()) {
    this.status = 'Expired';
  } else {
    this.status = 'In Stock';
  }
  
  next();
});

export default mongoose.model('InventoryItem', inventoryItemSchema);
