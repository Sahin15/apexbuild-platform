import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional: Can be global or project-specific
  title: { type: String, required: true },
  description: { type: String },
  category: { 
    type: String, 
    enum: ['Drawings & Blueprints', 'Contracts & Agreements', 'BOQ & Estimates', 'Site Photos', 'Invoices & Bills', 'Other'],
    default: 'Other'
  },
  fileUrl: { type: String, required: true }, // URL to the file
  fileType: { type: String }, // e.g., 'pdf', 'jpg', 'png', 'doc'
  size: { type: Number }, // in bytes
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Document', documentSchema);
