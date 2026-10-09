import DistributorSupplier from '../models/DistributorSupplier.js';

export const getSuppliers = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const suppliers = await DistributorSupplier.find({ organizationId: orgId }).sort('-createdAt');
    res.status(200).json({ status: 'success', data: { suppliers } });
  } catch (error) { next(error); }
};

export const createSupplier = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const data = { ...req.body, organizationId: orgId };
    
    // Set initial currentPayable to openingDue if provided
    if (data.openingDue) {
      data.currentPayable = data.openingDue;
    }
    
    const newSupplier = await DistributorSupplier.create(data);
    res.status(201).json({ status: 'success', data: { supplier: newSupplier } });
  } catch (error) { next(error); }
};

export const getSupplier = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const supplier = await DistributorSupplier.findOne({ _id: req.params.id, organizationId: orgId });
    if (!supplier) return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    res.status(200).json({ status: 'success', data: { supplier } });
  } catch (error) { next(error); }
};

export const updateSupplier = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId;
    const existingSupplier = await DistributorSupplier.findOne({ _id: req.params.id, organizationId: orgId });
    if (!existingSupplier) return res.status(404).json({ status: 'error', message: 'Supplier not found' });

    if (req.body.openingDue !== undefined) {
      const diff = Number(req.body.openingDue) - (existingSupplier.openingDue || 0);
      
      // Self-correct for records affected by the earlier bug where currentPayable stayed 0
      if (existingSupplier.currentPayable === 0 && existingSupplier.openingDue > 0) {
        req.body.currentPayable = Number(req.body.openingDue);
      } else {
        req.body.currentPayable = existingSupplier.currentPayable + diff;
      }
    }

    const supplier = await DistributorSupplier.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      req.body,
      { new: true, runValidators: true }
    );
    res.status(200).json({ status: 'success', data: { supplier } });
  } catch (error) { next(error); }
};
