import mongoose from 'mongoose';

const wageLineItemSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker', required: true },
  workerName: { type: String, required: true },
  workerCode: { type: String, default: '' },
  trade: { type: String, required: true },
  skillLevel: { type: String, default: 'SKILLED' },
  thekedaar: { type: String, default: 'General Labour' },
  dailyRate: { type: Number, required: true },
  overtimeHourlyRate: { type: Number, default: 0 },
  
  // Attendance metrics in period
  daysPresent: { type: Number, default: 0 },
  halfDays: { type: Number, default: 0 },
  daysWorkedEffective: { type: Number, default: 0 }, // Present + 0.5 * HalfDay
  otHours: { type: Number, default: 0 },
  
  // Calculations
  baseWages: { type: Number, default: 0 },
  otWages: { type: Number, default: 0 },
  grossWage: { type: Number, default: 0 },
  advanceDeduction: { type: Number, default: 0 },
  statutoryDeduction: { type: Number, default: 0 }, // PF / ESI / Labour Cess
  netPayable: { type: Number, default: 0 },
  
  paymentStatus: { type: String, enum: ['PENDING', 'PAID'], default: 'PENDING' },
  paymentMode: { type: String, default: 'CASH' },
  paidAt: { type: Date }
}, { _id: false });

const labourWageSheetSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sheetNo: { type: String, required: true }, // e.g. "NMR-2026-W41"
  thekedaar: { type: String, default: 'All Gangs' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  lineItems: [wageLineItemSchema],
  
  totalWorkers: { type: Number, default: 0 },
  totalManDays: { type: Number, default: 0 },
  totalOTHours: { type: Number, default: 0 },
  totalGrossWage: { type: Number, default: 0 },
  totalAdvancesDeducted: { type: Number, default: 0 },
  totalStatutoryDeductions: { type: Number, default: 0 },
  totalNetPayable: { type: Number, default: 0 },
  
  status: {
    type: String,
    enum: ['DRAFT', 'VERIFIED', 'APPROVED', 'DISBURSED'],
    default: 'VERIFIED'
  },
  
  preparedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  disbursedAt: { type: Date }
}, { timestamps: true });

labourWageSheetSchema.pre('save', function () {
  if (Array.isArray(this.lineItems)) {
    this.totalWorkers = this.lineItems.length;
    this.totalManDays = this.lineItems.reduce((sum, item) => sum + (Number(item.daysWorkedEffective) || 0), 0);
    this.totalOTHours = this.lineItems.reduce((sum, item) => sum + (Number(item.otHours) || 0), 0);
    this.totalGrossWage = this.lineItems.reduce((sum, item) => sum + (Number(item.grossWage) || 0), 0);
    this.totalAdvancesDeducted = this.lineItems.reduce((sum, item) => sum + (Number(item.advanceDeduction) || 0), 0);
    this.totalStatutoryDeductions = this.lineItems.reduce((sum, item) => sum + (Number(item.statutoryDeduction) || 0), 0);
    this.totalNetPayable = this.lineItems.reduce((sum, item) => sum + (Number(item.netPayable) || 0), 0);
  }
});

export default mongoose.model('LabourWageSheet', labourWageSheetSchema);
