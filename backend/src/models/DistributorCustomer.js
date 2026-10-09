import mongoose from 'mongoose';

const distributorCustomerSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  shopName: { type: String, required: true },
  ownerName: { type: String },
  phone: { type: String, required: true },
  whatsapp: { type: String },
  address: { type: String },
  area: { type: String },
  route: { type: String },
  openingDue: { type: Number, default: 0 },
  currentDue: { type: Number, default: 0 },
  creditLimit: { type: Number, default: 0 },
  defaultSellingRate: { type: Number, required: true }, // E.g., ₹125/kg
  paymentTerms: { type: String },
  status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  notes: { type: String }
}, { timestamps: true });

export default mongoose.model('DistributorCustomer', distributorCustomerSchema);
