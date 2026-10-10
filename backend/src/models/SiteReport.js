import mongoose from 'mongoose';

const manpowerEntrySchema = new mongoose.Schema({
  trade: { type: String, required: true }, // e.g. "Masons", "Barbenders", "Carpenters", "Helpers"
  contractorName: { type: String, default: 'General Labour' },
  skilledCount: { type: Number, default: 0 },
  unskilledCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  hoursWorked: { type: Number, default: 8 }
}, { _id: false });

const equipmentEntrySchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "JCB 3DX Excavator", "Boom Placer"
  regNumber: { type: String, default: '' },
  hoursRun: { type: Number, default: 0 },
  hoursIdle: { type: Number, default: 0 },
  breakdownHours: { type: Number, default: 0 },
  remarks: { type: String, default: 'Operational' }
}, { _id: false });

const materialReceivedSchema = new mongoose.Schema({
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'Bags' },
  supplier: { type: String, default: '' },
  challanNo: { type: String, default: '' },
  vehicleNo: { type: String, default: '' }
}, { _id: false });

const workActivitySchema = new mongoose.Schema({
  location: { type: String, default: '' }, // e.g. "Grid A1-A6"
  description: { type: String, required: true },
  quantityExecuted: { type: Number, default: 0 },
  unit: { type: String, default: 'cum' },
  status: { type: String, default: 'Completed' }
}, { _id: false });

const siteReportSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  dprNo: { type: String, default: '' }, // e.g. "DPR-2026-10-10"
  reportDate: { type: Date, required: true },
  siteEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Weather & Shift conditions
  weather: { type: String, default: 'Sunny' },
  weatherDetails: {
    condition: { type: String, default: 'SUNNY' },
    tempMax: { type: Number, default: 34 },
    tempMin: { type: Number, default: 22 },
    rainfallMm: { type: Number, default: 0 },
    shiftHours: { type: Number, default: 8 },
    shiftsWorked: { type: Number, default: 1 }
  },

  // Structured Execution logs
  manpower: [manpowerEntrySchema],
  totalManpower: { type: Number, default: 0 },
  
  equipment: [equipmentEntrySchema],
  materialsReceived: [materialReceivedSchema],
  workActivities: [workActivitySchema],

  // Executive summaries
  workCompleted: { type: String, default: '' },
  overallProgress: { type: Number, default: 0 },
  
  // Quality, Safety, & Delays
  safetyToolboxTopic: { type: String, default: 'General Site Safety & PPE' },
  safetyIncidents: { type: Number, default: 0 },
  qualityTests: { type: String, default: '' },
  issues: { type: String, default: '' },
  delays: { type: String, default: '' },
  nextDayPlan: { type: String, default: '' },
  photos: [{ type: String }],

  status: { 
    type: String, 
    enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], 
    default: 'SUBMITTED' 
  },
  rejectionReason: { type: String, default: '' },
  submittedAt: { type: Date, default: Date.now },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-compute totalManpower before save
siteReportSchema.pre('save', function () {
  if (Array.isArray(this.manpower) && this.manpower.length > 0) {
    this.totalManpower = this.manpower.reduce((acc, m) => acc + (Number(m.totalCount) || ((Number(m.skilledCount) || 0) + (Number(m.unskilledCount) || 0))), 0);
  }
  if (!this.dprNo) {
    const dStr = new Date(this.reportDate).toISOString().split('T')[0];
    this.dprNo = `DPR-${dStr}`;
  }
});

export default mongoose.model('SiteReport', siteReportSchema);