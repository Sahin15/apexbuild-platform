import mongoose from 'mongoose';

const grnItemSchema = new mongoose.Schema({
  medicineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyMedicine', 
    required: true 
  },
  batchNumber: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true 
  },
  mfgDate: { type: String, default: '' },
  expiryDate: { type: String, required: true },
  expiryDateObj: { type: Date, required: true },
  quantityReceived: { type: Number, required: true, min: 1 },
  freeQuantity: { type: Number, default: 0, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 },
  tradeDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
  gstRate: { type: Number, default: 12 },
  mrp: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  rackLocation: { type: String, default: 'Rack A-01' },
  totalCost: { type: Number, required: true },
  gstAmount: { type: Number, required: true },
  netAmount: { type: Number, required: true },
  createdBatchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyBatch' 
  }
}, { _id: true });

const pharmacyGRNSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  grnNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  poId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyPurchaseOrder' 
  },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacySupplier', 
    required: true 
  },
  supplierInvoiceNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  supplierInvoiceDate: { 
    type: Date, 
    required: true 
  },
  receivedDate: { 
    type: Date, 
    default: Date.now 
  },
  paymentTerms: { 
    type: String, 
    enum: ['IMMEDIATE_CASH', 'NET_15', 'NET_21', 'NET_30', 'NET_45', 'NET_60'], 
    default: 'NET_21' 
  },
  dueDate: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'VERIFIED_AND_INWARDED', 'CANCELLED'], 
    default: 'VERIFIED_AND_INWARDED' 
  },
  items: [grnItemSchema],
  subtotal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  discountTotal: { 
    type: Number, 
    default: 0 
  },
  taxTotal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  grandTotal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  paymentStatus: { 
    type: String, 
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], 
    default: 'UNPAID' 
  },
  paidAmount: { 
    type: Number, 
    default: 0 
  },
  verifiedByPharmacistId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  pharmacistNotes: { 
    type: String, 
    trim: true, 
    default: '' 
  }
}, { timestamps: true });

// Compound unique indexes per organization
pharmacyGRNSchema.index({ organizationId: 1, grnNumber: 1 }, { unique: true });
pharmacyGRNSchema.index({ organizationId: 1, supplierId: 1, supplierInvoiceNumber: 1 });
pharmacyGRNSchema.index({ organizationId: 1, receivedDate: -1 });

export default mongoose.model('PharmacyGRN', pharmacyGRNSchema);
