import mongoose from 'mongoose';

const testItemSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true }
});

const orderSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  orderId: { type: String, required: true }, // E.g., ORD-2023-0001
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  referringDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  
  tests: [testItemSchema],
  
  subtotal: { type: Number, required: true, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, required: true, default: 0 },
  
  paymentStatus: { 
    type: String, 
    enum: ['Paid', 'Partial', 'Due'], 
    default: 'Due' 
  },
  
  orderStatus: { 
    type: String, 
    enum: [
      'Draft',
      'Registered', 
      'Sample Pending', 
      'Partially Collected', 
      'Collected', 
      'Processing', 
      'Partial Results',
      'Completed', 
      'Cancelled'
    ], 
    default: 'Registered' 
  },
  
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT'],
    default: 'Routine',
    index: true
  },
  expectedDeliveryDate: { type: Date },
  tatStatus: {
    type: String,
    enum: ['ON_TRACK', 'NEAR_BREACH', 'BREACHED', 'COMPLETED'],
    default: 'ON_TRACK',
    index: true
  },
  
  isHomeCollection: { type: Boolean, default: false },
  homeCollectionDetails: {
    address: { type: String },
    scheduledDate: { type: Date },
    phlebotomist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['Scheduled', 'En Route', 'Reached', 'Collected', 'Cancelled'], default: 'Scheduled' },
    pickupGps: {
      latitude: { type: Number },
      longitude: { type: Number },
      accuracy: { type: Number }
    }
  },
  patientSignature: { type: String },
  signedBy: { type: String },
  prescriptionPhoto: { type: String },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'], default: 'Cash' },
  
  payments: [{
    receiptNumber: { type: String },
    receiptId: { type: mongoose.Schema.Types.ObjectId, ref: 'LabPaymentReceipt' },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Cheque', 'Other'], default: 'Cash' },
    transactionReference: { type: String, default: '' },
    cashierName: { type: String, default: 'Cashier' },
    paidAt: { type: Date, default: Date.now }
  }],
  
  notes: { type: String },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

orderSchema.index({ organizationId: 1, orderId: 1 }, { unique: true });

// Auto-generate orderId before saving if not present
orderSchema.pre('validate', async function () {
  if (!this.orderId) {
    const lastDoc = await mongoose.model('Order').findOne({ organizationId: this.organizationId }).sort({ createdAt: -1 });
    const year = new Date().getFullYear();
    let nextNum = 1;
    if (lastDoc && lastDoc.orderId) {
      const match = lastDoc.orderId.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.orderId = `ORD-${year}-${String(nextNum).padStart(5, '0')}`;
  }
  
  // Calculate due amount
  this.dueAmount = this.totalAmount - this.paidAmount;
  
  if (this.dueAmount <= 0) {
    this.paymentStatus = 'Paid';
  } else if (this.paidAmount > 0) {
    this.paymentStatus = 'Partial';
  } else {
    this.paymentStatus = 'Due';
  }

});

export default mongoose.model('Order', orderSchema);
