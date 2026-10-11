import mongoose from 'mongoose';

const poItemSchema = new mongoose.Schema({
  inventoryItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantInventoryItem' 
  },
  itemName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  receivedQuantity: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  uom: { 
    type: String, 
    required: true, 
    default: 'kg' 
  },
  unitPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  taxPercent: { 
    type: Number, 
    default: 0 
  },
  lineTotal: { 
    type: Number, 
    required: true, 
    default: 0 
  }
});

const grnReceiptSchema = new mongoose.Schema({
  grnNumber: { 
    type: String, 
    required: true 
  },
  receivedAt: { 
    type: Date, 
    default: Date.now 
  },
  receivedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  invoiceNo: { 
    type: String, 
    trim: true 
  },
  invoiceAmount: { 
    type: Number, 
    default: 0 
  },
  notes: { 
    type: String 
  },
  itemsReceived: [{
    itemName: String,
    inventoryItemId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'RestaurantInventoryItem' 
    },
    receivedQuantity: Number,
    uom: String,
    unitPrice: Number
  }]
});

const restaurantPurchaseOrderSchema = new mongoose.Schema({
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
  vendorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantVendor', 
    required: true, 
    index: true 
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
    default: 'DRAFT' 
  },
  items: [poItemSchema],
  subTotal: { 
    type: Number, 
    default: 0 
  },
  taxTotal: { 
    type: Number, 
    default: 0 
  },
  grandTotal: { 
    type: Number, 
    default: 0 
  },
  grnReceipts: [grnReceiptSchema],
  paymentStatus: { 
    type: String, 
    enum: ['UNPAID', 'PARTIALLY_PAID', 'PAID'], 
    default: 'UNPAID' 
  },
  paidAmount: { 
    type: Number, 
    default: 0 
  },
  paymentMethod: { 
    type: String, 
    enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT'], 
    default: 'CREDIT' 
  },
  notes: { 
    type: String 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

restaurantPurchaseOrderSchema.index({ organizationId: 1, poNumber: 1 }, { unique: true });
restaurantPurchaseOrderSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('RestaurantPurchaseOrder', restaurantPurchaseOrderSchema);
