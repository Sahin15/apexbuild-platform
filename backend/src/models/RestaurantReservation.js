import mongoose from 'mongoose';

const restaurantReservationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  reservationCode: {
    type: String,
    required: true,
    trim: true
  },
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantCustomer'
  },
  partySize: {
    type: Number,
    required: true,
    min: 1
  },
  reservationDate: {
    type: Date,
    required: true,
    index: true
  },
  timeSlot: {
    type: String, // e.g. "19:30"
    required: true
  },
  durationMinutes: {
    type: Number,
    default: 90
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantTable'
  },
  status: {
    type: String,
    enum: ['CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
    default: 'CONFIRMED',
    index: true
  },
  specialOccasion: {
    type: String,
    enum: ['NONE', 'BIRTHDAY', 'ANNIVERSARY', 'BUSINESS_DINNER', 'DATE_NIGHT', 'FAMILY_GATHERING', 'OTHER'],
    default: 'NONE'
  },
  dietaryPreferences: [{
    type: String,
    enum: ['VEG', 'NON_VEG', 'JAIN', 'VEGAN', 'GLUTEN_FREE', 'NUT_ALLERGY', 'SPICY_LOVER', 'LESS_OIL']
  }],
  depositAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  depositStatus: {
    type: String,
    enum: ['NOT_REQUIRED', 'PENDING', 'PAID', 'REFUNDED'],
    default: 'NOT_REQUIRED'
  },
  depositPaymentMethod: {
    type: String,
    enum: ['NONE', 'CASH', 'UPI', 'CARD', 'ONLINE_GATEWAY'],
    default: 'NONE'
  },
  guestNotes: {
    type: String,
    trim: true
  },
  internalNotes: {
    type: String,
    trim: true
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  confirmationMethod: {
    type: String,
    enum: ['NONE', 'SMS', 'WHATSAPP', 'EMAIL'],
    default: 'WHATSAPP'
  },
  confirmationSentAt: {
    type: Date
  },
  seatedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  createdOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RestaurantOrder'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

restaurantReservationSchema.index({ organizationId: 1, reservationCode: 1 }, { unique: true });
restaurantReservationSchema.index({ organizationId: 1, reservationDate: 1, timeSlot: 1 });
restaurantReservationSchema.index({ organizationId: 1, status: 1 });
restaurantReservationSchema.index({ organizationId: 1, tableId: 1 });

export default mongoose.model('RestaurantReservation', restaurantReservationSchema);
