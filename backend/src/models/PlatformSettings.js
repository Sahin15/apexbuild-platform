import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema({
  platformName: { type: String, default: 'ApexBuild OS' },
  supportEmail: { type: String, default: 'support@apexbuild.com' },
  maintenanceMode: { type: Boolean, default: false },
  require2FA: { type: Boolean, default: false },
  sessionTimeoutMinutes: { type: Number, default: 60 },
  
  // SEO Configuration
  globalTitleFormat: { type: String, default: '%s | ApexBuild OS' },
  defaultMetaDescription: { type: String, default: 'The complete operating system for your business.' },
  gaMeasurementId: { type: String },
  fbPixelId: { type: String },
  defaultSocialImage: { type: String },
  faviconUrl: { type: String }
}, { timestamps: true });

// Ensure only one settings document exists
platformSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('PlatformSettings', platformSettingsSchema);
