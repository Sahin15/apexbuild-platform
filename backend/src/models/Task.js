import mongoose from 'mongoose';

const progressLogSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  progress: { type: Number, required: true },
  note: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  wbsCode: { type: String, default: '1.0' },
  phase: { 
    type: String, 
    enum: ['PRE-CONSTRUCTION', 'SUBSTRUCTURE', 'SUPERSTRUCTURE', 'MASONRY', 'MEP_HVAC', 'FINISHES', 'HANDOVER'],
    default: 'SUPERSTRUCTURE' 
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'completed', 'delayed', 'on-hold'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  isMilestone: { type: Boolean, default: false },
  isCriticalPath: { type: Boolean, default: false },
  
  // Timeline dates
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  baselineStartDate: { type: Date },
  baselineEndDate: { type: Date },
  durationDays: { type: Number, default: 7 },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  slippageDays: { type: Number, default: 0 },

  // Dependencies (Predecessors)
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  boqItemIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BOQItem' }],

  assigneeName: { type: String, default: 'Site Team' },
  assigneeRole: { type: String, default: 'Contractor' },
  dueDate: { type: Date },
  progressLogs: [progressLogSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Auto-compute durationDays and status
taskSchema.pre('save', function () {
  if (this.startDate && this.endDate) {
    const diff = Math.ceil((new Date(this.endDate) - new Date(this.startDate)) / (1000 * 60 * 60 * 24));
    this.durationDays = Math.max(1, diff);
  }
  if (!this.baselineStartDate) this.baselineStartDate = this.startDate;
  if (!this.baselineEndDate) this.baselineEndDate = this.endDate;

  // Slippage vs baseline
  if (this.baselineEndDate && this.endDate) {
    const slip = Math.ceil((new Date(this.endDate) - new Date(this.baselineEndDate)) / (1000 * 60 * 60 * 24));
    this.slippageDays = slip;
  }

  // Auto status based on progress and dates
  if (this.progress === 100) {
    this.status = 'completed';
  } else if (this.progress > 0) {
    if (new Date() > new Date(this.endDate)) {
      this.status = 'delayed';
    } else {
      this.status = 'in-progress';
    }
  }
});

export default mongoose.model('Task', taskSchema);
