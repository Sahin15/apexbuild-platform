import mongoose from 'mongoose';

const pettyCashTransactionSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'PettyCashAccount', required: true },
  
  type: { 
    type: String, 
    enum: ['EXPENSE', 'TOP_UP', 'REFUND'], 
    default: 'EXPENSE' 
  },
  
  voucherNo: { type: String, required: true }, // e.g. "VCH-2026-001" or "TOP-2026-001"
  date: { type: Date, required: true, default: Date.now },
  amount: { type: Number, required: true, min: 0 },
  
  category: { 
    type: String, 
    enum: [
      'SITE_HARDWARE', 
      'DIESEL_FUEL', 
      'LABOUR_TEA_FOOD', 
      'EMERGENCY_REPAIR', 
      'LOCAL_CARTAGE', 
      'OFFICE_STATIONERY', 
      'SAFETY_PPE', 
      'OTHER'
    ], 
    default: 'SITE_HARDWARE' 
  },
  
  description: { type: String, required: true }, // e.g. "Binding wire 10kg and steel nails for slab shuttering"
  vendorName: { type: String, default: 'Local Hardware Store' },
  billNumber: { type: String, default: '' }, // Cash memo number
  paymentMode: { 
    type: String, 
    enum: ['CASH', 'UPI', 'BANK_TRANSFER'], 
    default: 'CASH' 
  },
  
  receiptUrl: { type: String, default: '' },
  
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED'], 
    default: 'PENDING' 
  },
  
  submittedBy: { type: String, default: '' }, // Supervisor name
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvalDate: { type: Date },
  rejectionReason: { type: String, default: '' },
  
  linkedExpenseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }
}, { timestamps: true });

export default mongoose.model('PettyCashTransaction', pettyCashTransactionSchema);
