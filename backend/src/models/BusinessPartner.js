import mongoose from 'mongoose';

const businessPartnerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // Optional: If the partner also uses our OS
  businessName: { type: String, required: true },
  ownerName: { type: String },
  email: { type: String, required: true },
  phone: { type: String },
  partnerType: { type: String, enum: ['RESELLER', 'IMPLEMENTATION', 'AFFILIATE'], default: 'RESELLER' },
  commissionRate: { type: Number, default: 20 }, // Percentage e.g. 20%
  status: { type: String, enum: ['active', 'inactive', 'suspended', 'archived'], default: 'active' },
  totalPaid: { type: Number, default: 0 },
  totalPending: { type: Number, default: 0 },
  lifetimeRevenue: { type: Number, default: 0 },
  referredTenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  lastPaymentDate: { type: Date },
  nextPaymentDate: { type: Date },
  internalNotes: { type: String }
}, { timestamps: true });

export default mongoose.model('BusinessPartner', businessPartnerSchema);
