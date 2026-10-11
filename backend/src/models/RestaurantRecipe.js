import mongoose from 'mongoose';

const ingredientItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  uom: { 
    type: String, 
    required: true, 
    default: 'g',
    enum: ['kg', 'g', 'l', 'ml', 'pcs', 'portion', 'tbsp', 'tsp', 'pinch', 'can', 'pack', 'bottle']
  },
  unitCost: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  yieldFactor: { 
    type: Number, 
    default: 100, // percentage, e.g. 90 means 90% usable yield (10% trim loss)
    min: 1, 
    max: 100 
  },
  lineCost: { 
    type: Number, 
    required: true, 
    default: 0 
  }
});

const restaurantRecipeSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  menuItemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RestaurantMenuItem', 
    required: true,
    index: true 
  },
  recipeName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  yieldPortions: { 
    type: Number, 
    default: 1, 
    min: 1 
  },
  ingredients: [ingredientItemSchema],
  totalBatchCost: { 
    type: Number, 
    default: 0 
  },
  portionCost: { 
    type: Number, 
    default: 0 
  },
  sellingPrice: { 
    type: Number, 
    default: 0 
  },
  foodCostPercentage: { 
    type: Number, 
    default: 0 
  },
  grossMarginPercentage: { 
    type: Number, 
    default: 0 
  },
  contributionMargin: { 
    type: Number, 
    default: 0 
  },
  targetCostPercentage: { 
    type: Number, 
    default: 32 
  },
  costStatus: {
    type: String,
    enum: ['OPTIMAL', 'ACCEPTABLE', 'HIGH_ALERT'],
    default: 'OPTIMAL'
  },
  allergens: [{
    type: String,
    enum: ['DAIRY', 'NUTS', 'GLUTEN', 'EGGS', 'SOY', 'SHELLFISH', 'FISH', 'MUSTARD', 'SESAME']
  }],
  prepTimeMinutes: {
    type: Number,
    default: 15
  },
  preparationNotes: { 
    type: String 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

restaurantRecipeSchema.index({ organizationId: 1, menuItemId: 1 }, { unique: true });

export default mongoose.model('RestaurantRecipe', restaurantRecipeSchema);
