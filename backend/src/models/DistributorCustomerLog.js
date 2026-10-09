import mongoose from 'mongoose';

const distributorCustomerLogSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorCustomer', required: true, index: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('DistributorCustomerLog', distributorCustomerLogSchema);
