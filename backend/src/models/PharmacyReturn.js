import mongoose from 'mongoose';

const returnItemSchema = new mongoose.Schema({
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
  batchNumber: { type: String, required: true, uppercase: true },
  quantityReturned: { type: Number, required: true, min: 1 },
  unitRefundPrice: { type: Number, required: true, min: 0 },
  refundAmount: { type: Number, required: true },
  action: { 
    type: String, 
    enum: ['RETURN_TO_SHELF', 'QUARANTINE_DAMAGED'], 
    default: 'RETURN_TO_SHELF' 
  },
  reason: { 
    type: String, 
    enum: [
      'PATIENT_RECOVERY_EXCESS', 
      'DOCTOR_CHANGED_MEDICATION', 
      'ADVERSE_REACTION', 
      'DAMAGED_FOIL', 
      'WRONG_MEDICINE_DISPENSED', 
      'CUSTOMER_DISSATISFACTION'
    ],
    default: 'PATIENT_RECOVERY_EXCESS'
  }
}, { _id: true });

const pharmacyReturnSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  returnNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  originalSaleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacySale', 
    required: true 
  },
  originalBillNumber: { 
    type: String, 
    required: true 
  },
  returnDate: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  customer: {
    name: { type: String, required: true },
    phone: { type: String }
  },
  items: [returnItemSchema],
  totalRefundAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  refundMode: { 
    type: String, 
    enum: ['CASH', 'UPI', 'CREDIT_NOTE', 'KHATA_ADJUST'], 
    default: 'CASH' 
  },
  pharmacistId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  pharmacistNotes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

// Compound unique index per organization
pharmacyReturnSchema.index({ organizationId: 1, returnNumber: 1 }, { unique: true });
pharmacyReturnSchema.index({ organizationId: 1, returnDate: -1 });

export default mongoose.model('PharmacyReturn', pharmacyReturnSchema);
