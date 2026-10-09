import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  legalName: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  gstNumber: { type: String },
  panNumber: { type: String },
  logo: { type: String },
  settings: { type: Object, default: {} },
  subscription: { type: String, default: 'free' },
  businessType: { type: String, enum: ['CONTRACTOR', 'MATERIAL_SUPPLIER', 'CHICKEN_DISTRIBUTOR', 'SUPERADMIN', 'DIAGNOSTICS', 'PHARMACY', 'RESTAURANT', 'EDUCATION'], default: 'CONTRACTOR' },
  status: { type: String, enum: ['active', 'suspended', 'cancelled', 'pending', 'rejected', 'on_hold', 'archived'], default: 'pending' },
  ownerName: { type: String },
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessPartner' },
  notes: { type: String },
  internalNotes: { type: String },
  registrationDate: { type: Date, default: Date.now },
  approvalDate: { type: Date }
}, { timestamps: true });

export default mongoose.model('Organization', organizationSchema);