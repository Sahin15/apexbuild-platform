import mongoose from 'mongoose';

const paymentSplitSchema = new mongoose.Schema({
  method: { 
    type: String, 
    enum: ['CASH', 'UPI', 'CARD', 'SPLIT', 'HOUSE_ACCOUNT'], 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  reference: { 
    type: String, 
    default: '' 
  }
});

const restaurantBillSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  billNumber: { 
    type: String, 
    required: true, 
    index: true 
  },
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantOrder', 
    required: true 
  },
  subTotal: { 
    type: Number, 
    required: true 
  },
  discount: { 
    type: Number, 
    default: 0 
  },
  serviceCharge: { 
    type: Number, 
    default: 0 
  },
  cgst: { 
    type: Number, 
    default: 0 
  },
  sgst: { 
    type: Number, 
    default: 0 
  },
  grandTotal: { 
    type: Number, 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'PARTIAL', 'PAID', 'VOID'], 
    default: 'PAID',
    index: true 
  },
  paymentSplits: [paymentSplitSchema],
  paidAmount: { 
    type: Number, 
    default: 0 
  },
  changeReturned: { 
    type: Number, 
    default: 0 
  },
  invoiceDate: { 
    type: Date, 
    default: Date.now 
  },
  settledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  notes: { 
    type: String 
  }
}, { timestamps: true });

restaurantBillSchema.index({ organizationId: 1, invoiceDate: -1 });

export default mongoose.model('RestaurantBill', restaurantBillSchema);
