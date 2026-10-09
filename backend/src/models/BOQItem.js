import mongoose from 'mongoose';

const boqItemSchema = new mongoose.Schema({
  boqId: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQ', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sectionId: { type: String },
  itemCode: { type: String },
  description: { type: String, required: true },
  unit: { type: String, required: true },
  quantity: { type: Number, required: true },
  rate: { type: Number, required: true },
  amount: { type: Number, required: true },
  completedQuantity: { type: Number, default: 0 },
  remainingQuantity: { type: Number, required: true },
  status: { type: String, default: 'ACTIVE' }
}, { timestamps: true });

// Ensure remainingQuantity and amount are calculated correctly
boqItemSchema.pre('save', function (next) {
  this.amount = this.quantity * this.rate;
  this.remainingQuantity = this.quantity - this.completedQuantity;
  next();
});

export default mongoose.model('BOQItem', boqItemSchema);