import mongoose from 'mongoose';

const inventoryItemSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  itemId: { type: String, required: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Reagent', 'Vacuum Tube', 'Consumable', 'Calibrator / Control', 'Rapid Kit', 'Equipment', 'Other'], 
    default: 'Reagent' 
  },
  unit: { type: String, required: true }, // e.g., tests, kits, tubes, vials, boxes, pcs
  currentStock: { type: Number, required: true, default: 0 },
  minimumStock: { type: Number, required: true, default: 10 },
  reorderQuantity: { type: Number, default: 50 },
  
  batchNumber: { type: String },
  expiryDate: { type: Date },
  supplier: { type: String },
  pricePerUnit: { type: Number, default: 0 },
  
  storageCondition: { 
    type: String, 
    enum: ['2°C - 8°C (Refrigerated)', '-20°C (Frozen)', '15°C - 25°C (Room Temp)', 'Dark / Light Protected'],
    default: '15°C - 25°C (Room Temp)'
  },
  location: { type: String }, // e.g., "Fridge A - Shelf 2", "Hematology Rack"
  
  // Enterprise automated consumption: linked tests that consume this reagent
  linkedTests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  
  status: { 
    type: String, 
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired', 'Quarantined'], 
    default: 'In Stock' 
  },
  notes: { type: String }
}, { timestamps: true });

inventoryItemSchema.index({ organizationId: 1, itemId: 1 }, { unique: true });

inventoryItemSchema.pre('validate', async function () {
  if (!this.itemId) {
    const lastDoc = await mongoose.model('InventoryItem').findOne({ organizationId: this.organizationId }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastDoc && lastDoc.itemId) {
      const match = lastDoc.itemId.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.itemId = `INV-${String(nextNum).padStart(4, '0')}`;
  }

  // Update status automatically
  if (this.expiryDate && new Date(this.expiryDate) < new Date()) {
    this.status = 'Expired';
  } else if (this.currentStock <= 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minimumStock) {
    this.status = 'Low Stock';
  } else {
    this.status = 'In Stock';
  }
});

export default mongoose.model('InventoryItem', inventoryItemSchema);
