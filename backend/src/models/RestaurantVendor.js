import mongoose from 'mongoose';

const restaurantVendorSchema = new mongoose.Schema({
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
  code: { 
    type: String, 
    trim: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: [
      'Dairy & Cheese', 
      'Poultry & Meat', 
      'Seafood', 
      'Produce & Vegetables', 
      'Dry Goods & Grains', 
      'Oils & Ghee', 
      'Spices & Seasoning', 
      'Beverages & Syrups', 
      'Packaging & Disposables',
      'General Supplies'
    ],
    default: 'General Supplies'
  },
  contactPerson: { 
    type: String, 
    trim: true 
  },
  phone: { 
    type: String, 
    trim: true 
  },
  email: { 
    type: String, 
    trim: true 
  },
  address: { 
    type: String, 
    trim: true 
  },
  gstin: { 
    type: String, 
    trim: true 
  },
  paymentTerms: { 
    type: String, 
    enum: ['COD', 'NET_7', 'NET_15', 'NET_30', 'ADVANCE'], 
    default: 'NET_7' 
  },
  outstandingBalance: { 
    type: Number, 
    default: 0 
  },
  totalPurchasedAmount: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

restaurantVendorSchema.index({ organizationId: 1, name: 1 });
restaurantVendorSchema.index({ organizationId: 1, code: 1 });

export default mongoose.model('RestaurantVendor', restaurantVendorSchema);
