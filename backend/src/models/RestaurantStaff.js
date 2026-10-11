import mongoose from 'mongoose';

const restaurantStaffSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  employeeCode: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: [
      'HEAD_CHEF', 
      'SOUS_CHEF',
      'LINE_COOK', 
      'COMMIS_CHEF', 
      'BARISTA', 
      'HEAD_STEWARD', 
      'STEWARD', 
      'BUSSER', 
      'CASHIER', 
      'RESTAURANT_MANAGER', 
      'CLEANER'
    ],
    required: true,
    default: 'STEWARD'
  },
  department: {
    type: String,
    enum: ['KITCHEN_BOH', 'SERVICE_FOH', 'BAR_BEVERAGE', 'MANAGEMENT', 'HOUSEKEEPING'],
    default: 'SERVICE_FOH'
  },
  hourlyWage: {
    type: Number,
    default: 0,
    min: 0
  },
  monthlySalary: {
    type: Number,
    default: 0,
    min: 0
  },
  tipShareWeight: {
    type: Number,
    default: 1.0,
    min: 0
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ON_LEAVE', 'INACTIVE'],
    default: 'ACTIVE',
    index: true
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifscCode: String,
    upiId: String
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

restaurantStaffSchema.index({ organizationId: 1, employeeCode: 1 }, { unique: true });
restaurantStaffSchema.index({ organizationId: 1, role: 1 });
restaurantStaffSchema.index({ organizationId: 1, department: 1 });
restaurantStaffSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('RestaurantStaff', restaurantStaffSchema);
