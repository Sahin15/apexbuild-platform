import mongoose from 'mongoose';

const platformCMSMenuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { 
    type: String, 
    enum: ['HEADER_PRIMARY', 'HEADER_SECONDARY', 'FOOTER_LEGAL', 'FOOTER_COMPANY', 'SIDEBAR', 'CUSTOM'],
    default: 'CUSTOM' 
  },
  links: [{
    label: { type: String, required: true },
    url: { type: String, required: true },
    target: { type: String, enum: ['_self', '_blank'], default: '_self' },
    order: { type: Number, default: 0 },
    icon: { type: String }
  }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('PlatformCMSMenu', platformCMSMenuSchema);
