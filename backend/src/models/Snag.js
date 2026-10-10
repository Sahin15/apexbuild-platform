import mongoose from 'mongoose';

const snagPhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: { type: String, default: '' },
  type: { type: String, enum: ['BEFORE', 'AFTER'], default: 'BEFORE' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const snagSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  snagNumber: { type: String, required: true }, // e.g. "SNG-2026-001"
  title: { type: String, required: true }, // e.g. "Honeycomb on Column C3 after deshuttering"
  description: { type: String, required: true },
  
  category: { 
    type: String, 
    enum: [
      'CONCRETE', 
      'REBAR_FORMWORK', 
      'MASONRY_PLASTER', 
      'WATERPROOFING', 
      'ELECTRICAL_MEP', 
      'FINISHES_PAINT', 
      'SAFETY_HOUSEKEEPING', 
      'OTHER'
    ], 
    default: 'CONCRETE' 
  },
  
  severity: { 
    type: String, 
    enum: ['CRITICAL', 'MAJOR', 'MINOR'], 
    default: 'MAJOR' 
  },
  
  location: { type: String, required: true }, // e.g. "Tower A - 3rd Floor Slab Grid C2-C4"
  tradeOrGang: { type: String, default: 'General Civil Gang' }, // e.g. "Precision Formworks"
  
  identifiedDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'VERIFIED_CLOSED'], 
    default: 'OPEN' 
  },
  
  rectificationNotes: { type: String, default: '' },
  resolvedDate: { type: Date },
  
  photos: [snagPhotoSchema],
  costImpact: { type: Number, default: 0 }, // Estimated repair or contractor backcharge cost
  
  identifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedTo: { type: String, default: '' }, // Name of thekedaar or site engineer
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Snag', snagSchema);
