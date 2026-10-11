import mongoose from 'mongoose';

const restaurantAreaSchema = new mongoose.Schema({
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
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { timestamps: true });

export default mongoose.model('RestaurantArea', restaurantAreaSchema);
