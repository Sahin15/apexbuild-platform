import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  patientId: { type: String, required: true }, // E.g., PID-2023-001
  firstName: { type: String, required: true },
  lastName: { type: String },
  dateOfBirth: { type: Date },
  age: { type: Number }, // Usually stored if DOB is unknown, but good to have
  ageUnit: { type: String, enum: ['Years', 'Months', 'Days'], default: 'Years' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  bloodGroup: { type: String },
  referringDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  notes: { type: String },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

patientSchema.index({ organizationId: 1, patientId: 1 }, { unique: true });

// Auto-generate patientId before saving if not present
patientSchema.pre('validate', async function () {
  if (!this.patientId) {
    const lastDoc = await mongoose.model('Patient').findOne({ organizationId: this.organizationId }).sort({ createdAt: -1 });
    const year = new Date().getFullYear();
    let nextNum = 1;
    if (lastDoc && lastDoc.patientId) {
      const match = lastDoc.patientId.match(/-(\d+)$/);
      if (match) nextNum = parseInt(match[1], 10) + 1;
    }
    this.patientId = `PID-${year}-${String(nextNum).padStart(4, '0')}`;
  }
});

export default mongoose.model('Patient', patientSchema);
