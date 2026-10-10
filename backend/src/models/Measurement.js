import mongoose from 'mongoose';

const subMeasurementSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  nos: { type: Number, default: 1 },
  length: { type: Number, default: 0 },
  breadth: { type: Number, default: 0 },
  depth: { type: Number, default: 0 },
  isDeduction: { type: Boolean, default: false },
  subTotal: { type: Number, default: 0 }
}, { _id: false });

const measurementSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  boqItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'BOQItem', required: true },
  mbRef: { type: String, required: true }, // e.g. MB-01/P-14
  bookNo: { type: String, default: 'MB-01' },
  pageNo: { type: String, default: '01' },
  location: { type: String, default: 'General Site' }, // e.g. "Zone A - Foundation Grid G1-G4"
  date: { type: Date, required: true },
  items: [subMeasurementSchema],
  quantity: { type: Number, required: true }, // total measured quantity
  unit: { type: String, default: 'cum' },
  status: { 
    type: String, 
    enum: ['DRAFT', 'PENDING', 'VERIFIED', 'REJECTED', 'BILLED'], 
    default: 'PENDING' 
  },
  remarks: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  measuredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  raBillId: { type: mongoose.Schema.Types.ObjectId, ref: 'RABill' } 
}, { timestamps: true });

export default mongoose.model('Measurement', measurementSchema);
