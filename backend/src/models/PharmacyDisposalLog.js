import mongoose from 'mongoose';

const pharmacyDisposalLogSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  disposalNumber: { 
    type: String, 
    required: true, 
    trim: true 
  },
  disposalDate: { 
    type: Date, 
    default: Date.now, 
    index: true 
  },
  batchId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyBatch', 
    required: true 
  },
  medicineId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'PharmacyMedicine',
    required: true 
  },
  brandName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  genericName: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  batchNumber: { 
    type: String, 
    required: true, 
    uppercase: true, 
    trim: true 
  },
  expiryDate: { 
    type: String, 
    required: true 
  },
  quantityDisposed: { 
    type: Number, 
    required: true, 
    min: [1, 'Disposed quantity must be at least 1'] 
  },
  unitCost: { 
    type: Number, 
    default: 0 
  },
  totalLoss: { 
    type: Number, 
    default: 0 
  },
  method: { 
    type: String, 
    enum: [
      'INCINERATION_BIOMEDICAL_AGENCY', 
      'CHEMICAL_DENATURATION', 
      'CRUSHING_AND_LANDFILL_SECURE', 
      'DRAIN_NEUTRALIZATION_AUTHORIZED'
    ], 
    default: 'INCINERATION_BIOMEDICAL_AGENCY' 
  },
  agencyName: { 
    type: String, 
    trim: true, 
    default: 'Medicare Bio-Waste Solutions Pvt Ltd' 
  },
  agencyCertificateNumber: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  witnessedBy: { 
    type: String, 
    trim: true, 
    default: 'Regd. Pharmacist' 
  },
  pharmacistId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  remarks: { 
    type: String, 
    trim: true, 
    default: '' 
  }
}, { timestamps: true });

pharmacyDisposalLogSchema.index({ organizationId: 1, disposalNumber: 1 }, { unique: true });
pharmacyDisposalLogSchema.index({ organizationId: 1, disposalDate: -1 });

export default mongoose.model('PharmacyDisposalLog', pharmacyDisposalLogSchema);
