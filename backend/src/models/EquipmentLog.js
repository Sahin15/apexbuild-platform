import mongoose from 'mongoose';

const equipmentLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  equipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  
  logDate: { type: Date, required: true, default: Date.now },
  slipNo: { type: String, required: true }, // e.g. "EQ-LOG-2026-10-10-01"
  
  // Shift & Meter
  shift: { type: String, enum: ['DAY', 'NIGHT', 'DOUBLE'], default: 'DAY' },
  startMeter: { type: Number, required: true, default: 0 },
  endMeter: { type: Number, required: true, default: 0 },
  operatingHours: { type: Number, required: true, default: 0 },
  idleHours: { type: Number, default: 0 },
  breakdownHours: { type: Number, default: 0 },
  
  // Fuel / Diesel Issued
  fuelIssuedLiters: { type: Number, default: 0 },
  fuelRatePerLiter: { type: Number, default: 92 },
  fuelTotalCost: { type: Number, default: 0 },
  fuelSource: { 
    type: String, 
    enum: ['SITE_TANK', 'LOCAL_PUMP', 'BARREL_DRUM', 'NONE'], 
    default: 'SITE_TANK' 
  },
  fuelSlipNumber: { type: String, default: '' },
  
  // Financial Costs
  equipmentRentalCost: { type: Number, default: 0 }, // For rented units
  operatorCost: { type: Number, default: 0 },
  totalDayCost: { type: Number, default: 0 },
  
  // Work & Personnel
  workDescription: { type: String, default: '' }, // e.g. "Foundation excavation grid B1-B5"
  location: { type: String, default: 'Site Main Yard' },
  operatorName: { type: String, default: '' },
  supervisorName: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['RECORDED', 'VERIFIED', 'FLAGGED'], 
    default: 'VERIFIED' 
  },
  remarks: { type: String, default: '' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-calculate operating hours and costs before saving
equipmentLogSchema.pre('save', function () {
  if (this.endMeter >= this.startMeter && (!this.operatingHours || this.operatingHours === 0)) {
    this.operatingHours = Number((this.endMeter - this.startMeter).toFixed(2));
  }
  
  // Fuel total cost
  this.fuelTotalCost = Number(((this.fuelIssuedLiters || 0) * (this.fuelRatePerLiter || 92)).toFixed(2));
  
  // Total day cost
  this.totalDayCost = Number(((this.equipmentRentalCost || 0) + this.fuelTotalCost + (this.operatorCost || 0)).toFixed(2));
});

export default mongoose.model('EquipmentLog', equipmentLogSchema);
