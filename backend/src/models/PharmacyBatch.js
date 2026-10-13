import mongoose from 'mongoose';

const pharmacyBatchSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  medicineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyMedicine', 
    required: true, 
    index: true 
  },
  batchNumber: { 
    type: String, 
    required: [true, 'Batch number is required'], 
    uppercase: true, 
    trim: true, 
    index: true 
  },
  manufacturer: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  mfgDate: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  expiryDate: { 
    type: String, 
    required: [true, 'Expiry date string (MM/YYYY) is required'], 
    trim: true 
  },
  expiryDateObj: { 
    type: Date, 
    required: true, 
    index: true 
  },
  purchasePrice: { 
    type: Number, 
    required: [true, 'Purchase cost price is required'], 
    min: [0, 'Purchase price cannot be negative'] 
  },
  mrp: { 
    type: Number, 
    required: [true, 'Maximum Retail Price (MRP) is required'], 
    min: [0, 'MRP cannot be negative'] 
  },
  sellingPrice: { 
    type: Number, 
    required: [true, 'Selling price is required'], 
    min: [0, 'Selling price cannot be negative'] 
  },
  quantityOnHand: { 
    type: Number, 
    required: true, 
    default: 0, 
    min: [0, 'Quantity on hand cannot be negative'] 
  },
  quarantineQuantity: { 
    type: Number, 
    default: 0, 
    min: [0, 'Quarantine quantity cannot be negative'] 
  },
  rackLocation: { 
    type: String, 
    default: 'General Shelf', 
    trim: true 
  },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacySupplier' 
  },
  grnId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyGRN' 
  },
  status: { 
    type: String, 
    enum: ['SALEABLE', 'NEAR_EXPIRY', 'EXPIRED', 'QUARANTINED', 'RETURNED_TO_SUPPLIER', 'DEPLETED'], 
    default: 'SALEABLE', 
    index: true 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

// Compound indexes for fast FEFO selection and batch lookups per organization
pharmacyBatchSchema.index({ organizationId: 1, medicineId: 1, expiryDateObj: 1 });
pharmacyBatchSchema.index({ organizationId: 1, medicineId: 1, batchNumber: 1 }, { unique: true });
pharmacyBatchSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('PharmacyBatch', pharmacyBatchSchema);
