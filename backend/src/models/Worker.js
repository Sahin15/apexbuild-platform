import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  name: { type: String, required: true },
  category: { type: String, enum: ['Mason', 'Helper', 'Carpenter', 'Bar Bender', 'Electrician', 'Plumber', 'Other'], required: true },
  dailyRate: { type: Number, required: true },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  totalPaid: { type: Number, default: 0 },
  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    notes: { type: String }
  }]
}, { timestamps: true });

export default mongoose.model('Worker', workerSchema);
