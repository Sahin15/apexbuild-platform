import mongoose from 'mongoose';

const tipPayoutSchema = new mongoose.Schema({
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantStaff',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  department: {
    type: String
  },
  hoursWorked: {
    type: Number,
    default: 0
  },
  weight: {
    type: Number,
    default: 1.0
  },
  points: {
    type: Number,
    default: 1.0
  },
  calculatedTipAmount: {
    type: Number,
    required: true,
    default: 0
  },
  payoutStatus: {
    type: String,
    enum: ['PENDING', 'PAID'],
    default: 'PENDING'
  },
  payoutMethod: {
    type: String,
    enum: ['CASH', 'UPI', 'SALARY_ADDON'],
    default: 'CASH'
  },
  paidAt: {
    type: Date
  },
  upiId: {
    type: String
  },
  notes: {
    type: String
  }
});

const restaurantTipPoolSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  poolDate: {
    type: Date,
    required: true,
    index: true
  },
  shiftPeriod: {
    type: String,
    enum: ['LUNCH', 'DINNER', 'FULL_DAY'],
    default: 'FULL_DAY',
    required: true
  },
  totalTipsCollected: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  cashTips: {
    type: Number,
    default: 0,
    min: 0
  },
  digitalTips: {
    type: Number,
    default: 0,
    min: 0
  },
  serviceChargeCollected: {
    type: Number,
    default: 0,
    min: 0
  },
  distributionFormula: {
    type: String,
    enum: ['EQUAL_SPLIT', 'ROLE_WEIGHTED', 'HOURS_WORKED_WEIGHTED'],
    default: 'ROLE_WEIGHTED'
  },
  totalShares: {
    type: Number,
    default: 0
  },
  tipPerShare: {
    type: Number,
    default: 0
  },
  eligibleStaffCount: {
    type: Number,
    default: 0
  },
  payouts: [tipPayoutSchema],
  status: {
    type: String,
    enum: ['DRAFT', 'CALCULATED', 'DISBURSED'],
    default: 'DRAFT',
    index: true
  },
  disbursedAt: {
    type: Date
  },
  disbursedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: {
    type: String,
    trim: true
  }
}, { timestamps: true });

restaurantTipPoolSchema.index({ organizationId: 1, poolDate: -1 });
restaurantTipPoolSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('RestaurantTipPool', restaurantTipPoolSchema);
