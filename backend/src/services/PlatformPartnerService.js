import PlatformPartner from '../models/PlatformPartner.js';
import AuditLog from '../models/AuditLog.js';
import AppError from '../utils/AppError.js';

class PlatformPartnerService {
  async getPartners() {
    return await PlatformPartner.find().sort('-createdAt').lean();
  }

  async createPartner(data, adminId, ip, userAgent) {
    const partner = await PlatformPartner.create(data);

    await AuditLog.create({
      action: 'PLATFORM_PARTNER_CREATED',
      adminId,
      entityType: 'PlatformPartner',
      entityId: partner._id,
      newValue: { companyName: partner.companyName, type: partner.partnershipType },
      ipAddress: ip,
      userAgent
    });

    return partner;
  }

  async updatePartnerStatus(id, status, adminId, ip, userAgent) {
    const partner = await PlatformPartner.findByIdAndUpdate(id, { status }, { new: true });
    if (!partner) throw new AppError('Partner not found', 404);

    await AuditLog.create({
      action: 'PLATFORM_PARTNER_STATUS_UPDATED',
      adminId,
      entityType: 'PlatformPartner',
      entityId: partner._id,
      newValue: { status },
      ipAddress: ip,
      userAgent
    });

    return partner;
  }
}

export default new PlatformPartnerService();
