import mongoose from 'mongoose';

const restaurantInventoryItemSchema = new mongoose.Schema({
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
      'Bakery & Bread',
      'Packaging & Disposables',
      'General Supplies'
    ],
    default: 'General Supplies'
  },
  storageLocation: { 
    type: String, 
    enum: [
      'Walk-in Chiller', 
      'Deep Freezer', 
      'Dry Store Room', 
      'Prep Station Chiller', 
      'Beverage Bar Store', 
      'Bakery Section',
      'General Kitchen'
    ],
    default: 'Dry Store Room'
  },
  uom: { 
    type: String, 
    required: true, 
    default: 'kg',
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'portion', 'can', 'pack', 'bottle', 'box', 'tray']
  },
  currentStock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  },
  minStock: { 
    type: Number, 
    required: true, 
    default: 5,
    min: 0 
  },
  maxStock: { 
    type: Number, 
    default: 50,
    min: 0 
  },
  unitCost: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0 
  },
  totalValue: { 
    type: Number, 
    default: 0 
  },
  preferredSupplier: { 
    type: String, 
    trim: true 
  },
  is86Trigger: { 
    type: Boolean, 
    default: false 
  },
  notes: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

restaurantInventoryItemSchema.index({ organizationId: 1, code: 1 });
restaurantInventoryItemSchema.index({ organizationId: 1, category: 1 });

// Virtual stock status
restaurantInventoryItemSchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= 0) return 'OUT_OF_STOCK';
  if (this.currentStock <= this.minStock) return 'LOW_STOCK';
  if (this.maxStock && this.currentStock > this.maxStock) return 'OVERSTOCKED';
  return 'OPTIMAL';
});

restaurantInventoryItemSchema.set('toJSON', { virtuals: true });
restaurantInventoryItemSchema.set('toObject', { virtuals: true });

export default mongoose.model('RestaurantInventoryItem', restaurantInventoryItemSchema);
