import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  name: { type: String, required: true },
  specialization: { type: String },
  phone: { type: String },
  email: { type: String },
  clinicName: { type: String }, // Clinic or Hospital
  address: { type: String },
  city: { type: String },
  state: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Doctor', doctorSchema);
