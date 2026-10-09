import mongoose from 'mongoose';

const siteReportSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  reportDate: { type: Date, required: true },
  siteEngineerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weather: { type: String },
  workCompleted: { type: String },
  overallProgress: { type: Number, default: 0 },
  manpowerSummary: { type: Object },
  materialSummary: { type: Object },
  equipmentSummary: { type: Object },
  issues: { type: String },
  delays: { type: String },
  safetyObservations: { type: String },
  nextDayPlan: { type: String },
  photos: [{ type: String }],
  status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'], default: 'DRAFT' },
  submittedAt: { type: Date },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SiteReport', siteReportSchema);