import PlatformSettings from '../models/PlatformSettings.js';
import AuditLog from '../models/AuditLog.js';

class PlatformSettingsService {
  async getSettings() {
    return await PlatformSettings.getSettings();
  }

  async updateSettings(updates, adminId, ip, userAgent) {
    const settings = await PlatformSettings.getSettings();
    
    // Track what changed
    const changes = {};
    for (const key in updates) {
      if (settings[key] !== updates[key]) {
        changes[key] = { old: settings[key], new: updates[key] };
        settings[key] = updates[key];
      }
    }

    await settings.save();

    if (Object.keys(changes).length > 0) {
      await AuditLog.create({
        action: 'PLATFORM_SETTINGS_UPDATED',
        adminId,
        entityType: 'PlatformSettings',
        entityId: settings._id,
        newValue: changes,
        ipAddress: ip,
        userAgent
      });
    }

    return settings;
  }
}

export default new PlatformSettingsService();
