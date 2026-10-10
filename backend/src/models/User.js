import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['OWNER', 'ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'SITE_ENGINEER', 'ACCOUNTANT', 'SUPERVISOR', 'STORE_MANAGER', 'VIEWER', 'SALES', 'PURCHASE', 'DELIVERY', 'DRIVER', 'STAFF', 'RECEPTIONIST', 'TECHNICIAN', 'PHLEBOTOMIST', 'PATHOLOGIST', 'RADIOLOGIST', 'REPORT_VERIFIER'],
    default: 'VIEWER' 
  },
  platformRole: {
    type: String,
    enum: ['SUPER_ADMIN', 'PLATFORM_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'SALES_ADMIN', 'NONE'],
    default: 'NONE'
  },
  avatar: { type: String },
  licenseNumber: { type: String },
  bloodGroup: { type: String },
  address: { type: String },
  emergencyContactName: { type: String },
  emergencyContactPhone: { type: String },
  status: { type: String, enum: ['active', 'inactive', 'pending', 'suspended'], default: 'active' },
  lastLoginAt: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

export default mongoose.model('User', userSchema);