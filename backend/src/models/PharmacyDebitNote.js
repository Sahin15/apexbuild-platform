import mongoose from 'mongoose';

const debitNoteItemSchema = new mongoose.Schema({
  medicineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyMedicine', 
    required: true 
  },
  brandName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  genericName: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyBatch', 
    required: true 
  },
  batchNumber: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true 
  },
  expiryDate: { 
    type: String, 
    required: true 
  },
  expiryDateObj: { 
    type: Date 
  },
  quantityReturned: { 
    type: Number, 
    required: true, 
    min: [1, 'Return quantity must be at least 1'] 
  },
  unitPurchasePrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  gstRate: { 
    type: Number, 
    default: 12 
  },
  taxableAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  gstAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  totalClaimAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  reason: { 
    type: String, 
    enum: [
      'EXPIRED_STOCK', 
      'NEAR_EXPIRY_THRESHOLD', 
      'DAMAGED_FOIL_PACK', 
      'BROKEN_VIAL_OR_LEAKAGE', 
      'MANUFACTURER_RECALL', 
      'WRONG_SUPPLY_BATCH', 
      'SLOW_MOVING_EXCESS'
    ], 
    default: 'EXPIRED_STOCK' 
  }
}, { _id: true });

const pharmacyDebitNoteSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  debitNoteNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacySupplier', 
    required: true, 
    index: true 
  },
  supplierName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  supplierGstin: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  supplierDlNumber: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  debitNoteDate: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  returnType: { 
    type: String, 
    enum: ['EXPIRY_RETURN', 'NEAR_EXPIRY_RETURN', 'DAMAGED_BREAKAGE', 'BATCH_RECALL', 'WRONG_ITEM_SUPPLIED'], 
    default: 'EXPIRY_RETURN' 
  },
  status: { 
    type: String, 
    enum: ['ISSUED', 'SENT_TO_SUPPLIER', 'ACKNOWLEDGED', 'SETTLED', 'REJECTED', 'CANCELLED'], 
    default: 'ISSUED', 
    index: true 
  },
  items: [debitNoteItemSchema],
  totalQuantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  subtotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  taxTotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  grandTotal: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  settlement: {
    settlementType: { 
      type: String, 
      enum: ['PENDING', 'ADJUSTED_AGAINST_GRN', 'REFUND_RECEIVED', 'REPLACED_WITH_FRESH_STOCK', 'WRITTEN_OFF'], 
      default: 'PENDING' 
    },
    settledAmount: { 
      type: Number, 
      default: 0 
    },
    creditNoteNumber: { 
      type: String, 
      trim: true, 
      default: '' 
    },
    creditNoteDate: { 
      type: Date 
    },
    adjustedGrnId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PharmacyGRN' 
    },
    settlementDate: { 
      type: Date 
    },
    settlementNotes: { 
      type: String, 
      default: '' 
    }
  },
  pharmacistNotes: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  issuedById: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

// Compound indexes for strict tenant isolation & fast lookups
pharmacyDebitNoteSchema.index({ organizationId: 1, debitNoteNumber: 1 }, { unique: true });
pharmacyDebitNoteSchema.index({ organizationId: 1, supplierId: 1, status: 1 });
pharmacyDebitNoteSchema.index({ organizationId: 1, debitNoteDate: -1 });

export default mongoose.model('PharmacyDebitNote', pharmacyDebitNoteSchema);
