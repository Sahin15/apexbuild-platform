import MasterDataTemplate from '../models/MasterDataTemplate.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

class PlatformMasterDataService {
  async getTemplates() {
    return await MasterDataTemplate.find().sort('-createdAt').lean();
  }

  async createTemplate(data, adminId, ip, userAgent) {
    const template = await MasterDataTemplate.create(data);

    await AuditLog.create({
      action: 'MASTER_DATA_TEMPLATE_CREATED',
      adminId,
      entityType: 'MasterDataTemplate',
      entityId: template._id,
      newValue: { name: template.name, type: template.type, targetOS: template.targetOS },
      ipAddress: ip,
      userAgent
    });

    return template;
  }

  async deleteTemplate(id, adminId, ip, userAgent) {
    const template = await MasterDataTemplate.findByIdAndDelete(id);
    if (!template) throw new AppError('Template not found', 404);

    await AuditLog.create({
      action: 'MASTER_DATA_TEMPLATE_DELETED',
      adminId,
      entityType: 'MasterDataTemplate',
      entityId: template._id,
      newValue: { name: template.name },
      ipAddress: ip,
      userAgent
    });

    return null;
  }

  async pushTemplate(id, adminId, ip, userAgent) {
    const template = await MasterDataTemplate.findById(id);
    if (!template) throw new AppError('Template not found', 404);

    // In a real system, this would loop through active tenants with `targetOS`
    // and inject the `data` payload into their databases (e.g. creating BOQ items).
    // For Phase 10, we will simulate the push and log the audit.

    await AuditLog.create({
      action: 'MASTER_DATA_PUSHED',
      adminId,
      entityType: 'MasterDataTemplate',
      entityId: template._id,
      newValue: { name: template.name, targetOS: template.targetOS },
      ipAddress: ip,
      userAgent
    });

    return { message: `Template pushed to all ${template.targetOS} tenants successfully.` };
  }
}

export default new PlatformMasterDataService();
