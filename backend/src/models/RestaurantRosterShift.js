import mongoose from 'mongoose';

const restaurantRosterShiftSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  staffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantStaff',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  shiftType: {
    type: String,
    enum: [
      'MORNING_OPENING', 
      'LUNCH_PEAK', 
      'EVENING_DINNER', 
      'NIGHT_CLOSING', 
      'DOUBLE_SHIFT', 
      'OFF_DUTY'
    ],
    default: 'LUNCH_PEAK',
    required: true
  },
  scheduledStartTime: {
    type: String, // e.g. "11:00"
    required: true
  },
  scheduledEndTime: {
    type: String, // e.g. "17:00"
    required: true
  },
  station: {
    type: String, // e.g. "Section A Tables", "Curry & Tandoor", "Billing & Cashier"
    default: 'Floor Section'
  },
  status: {
    type: String,
    enum: ['SCHEDULED', 'CLOCKED_IN', 'CLOCKED_OUT', 'ABSENT', 'LEAVE'],
    default: 'SCHEDULED',
    index: true
  },
  clockInTime: {
    type: Date
  },
  clockOutTime: {
    type: Date
  },
  actualHoursWorked: {
    type: Number,
    default: 0,
    min: 0
  },
  overtimeMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

restaurantRosterShiftSchema.index({ organizationId: 1, date: 1, staffId: 1 });
restaurantRosterShiftSchema.index({ organizationId: 1, status: 1 });

export default mongoose.model('RestaurantRosterShift', restaurantRosterShiftSchema);
