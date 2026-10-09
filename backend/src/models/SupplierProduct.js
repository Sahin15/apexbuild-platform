import mongoose from 'mongoose';

const supplierProductSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  category: { type: String },
  brand: { type: String },
  unit: { 
    type: String, 
    required: true,
    enum: ['Piece', 'Bag', 'Kg', 'Ton', 'Meter', 'Feet', 'Box', 'Bundle', 'Litre', 'Set', 'Other'] 
  },
  purchasePrice: { type: Number, required: true, default: 0 },
  sellingPrice: { type: Number, required: true, default: 0 },
  minSellingPrice: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 }, // Denormalized for quick access, maintained by InventoryLedger
  minStockLevel: { type: Number, default: 0 },
  gstRate: { type: Number, default: 0 },
  hsnSac: { type: String },
  preferredVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupplierVendor' },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  description: { type: String }
}, { timestamps: true });

supplierProductSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
supplierProductSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model('SupplierProduct', supplierProductSchema);
