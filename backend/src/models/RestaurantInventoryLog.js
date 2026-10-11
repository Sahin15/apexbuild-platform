import mongoose from 'mongoose';

const restaurantInventoryLogSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  inventoryItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantInventoryItem', 
    required: true, 
    index: true 
  },
  type: { 
    type: String, 
    required: true,
    enum: ['INWARD', 'KITCHEN_ISSUE', 'WASTAGE_SPOILAGE', 'AUDIT_ADJUSTMENT', 'RETURN'],
    default: 'INWARD'
  },
  quantityChange: { 
    type: Number, 
    required: true 
  },
  previousStock: { 
    type: Number, 
    required: true 
  },
  newStock: { 
    type: Number, 
    required: true 
  },
  unitCost: { 
    type: Number, 
    default: 0 
  },
  totalCostImpact: { 
    type: Number, 
    default: 0 
  },
  referenceNo: { 
    type: String, 
    trim: true 
  },
  reason: { 
    type: String, 
    trim: true 
  },
  performedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { timestamps: true });

restaurantInventoryLogSchema.index({ organizationId: 1, inventoryItemId: 1, createdAt: -1 });

export default mongoose.model('RestaurantInventoryLog', restaurantInventoryLogSchema);
