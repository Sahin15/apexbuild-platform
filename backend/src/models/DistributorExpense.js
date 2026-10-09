import mongoose from 'mongoose';

const distributorExpenseSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  date: { type: Date, required: true, default: Date.now },
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  paymentMethod: { type: String, enum: ['CASH', 'UPI', 'BANK_TRANSFER'], default: 'CASH' },
  status: { type: String, enum: ['CLEARED', 'PENDING'], default: 'CLEARED' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'DistributorVehicle' },
  loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('DistributorExpense', distributorExpenseSchema);
