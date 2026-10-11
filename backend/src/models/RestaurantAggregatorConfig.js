import mongoose from 'mongoose';

const restaurantAggregatorConfigSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    unique: true,
    index: true 
  },
  zomato: {
    status: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
    storeId: { type: String, default: 'ZOM-BLR-8921' },
    commissionRate: { type: Number, default: 20 }, // 20%
    autoAccept: { type: Boolean, default: true },
    outletRating: { type: Number, default: 4.4 }
  },
  swiggy: {
    status: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
    storeId: { type: String, default: 'SWIG-BLR-4309' },
    commissionRate: { type: Number, default: 22 }, // 22%
    autoAccept: { type: Boolean, default: true },
    outletRating: { type: Number, default: 4.5 }
  },
  directWeb: {
    status: { type: String, enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
    storeId: { type: String, default: 'APEX-DIRECT-01' },
    commissionRate: { type: Number, default: 0 }, // 0% direct
    autoAccept: { type: Boolean, default: true },
    outletRating: { type: Number, default: 4.8 }
  },
  defaultPrepTimeMinutes: { 
    type: Number, 
    default: 20 
  },
  surgeRainMode: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

const RestaurantAggregatorConfig = mongoose.model('RestaurantAggregatorConfig', restaurantAggregatorConfigSchema);
export default RestaurantAggregatorConfig;
