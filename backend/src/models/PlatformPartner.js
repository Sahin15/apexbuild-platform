import mongoose from 'mongoose';

const platformPartnerSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  region: { type: String, required: true },
  partnershipType: {
    type: String,
    enum: ['RESELLER', 'INTEGRATOR', 'REFERRAL', 'STRATEGIC'],
    default: 'RESELLER'
  },
  commissionRate: { type: Number, default: 10 }, // percentage
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
    default: 'PENDING'
  },
  joinedDate: { type: Date, default: Date.now },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('PlatformPartner', platformPartnerSchema);
