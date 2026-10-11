import mongoose from 'mongoose';

const restaurantMenuCategorySchema = new mongoose.Schema({
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
  description: { 
    type: String 
  },
  defaultStation: { 
    type: String, 
    enum: ['Curry Range', 'Tandoor', 'Pantry', 'Beverage Bar', 'Dessert', 'General'],
    default: 'General' 
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

export default mongoose.model('RestaurantMenuCategory', restaurantMenuCategorySchema);
