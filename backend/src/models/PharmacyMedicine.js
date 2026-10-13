import mongoose from 'mongoose';

const pharmacyMedicineSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  brandName: { 
    type: String, 
    required: [true, 'Brand name is required'], 
    trim: true, 
    index: true 
  },
  genericName: { 
    type: String, 
    required: [true, 'Generic salt composition is required'], 
    trim: true, 
    index: true 
  },
  dosageForm: { 
    type: String, 
    enum: ['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Ointment', 'Gel', 'Drops', 'Inhaler', 'Respule', 'Powder', 'Other'], 
    default: 'Tablet' 
  },
  strength: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  packSize: { 
    type: String, 
    default: '10 Tablets / Strip', 
    trim: true 
  },
  unitConversionFactor: { 
    type: Number, 
    default: 1, 
    min: 1 
  },
  manufacturer: { 
    type: String, 
    trim: true, 
    default: 'Generic / Unknown' 
  },
  scheduleCategory: { 
    type: String, 
    enum: ['OTC', 'SCHEDULE_H', 'SCHEDULE_H1', 'SCHEDULE_X', 'SCHEDULE_G'], 
    default: 'SCHEDULE_H', 
    index: true 
  },
  storageCondition: { 
    type: String, 
    enum: ['ROOM_TEMPERATURE', 'COLD_CHAIN_2_8', 'COOL_DRY_BELOW_25'], 
    default: 'ROOM_TEMPERATURE' 
  },
  isColdChain: { 
    type: Boolean, 
    default: false 
  },
  isChronic: { 
    type: Boolean, 
    default: false 
  },
  hsnCode: { 
    type: String, 
    default: '30049099', 
    trim: true 
  },
  gstRate: { 
    type: Number, 
    default: 12, 
    enum: [0, 5, 12, 18, 28] 
  },
  reorderLevel: { 
    type: Number, 
    default: 20, 
    min: 0 
  },
  barcode: { 
    type: String, 
    trim: true, 
    sparse: true 
  },
  rackLocation: { 
    type: String, 
    default: 'Rack A-01', 
    trim: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isDiscontinued: { 
    type: Boolean, 
    default: false 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

// Compound text index for fuzzy search across Brand Name and Generic Salt
pharmacyMedicineSchema.index({ brandName: 'text', genericName: 'text', manufacturer: 'text' });
pharmacyMedicineSchema.index({ organizationId: 1, brandName: 1 });

export default mongoose.model('PharmacyMedicine', pharmacyMedicineSchema);
