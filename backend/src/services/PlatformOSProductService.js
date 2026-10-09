import OSProduct from '../models/OSProduct.js';
import AuditLog from '../models/AuditLog.js';

class PlatformOSProductService {
  async getOSProducts() {
    return await OSProduct.find().sort('name');
  }

  async getOSProductById(id) {
    return await OSProduct.findById(id);
  }

  async createOSProduct(data, adminId, ip, userAgent) {
    const product = await OSProduct.create(data);
    
    await AuditLog.create({
      action: 'OS_PRODUCT_CREATED',
      adminId,
      entityType: 'OSProduct',
      entityId: product._id,
      newValue: data,
      ipAddress: ip,
      userAgent
    });

    return product;
  }

  async updateOSProduct(id, data, adminId, ip, userAgent) {
    const product = await OSProduct.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!product) return null;

    await AuditLog.create({
      action: 'OS_PRODUCT_UPDATED',
      adminId,
      entityType: 'OSProduct',
      entityId: product._id,
      newValue: data,
      ipAddress: ip,
      userAgent
    });

    return product;
  }

  async deleteOSProduct(id, adminId, ip, userAgent) {
    const product = await OSProduct.findByIdAndDelete(id);
    if (!product) return null;

    await AuditLog.create({
      action: 'OS_PRODUCT_DELETED',
      adminId,
      entityType: 'OSProduct',
      entityId: product._id,
      ipAddress: ip,
      userAgent
    });

    return product;
  }
}

export default new PlatformOSProductService();
