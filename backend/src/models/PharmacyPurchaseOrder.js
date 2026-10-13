import mongoose from 'mongoose';

const purchaseOrderItemSchema = new mongoose.Schema({
  medicineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyMedicine', 
    required: true 
  },
  packSize: { type: String, default: '10 Tablets / Strip' },
  orderQuantity: { type: Number, required: true, min: 1 },
  receivedQuantity: { type: Number, default: 0, min: 0 },
  estimatedPurchasePrice: { type: Number, default: 0 },
  estimatedAmount: { type: Number, default: 0 }
}, { _id: true });

const pharmacyPurchaseOrderSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  poNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacySupplier', 
    required: true 
  },
  orderDate: { 
    type: Date, 
    default: Date.now 
  },
  expectedDeliveryDate: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'], 
    default: 'ORDERED' 
  },
  items: [purchaseOrderItemSchema],
  totalEstimatedAmount: { 
    type: Number, 
    default: 0 
  },
  notes: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  createdById: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  grnIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyGRN' 
  }]
}, { timestamps: true });

// Compound unique index per organization
pharmacyPurchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });
pharmacyPurchaseOrderSchema.index({ organizationId: 1, status: 1, orderDate: -1 });

export default mongoose.model('PharmacyPurchaseOrder', pharmacyPurchaseOrderSchema);
