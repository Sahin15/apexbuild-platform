import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional if it's an office/global expense
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true },
  category: { type: String, enum: ['Material', 'Equipment', 'Transport', 'Labour', 'Office', 'Other'], required: true },
  
  // Specific fields for Material tracking
  materialType: { type: String, enum: ['Sand', 'Brick', 'Reinforcement', 'Cement', 'Gravel', 'Soil', 'Other'] },
  quantity: { type: Number },
  unit: { type: String, enum: ['Truck', 'Trolley', 'Bags', 'Kg', 'Ton', 'Ltr', 'Pcs', 'Other'] },
  
  amount: { type: Number, required: true, min: 0 },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  receiptUrl: { type: String } // optional for future use
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);
