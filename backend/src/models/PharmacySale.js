import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  medicineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyMedicine', 
    required: true 
  },
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyBatch', 
    required: true 
  },
  brandName: { type: String, required: true },
  genericName: { type: String, default: '' },
  batchNumber: { type: String, required: true, uppercase: true },
  expiryDate: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0 },
  taxableAmount: { type: Number, required: true },
  gstRate: { type: Number, default: 12 },
  gstAmount: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  scheduleCategory: { 
    type: String, 
    enum: ['OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'], 
    default: 'OTC' 
  },
  rackLocation: { type: String, default: '' }
}, { _id: true });

const pharmacySaleSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  billNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  saleDate: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  customer: {
    name: { type: String, required: true, default: 'Walk-in Customer' },
    phone: { type: String, default: '' },
    age: { type: Number },
    gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'], default: 'UNKNOWN' },
    address: { type: String, default: '' }
  },
  doctor: {
    name: { type: String, default: 'Walk-in / OTC' },
    registrationNumber: { type: String, default: '' },
    hospitalClinic: { type: String, default: '' },
    prescriptionDate: { type: Date }
  },
  rxVerified: { 
    type: Boolean, 
    default: true 
  },
  items: [saleItemSchema],
  pricing: {
    subtotal: { type: Number, required: true, default: 0 },
    discountTotal: { type: Number, default: 0 },
    taxTotal: { type: Number, required: true, default: 0 },
    roundOff: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 }
  },
  payment: {
    method: { 
      type: String, 
      enum: ['CASH', 'UPI', 'CARD', 'KHATA', 'SPLIT'], 
      default: 'UPI' 
    },
    status: { 
      type: String, 
      enum: ['PAID', 'PENDING', 'PARTIAL'], 
      default: 'PAID' 
    },
    amountReceived: { type: Number, default: 0 },
    changeReturned: { type: Number, default: 0 },
    referenceNumber: { type: String, default: '' }
  },
  highestSchedule: { 
    type: String, 
    enum: ['OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X'], 
    default: 'OTC', 
    index: true 
  },
  isSchedulePrescription: { 
    type: Boolean, 
    default: false, 
    index: true 
  },
  pharmacistId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  pharmacistName: { 
    type: String, 
    default: 'Rahul Roy (WB-48291)' 
  },
  status: { 
    type: String, 
    enum: ['COMPLETED', 'RETURNED', 'PARTIALLY_RETURNED', 'CANCELLED'], 
    default: 'COMPLETED' 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

// Compound indexes for statutory registers & fast billing lookups
pharmacySaleSchema.index({ organizationId: 1, billNumber: 1 }, { unique: true });
pharmacySaleSchema.index({ organizationId: 1, saleDate: -1 });
pharmacySaleSchema.index({ organizationId: 1, highestSchedule: 1, saleDate: -1 });
pharmacySaleSchema.index({ organizationId: 1, 'customer.phone': 1 });

export default mongoose.model('PharmacySale', pharmacySaleSchema);
