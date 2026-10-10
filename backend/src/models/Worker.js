import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  workerCode: { type: String, default: '' }, // e.g. "WRK-101"
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Mason', 'Helper', 'Carpenter', 'Bar Bender', 'Electrician', 'Plumber', 'Welder', 'Rigger', 'Other'], 
    required: true 
  },
  skillLevel: {
    type: String,
    enum: ['SKILLED', 'SEMI_SKILLED', 'UNSKILLED'],
    default: 'SKILLED'
  },
  thekedaar: { type: String, default: 'General Site Gang' }, // Gang contractor
  dailyRate: { type: Number, required: true },
  overtimeHourlyRate: { type: Number, default: 0 },
  phone: { type: String },
  aadhaarNo: { type: String, default: '' },
  bankDetails: {
    accountNo: { type: String, default: '' },
    ifsc: { type: String, default: '' },
    upiId: { type: String, default: '' }
  },
  isActive: { type: Boolean, default: true },
  totalPaid: { type: Number, default: 0 },
  totalAdvance: { type: Number, default: 0 },
  payments: [{
    amount: { type: Number, required: true },
    type: { type: String, enum: ['WAGE', 'ADVANCE', 'BONUS'], default: 'WAGE' },
    date: { type: Date, default: Date.now },
    notes: { type: String },
    paymentMode: { type: String, default: 'CASH' }
  }]
}, { timestamps: true });

workerSchema.pre('save', function () {
  if (!this.overtimeHourlyRate && this.dailyRate) {
    this.overtimeHourlyRate = Math.round((this.dailyRate / 8) * 1.5); // 1.5x standard hourly rate
  }
});

export default mongoose.model('Worker', workerSchema);

