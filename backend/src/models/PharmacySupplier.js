import mongoose from 'mongoose';

const pharmacySupplierSchema = new mongoose.Schema({
  organizationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization', 
    required: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: [true, 'Supplier / Distributor name is required'], 
    trim: true, 
    index: true 
  },
  dlNumber: { 
    type: String, 
    trim: true, 
    default: '', 
    comment: 'Wholesale Drug Licence Form 20B/21B' 
  },
  gstin: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  panNumber: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  contactPerson: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  phone: { 
    type: String, 
    required: [true, 'Phone number is required'], 
    trim: true 
  },
  email: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  address: { 
    type: String, 
    trim: true, 
    default: '' 
  },
  paymentTermsDays: { 
    type: Number, 
    default: 21, 
    min: 0 
  },
  outstandingBalance: { 
    type: Number, 
    default: 0 
  },
  creditLimit: { 
    type: Number, 
    default: 0 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  notes: { 
    type: String, 
    default: '' 
  }
}, { timestamps: true });

pharmacySupplierSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model('PharmacySupplier', pharmacySupplierSchema);
