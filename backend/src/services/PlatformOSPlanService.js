import OSPlan from '../models/OSPlan.js';
import AuditLog from '../models/AuditLog.js';

class PlatformOSPlanService {
  async getOSPlans() {
    return await OSPlan.find().populate('osProductId', 'name slug businessType').sort('-createdAt');
  }

  async getOSPlanById(id) {
    return await OSPlan.findById(id).populate('osProductId');
  }

  async createOSPlan(data, adminId, ip, userAgent) {
    const plan = await OSPlan.create(data);
    
    await AuditLog.create({
      action: 'OS_PLAN_CREATED',
      adminId,
      entityType: 'OSPlan',
      entityId: plan._id,
      newValue: data,
      ipAddress: ip,
      userAgent
    });

    return plan;
  }

  async updateOSPlan(id, data, adminId, ip, userAgent) {
    const plan = await OSPlan.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!plan) return null;

    await AuditLog.create({
      action: 'OS_PLAN_UPDATED',
      adminId,
      entityType: 'OSPlan',
      entityId: plan._id,
      newValue: data,
      ipAddress: ip,
      userAgent
    });

    return plan;
  }

  async deleteOSPlan(id, adminId, ip, userAgent) {
    // Soft delete or real delete. We'll do real delete for now or update isActive.
    // Given the model has isActive, let's do a hard delete for simplicity in this phase, or update isActive to false.
    // The requirement says CRUD, let's implement hard delete for now.
    const plan = await OSPlan.findByIdAndDelete(id);
    if (!plan) return null;

    await AuditLog.create({
      action: 'OS_PLAN_DELETED',
      adminId,
      entityType: 'OSPlan',
      entityId: plan._id,
      ipAddress: ip,
      userAgent
    });

    return plan;
  }
}

export default new PlatformOSPlanService();
