import mongoose from 'mongoose';

const chronicMedicationSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyMedicine'
  },
  brandName: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    trim: true,
    default: '1 Tablet Daily'
  },
  dailyFrequency: {
    type: String,
    trim: true,
    default: '1-0-0'
  },
  daysSupply: {
    type: Number,
    default: 30
  },
  lastRefillDate: {
    type: Date,
    default: Date.now
  },
  nextRefillDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, { _id: true });

const khataLedgerEntrySchema = new mongoose.Schema({
  transactionDate: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['DEBIT_SALE', 'CREDIT_PAYMENT', 'ADJUSTMENT_CREDIT', 'ADJUSTMENT_DEBIT'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  billNumber: {
    type: String,
    trim: true
  },
  saleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacySale'
  },
  paymentMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'KHATA', 'STORE_CREDIT', 'NONE'],
    default: 'CASH'
  },
  referenceNumber: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  recordedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: true });

const pharmacyCustomerSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, 'Organization ID is mandatory for multi-tenant isolation'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Patient / Customer name is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  age: {
    type: Number,
    min: 0,
    max: 130
  },
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'],
    default: 'UNKNOWN'
  },
  address: {
    type: String,
    trim: true
  },
  bloodGroup: {
    type: String,
    trim: true
  },
  allergies: [{
    type: String,
    trim: true
  }],
  chronicConditions: [{
    type: String,
    enum: ['DIABETES', 'HYPERTENSION', 'CARDIAC', 'ASTHMA_COPD', 'THYROID', 'KIDNEY', 'ARTHRITIS', 'OTHER']
  }],
  preferredDoctor: {
    name: { type: String, trim: true },
    registrationNumber: { type: String, trim: true },
    hospitalClinic: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  chronicMedications: [chronicMedicationSchema],
  khata: {
    isEnabled: {
      type: Boolean,
      default: false
    },
    creditLimit: {
      type: Number,
      default: 5000,
      min: 0
    },
    currentBalance: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED', 'RESTRICTED'],
      default: 'ACTIVE'
    }
  },
  ledger: [khataLedgerEntrySchema],
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure phone is unique per organization
pharmacyCustomerSchema.index({ organizationId: 1, phone: 1 }, { unique: true });

// Virtual to check if customer has upcoming or overdue refills
pharmacyCustomerSchema.virtual('refillStatus').get(function() {
  if (!this.chronicMedications || this.chronicMedications.length === 0) return 'NONE';
  const now = new Date();
  const nextDates = this.chronicMedications
    .map(m => m.nextRefillDate)
    .filter(Boolean)
    .map(d => new Date(d).getTime());
  
  if (nextDates.length === 0) return 'NONE';
  const earliestRefill = Math.min(...nextDates);
  const diffDays = Math.ceil((earliestRefill - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 7) return 'DUE_SOON';
  return 'SCHEDULED';
});

pharmacyCustomerSchema.set('toJSON', { virtuals: true });
pharmacyCustomerSchema.set('toObject', { virtuals: true });

const PharmacyCustomer = mongoose.models.PharmacyCustomer || mongoose.model('PharmacyCustomer', pharmacyCustomerSchema);

export default PharmacyCustomer;
