import mongoose from 'mongoose';

const restaurantCustomerSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
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
  birthday: { 
    type: Date 
  },
  anniversary: { 
    type: Date 
  },
  vipTier: { 
    type: String, 
    enum: ['STANDARD', 'SILVER', 'GOLD', 'PLATINUM'], 
    default: 'STANDARD' 
  },
  loyaltyPoints: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  totalVisits: { 
    type: Number, 
    default: 1, 
    min: 1 
  },
  totalSpend: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  averageSpendPerVisit: { 
    type: Number, 
    default: 0 
  },
  lastVisitDate: { 
    type: Date, 
    default: Date.now 
  },
  dietaryPreferences: [{
    type: String,
    enum: ['VEG', 'NON_VEG', 'JAIN', 'VEGAN', 'GLUTEN_FREE', 'NUT_ALLERGY', 'SPICY_LOVER', 'LESS_OIL']
  }],
  favoriteItems: [{
    itemName: String,
    count: Number
  }],
  notes: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

restaurantCustomerSchema.index({ organizationId: 1, phone: 1 }, { unique: true });
restaurantCustomerSchema.index({ organizationId: 1, vipTier: 1 });
restaurantCustomerSchema.index({ organizationId: 1, totalSpend: -1 });

export default mongoose.model('RestaurantCustomer', restaurantCustomerSchema);
