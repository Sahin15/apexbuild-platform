import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true }
});

const modifierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 }
});

const restaurantMenuItemSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  categoryId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantMenuCategory', 
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
  description: { 
    type: String 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  veg: { 
    type: Boolean, 
    default: true 
  },
  dietaryType: { 
    type: String, 
    enum: ['VEG', 'NON_VEG', 'EGG', 'VEGAN'], 
    default: 'VEG' 
  },
  station: { 
    type: String, 
    enum: ['Curry Range', 'Tandoor', 'Pantry', 'Beverage Bar', 'Dessert', 'Hot Fryer', 'General'],
    default: 'General' 
  },
  variants: [variantSchema],
  modifiers: [modifierSchema],
  preparationTimeMinutes: { 
    type: Number, 
    default: 15 
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  is86ed: { 
    type: Boolean, 
    default: false 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  imageUrl: { 
    type: String 
  }
}, { timestamps: true });

restaurantMenuItemSchema.index({ organizationId: 1, code: 1 });

export default mongoose.model('RestaurantMenuItem', restaurantMenuItemSchema);
