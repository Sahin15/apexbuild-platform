import mongoose from 'mongoose';

const restaurantExpenseSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  expenseNumber: { 
    type: String, 
    required: true, 
    trim: true,
    index: true
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'LPG_GAS',
      'UTILITIES',
      'PACKAGING_DISPOSABLES',
      'CLEANING_HYGIENE',
      'MAINTENANCE_REPAIRS',
      'STAFF_WELFARE_MEALS',
      'MARKETING_PROMOTIONS',
      'LICENSES_PERMITS',
      'PETTY_CASH',
      'OTHER'
    ],
    default: 'OTHER'
  },
  title: { 
    type: String, 
    required: true, 
    trim: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  taxAmount: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  totalAmount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  paymentMethod: { 
    type: String, 
    enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'PETTY_CASH', 'VENDOR_CREDIT'], 
    default: 'CASH' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['PAID', 'PENDING'], 
    default: 'PAID' 
  },
  expenseDate: { 
    type: Date, 
    default: Date.now,
    index: true
  },
  vendorOrPayee: { 
    type: String, 
    trim: true,
    default: ''
  },
  invoiceNumber: { 
    type: String, 
    trim: true,
    default: ''
  },
  receiptAttachmentUrl: { 
    type: String, 
    trim: true,
    default: ''
  },
  recordedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  paidBy: { 
    type: String, 
    trim: true,
    default: 'Manager'
  },
  notes: { 
    type: String, 
    trim: true,
    default: ''
  },
  isRecurring: { 
    type: Boolean, 
    default: false 
  },
  recurringFrequency: { 
    type: String, 
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'NONE'], 
    default: 'NONE' 
  },
  status: { 
    type: String, 
    enum: ['APPROVED', 'PENDING_APPROVAL', 'REJECTED'], 
    default: 'APPROVED' 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Composite index for fast organization and date lookups
restaurantExpenseSchema.index({ organizationId: 1, expenseDate: -1 });
restaurantExpenseSchema.index({ organizationId: 1, category: 1 });

const RestaurantExpense = mongoose.model('RestaurantExpense', restaurantExpenseSchema);
export default RestaurantExpense;
