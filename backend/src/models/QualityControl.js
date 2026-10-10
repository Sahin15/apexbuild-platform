import mongoose from 'mongoose';

const qcRunSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  runNumber: {
    type: Number,
    required: true
  },
  observedValue: {
    type: Number,
    required: true
  },
  zScore: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['IN_CONTROL', 'WARNING', 'OUT_OF_CONTROL'],
    default: 'IN_CONTROL'
  },
  violationRule: {
    type: String,
    enum: ['1_2s', '1_3s', '2_2s', 'R_4s', '4_1s', '10_x', null],
    default: null
  },
  violationDescription: {
    type: String,
    default: ''
  },
  technicianName: {
    type: String,
    default: 'Lab Technologist'
  },
  correctiveAction: {
    type: String,
    default: ''
  },
  actionTakenBy: {
    type: String,
    default: ''
  },
  resolved: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const qualityControlSchema = new mongoose.Schema({
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  controlName: {
    type: String,
    required: [true, 'Control material name is required (e.g. Bio-Rad Liquichek)'],
    trim: true
  },
  analyzerName: {
    type: String,
    required: [true, 'Analyzer / Instrument name is required (e.g. Sysmex XN-350)'],
    trim: true
  },
  department: {
    type: String,
    enum: ['Hematology', 'Biochemistry', 'Serology', 'Microbiology', 'Hormones & Immunoassay', 'Urinalysis'],
    default: 'Biochemistry'
  },
  parameterName: {
    type: String,
    required: [true, 'Parameter name is required (e.g. Hemoglobin, Glucose, Creatinine)'],
    trim: true
  },
  unit: {
    type: String,
    default: ''
  },
  level: {
    type: String,
    enum: ['Level 1 (Normal)', 'Level 2 (High / Pathological)', 'Level 3 (Low)'],
    default: 'Level 1 (Normal)'
  },
  lotNumber: {
    type: String,
    required: [true, 'Control Lot Number is required'],
    trim: true
  },
  targetMean: {
    type: Number,
    required: [true, 'Target Assigned Mean is required']
  },
  targetSD: {
    type: Number,
    required: [true, 'Target Standard Deviation is required']
  },
  expiryDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'ARCHIVED'],
    default: 'ACTIVE'
  },
  runs: [qcRunSchema]
}, { timestamps: true });

// Virtual to calculate Coefficient of Variation % (CV% = SD / Mean * 100)
qualityControlSchema.virtual('targetCV').get(function() {
  if (this.targetMean && this.targetSD) {
    return Number(((this.targetSD / this.targetMean) * 100).toFixed(2));
  }
  return 0;
});

qualityControlSchema.set('toJSON', { virtuals: true });
qualityControlSchema.set('toObject', { virtuals: true });

export default mongoose.model('QualityControl', qualityControlSchema);
