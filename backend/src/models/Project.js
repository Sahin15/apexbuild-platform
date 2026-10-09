import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  projectCode: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  projectType: { type: String },
  location: { type: String },
  city: { type: String },
  state: { type: String },
  pincode: { type: String },
  contractValue: { type: Number, default: 0 },
  estimatedCost: { type: Number, default: 0 },
  startDate: { type: Date },
  expectedEndDate: { type: Date },
  actualEndDate: { type: Date },
  status: { 
    type: String, 
    enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'], 
    default: 'PLANNING' 
  },
  projectManagerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  progress: { type: Number, default: 0 },
  settings: { type: Object, default: {} },
  
  // Cost Estimation for Profitability Tracking
  estimation: {
    labourCost: { type: Number, default: 0 },
    materialCost: { type: Number, default: 0 },
    extraCost: { type: Number, default: 0 },
    timelineDays: { type: Number, default: 0 },
    materialCategories: { type: Object, default: {} } // e.g. { "Sand": 50000, "Cement": 100000 }
  },
  
  // Advanced Construction Details
  contractType: { type: String, enum: ['LUMPSUM', 'ITEM_RATE', 'TURNKEY', 'EPC', 'COST_PLUS'], default: 'ITEM_RATE' },
  totalBuiltUpArea: { type: String }, 
  plotSize: { type: String }, 
  numberOfFloors: { type: Number },
  buildingPermitNo: { type: String },
  reraRegistrationNo: { type: String },
  paymentTerms: { type: String },
  defectLiabilityPeriod: { type: String }
}, { timestamps: true });

export default mongoose.model('Project', projectSchema);