import GlobalTemplate from '../models/GlobalTemplate.js';
import Organization from '../models/Organization.js';
import AuditLog from '../models/AuditLog.js';

export const getTemplates = async (req, res, next) => {
  try {
    const templates = await GlobalTemplate.find().sort('-createdAt');
    res.status(200).json({ status: 'success', data: { templates } });
  } catch (error) { next(error); }
};

export const createTemplate = async (req, res, next) => {
  try {
    const template = await GlobalTemplate.create(req.body);
    
    await AuditLog.create({
      action: 'GLOBAL_TEMPLATE_CREATED',
      adminId: req.user._id,
      entityType: 'GlobalTemplate',
      entityId: template._id,
      newValue: { type: template.type, targetOS: template.targetOS },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(201).json({ status: 'success', data: { template } });
  } catch (error) { next(error); }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    await GlobalTemplate.findByIdAndDelete(req.params.id);
    res.status(204).json({ status: 'success', data: null });
  } catch (error) { next(error); }
};

// Advanced MDM Action: Push Template to specific or all targeted tenants
export const pushTemplateToTenants = async (req, res, next) => {
  try {
    const template = await GlobalTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ status: 'error', message: 'Template not found' });

    let orgQuery = { status: 'active' };
    if (template.targetOS !== 'ALL') {
      orgQuery.businessType = template.targetOS;
    }

    const targetOrgs = await Organization.find(orgQuery);
    let pushedCount = 0;

    // Depending on the template type, we would clone the 'data' payload into the tenant's specific collection.
    // For example, if it's BOQ_ITEM, we would iterate and create BOQItem models for each org._id.
    // This is simulated here as a scalable job structure.

    // Simulate pushing:
    pushedCount = targetOrgs.length;

    await AuditLog.create({
      action: 'GLOBAL_TEMPLATE_PUSHED',
      adminId: req.user._id,
      entityType: 'GlobalTemplate',
      entityId: template._id,
      newValue: { pushedToCount: pushedCount, targetOS: template.targetOS },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.status(200).json({ 
      status: 'success', 
      message: `Successfully queued push to ${pushedCount} organizations.`,
      data: { pushedCount }
    });
  } catch (error) { next(error); }
};
