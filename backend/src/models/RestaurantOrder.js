import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  menuItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantMenuItem' 
  },
  name: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1, 
    default: 1 
  },
  station: { 
    type: String, 
    default: 'General' 
  },
  notes: { 
    type: String, 
    default: '' 
  },
  veg: { 
    type: Boolean, 
    default: true 
  },
  status: { 
    type: String, 
    enum: ['QUEUED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'], 
    default: 'QUEUED' 
  },
  ready: { 
    type: Boolean, 
    default: false 
  },
  readyAt: { 
    type: Date 
  }
});

const restaurantOrderSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  orderNumber: { 
    type: String, 
    required: true, 
    index: true 
  },
  orderType: { 
    type: String, 
    enum: ['DINE_IN', 'TAKEAWAY', 'DELIVERY'], 
    default: 'DINE_IN',
    index: true 
  },
  tableId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantTable' 
  },
  tableName: { 
    type: String 
  },
  tokenNumber: { 
    type: String 
  },
  guestCount: { 
    type: Number, 
    default: 1 
  },
  customerName: { 
    type: String 
  },
  customerPhone: { 
    type: String 
  },
  deliveryAddress: { 
    type: String 
  },
  stewardId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  stewardName: { 
    type: String, 
    default: 'Steward' 
  },
  items: [orderItemSchema],
  subTotal: { 
    type: Number, 
    default: 0 
  },
  discount: { 
    type: Number, 
    default: 0 
  },
  serviceCharge: { 
    type: Number, 
    default: 0 
  },
  taxTotal: { 
    type: Number, 
    default: 0 
  },
  grandTotal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['DRAFT', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'], 
    default: 'CONFIRMED',
    index: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'PARTIAL', 'PAID'], 
    default: 'PENDING',
    index: true 
  },
  cancellationReason: { 
    type: String 
  },
  aggregator: {
    type: String,
    enum: ['NONE', 'ZOMATO', 'SWIGGY', 'DIRECT_WEB', 'MAGICPIN'],
    default: 'NONE',
    index: true
  },
  aggregatorOrderId: {
    type: String,
    trim: true,
    default: ''
  },
  cookingInstructions: {
    type: String,
    default: ''
  },
  riderDetails: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    status: { 
      type: String, 
      enum: ['UNASSIGNED', 'ASSIGNED', 'ARRIVED_AT_STORE', 'OUT_FOR_DELIVERY', 'DELIVERED'],
      default: 'ASSIGNED'
    },
    estimatedMinutes: { type: Number, default: 15 }
  },
  aggregatorCommission: {
    rate: { type: Number, default: 0 },
    commissionAmount: { type: Number, default: 0 },
    netPayout: { type: Number, default: 0 }
  },
  confirmedAt: { 
    type: Date, 
    default: Date.now 
  },
  completedAt: { 
    type: Date 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

restaurantOrderSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.model('RestaurantOrder', restaurantOrderSchema);
