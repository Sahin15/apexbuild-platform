import mongoose from 'mongoose';

const resultParameterSchema = new mongoose.Schema({
  parameterId: { type: mongoose.Schema.Types.ObjectId },
  name: { type: String, required: true },
  value: { type: String, required: true },
  unit: { type: String },
  referenceRange: { type: String },
  isAbnormal: { type: Boolean, default: false }
});

const resultSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  
  sample: { type: mongoose.Schema.Types.ObjectId, ref: 'Sample' }, 
  
  parameters: [resultParameterSchema],
  
  status: { 
    type: String, 
    enum: ['Draft', 'Final', 'Verified'], 
    default: 'Draft' 
  },
  
  remarks: { type: String },
  
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model('Result', resultSchema);
