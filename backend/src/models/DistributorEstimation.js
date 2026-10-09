import mongoose from 'mongoose';

const distributorEstimationSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DistributorCustomer',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  requestedWeight: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'FULFILLED', 'CANCELLED'],
    default: 'PENDING'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('DistributorEstimation', distributorEstimationSchema);
