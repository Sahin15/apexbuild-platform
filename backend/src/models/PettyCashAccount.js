import mongoose from 'mongoose';

const pettyCashAccountSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  supervisorName: { type: String, required: true }, // e.g. "Kishore Site Supervisor"
  supervisorPhone: { type: String, default: '' },
  upiId: { type: String, default: '' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  allocatedFloat: { type: Number, required: true, default: 25000 }, // Sanctioned Imprest Limit (₹)
  currentBalance: { type: Number, required: true, default: 25000 }, // Cash in Hand Remaining (₹)
  totalReceived: { type: Number, default: 25000 }, // Cumulative Funds Topped-Up (₹)
  totalSpent: { type: Number, default: 0 }, // Cumulative Approved Vouchers (₹)
  
  status: { 
    type: String, 
    enum: ['ACTIVE', 'SETTLED', 'FROZEN'], 
    default: 'ACTIVE' 
  },
  
  lastTopUpDate: { type: Date, default: Date.now },
  notes: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('PettyCashAccount', pettyCashAccountSchema);
