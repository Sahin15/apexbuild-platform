import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  name: { type: String, required: true }, // e.g. "JCB 3DX Super Backhoe Loader"
  equipmentCode: { type: String, required: true }, // e.g. "EQ-JCB-01"
  category: { 
    type: String, 
    enum: ['EXCAVATION', 'EARTHMOVING', 'CONCRETING', 'LIFTING', 'TRANSPORT', 'POWER_GENERATION', 'COMPACTION', 'PUMPING', 'OTHER'], 
    default: 'EARTHMOVING' 
  },
  
  ownership: { 
    type: String, 
    enum: ['OWNED', 'RENTED', 'SUBCONTRACT'], 
    default: 'OWNED' 
  },
  
  supplierOrOwner: { type: String, default: 'Company Owned' },
  registrationNo: { type: String, default: '' }, // e.g. "MH-12-AB-1234"
  modelYear: { type: String, default: '' },
  
  // Operator & Contact
  operatorName: { type: String, default: '' },
  operatorPhone: { type: String, default: '' },
  
  // Commercials & Fuel
  rateType: { 
    type: String, 
    enum: ['HOURLY', 'DAILY', 'MONTHLY'], 
    default: 'HOURLY' 
  },
  rentalRate: { type: Number, default: 0 }, // e.g. ₹1,200 per hour or ₹35,000 per month
  fuelType: { 
    type: String, 
    enum: ['DIESEL', 'PETROL', 'ELECTRIC', 'NONE'], 
    default: 'DIESEL' 
  },
  fuelTankCapacity: { type: Number, default: 120 }, // in Liters
  standardConsumptionPerHour: { type: Number, default: 5 }, // Ltr / hour standard burn rate
  
  // Telemetry / Life
  initialMeterReading: { type: Number, default: 0 }, // Engine Hours
  currentMeterReading: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['ACTIVE', 'IDLE', 'MAINTENANCE', 'DEMOBILIZED'], 
    default: 'ACTIVE' 
  },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Equipment', equipmentSchema);
