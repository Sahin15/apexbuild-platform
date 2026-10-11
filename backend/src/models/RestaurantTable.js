import mongoose from 'mongoose';

const restaurantTableSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  areaId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantArea' 
  },
  tableNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  capacity: { 
    type: Number, 
    default: 4 
  },
  status: { 
    type: String, 
    enum: ['AVAILABLE', 'OCCUPIED', 'BILLED', 'CLEANING', 'RESERVED'], 
    default: 'AVAILABLE',
    index: true 
  },
  activeOrderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantOrder' 
  },
  currentGuests: { 
    type: Number, 
    default: 0 
  },
  assignedSteward: { 
    type: String 
  },
  lastOccupiedAt: { 
    type: Date 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

// Ensure unique table number per organization
restaurantTableSchema.index({ organizationId: 1, tableNumber: 1 }, { unique: true });

export default mongoose.model('RestaurantTable', restaurantTableSchema);
