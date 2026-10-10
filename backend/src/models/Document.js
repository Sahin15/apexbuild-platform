import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  docType: { 
    type: String, 
    enum: ['DRAWING_GFC', 'QUALITY_CERTIFICATE', 'CONTRACT_AGREEMENT', 'SITE_RECORD', 'GENERAL'],
    default: 'DRAWING_GFC'
  },
  
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { 
    type: String, 
    enum: [
      'Drawings & Blueprints', 
      'Quality & Test Certificates', 
      'Contracts & Agreements', 
      'BOQ & Estimates', 
      'Site Photos', 
      'Invoices & Bills', 
      'Other'
    ],
    default: 'Drawings & Blueprints'
  },

  // GFC / Engineering Drawing Specifics
  drawingNumber: { type: String, uppercase: true, trim: true }, // e.g. "STR-FDN-001", "ARCH-GA-002"
  discipline: { 
    type: String, 
    enum: ['STRUCTURAL', 'ARCHITECTURAL', 'MEP_PLUMBING', 'CIVIL_INFRA', 'ELECTRICAL', 'SURVEY_ALIGNMENT', 'GENERAL'],
    default: 'STRUCTURAL'
  },
  revision: { type: String, default: 'R0', uppercase: true, trim: true }, // e.g. "R0", "R1", "R2"
  revisionNotes: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['GFC_ACTIVE', 'SUPERSEDED', 'UNDER_REVIEW', 'ARCHIVED'],
    default: 'GFC_ACTIVE'
  },
  issuedBy: { type: String, default: 'Consulting Structural Engineer / Client' },
  releaseDate: { type: Date, default: Date.now },
  supersededBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  previousRevision: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },

  // Quality & Concrete Cube Test Certificate Specifics
  testType: { 
    type: String, 
    enum: ['CONCRETE_CUBE_TEST', 'STEEL_MTC', 'SOIL_COMPACTION', 'CEMENT_TEST', 'NABL_WATER_TEST', 'OTHER'],
    default: 'CONCRETE_CUBE_TEST'
  },
  certificateNumber: { type: String, default: '' }, // e.g. "NABL-2026-CUB-104"
  testingAgency: { type: String, default: 'NABL Accredited Testing Laboratory' },
  testDate: { type: Date, default: Date.now },
  concreteGrade: { type: String, default: 'M25' }, // e.g. "M25", "M30", "M35", "M40"
  locationElement: { type: String, default: '' }, // e.g. "Tower A - 3rd Floor Slab & Beams"
  sevenDayStrength: { type: Number, default: 0 }, // in N/mm²
  twentyEightDayStrength: { type: Number, default: 0 }, // in N/mm²
  targetStrength: { type: Number, default: 0 }, // in N/mm²
  complianceStatus: { 
    type: String, 
    enum: ['PASS', 'FAIL', 'PENDING'],
    default: 'PASS'
  },

  // File metadata
  fileUrl: { type: String, default: '' },
  fileName: { type: String, default: '' },
  fileType: { type: String, default: 'pdf' }, // 'pdf', 'dwg', 'jpg', 'png', 'docx'
  fileSize: { type: Number, default: 1540000 }, // bytes
  tags: [{ type: String }],

  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Compound indexes for ultra-fast lookup & revision matching
documentSchema.index({ organizationId: 1, projectId: 1, drawingNumber: 1 });
documentSchema.index({ organizationId: 1, docType: 1, status: 1 });

export default mongoose.model('Document', documentSchema);
