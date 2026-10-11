import mongoose from 'mongoose';

const cashDropSchema = new mongoose.Schema({
  amount: { 
    type: Number, 
    required: true 
  },
  reason: { 
    type: String, 
    default: 'Safe Drop' 
  },
  droppedAt: { 
    type: Date, 
    default: Date.now 
  },
  droppedBy: { 
    type: String 
  }
});

const restaurantShiftSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  cashierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  cashierName: { 
    type: String, 
    required: true 
  },
  registerNumber: { 
    type: String, 
    default: 'Register #1' 
  },
  openedAt: { 
    type: Date, 
    default: Date.now 
  },
  closedAt: { 
    type: Date 
  },
  openingFloat: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  cashSales: { 
    type: Number, 
    default: 0 
  },
  upiSales: { 
    type: Number, 
    default: 0 
  },
  cardSales: { 
    type: Number, 
    default: 0 
  },
  totalOrdersCount: { 
    type: Number, 
    default: 0 
  },
  cashDrops: { 
    type: Number, 
    default: 0 
  },
  drops: [cashDropSchema],
  expectedCash: { 
    type: Number, 
    default: 0 
  },
  countedCash: { 
    type: Number 
  },
  variance: { 
    type: Number, 
    default: 0 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'CLOSED'], 
    default: 'OPEN',
    index: true 
  },
  notes: { 
    type: String 
  }
}, { timestamps: true });

restaurantShiftSchema.index({ organizationId: 1, openedAt: -1 });

export default mongoose.model('RestaurantShift', restaurantShiftSchema);
