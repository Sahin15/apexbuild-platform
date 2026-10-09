import Material from '../models/Material.js';
import MaterialLedger from '../models/MaterialLedger.js';

export const getMaterials = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId) filter.projectId = req.params.projectId;

    const materials = await Material.find(filter).populate('projectId', 'name');
    res.status(200).json({ status: 'success', data: { materials } });
  } catch (error) {
    next(error);
  }
};

export const createMaterial = async (req, res, next) => {
  try {
    const newMaterial = await Material.create({
      ...req.body,
      projectId: req.params.projectId || req.body.projectId,
      organizationId: req.user.organizationId
    });
    res.status(201).json({ status: 'success', data: { material: newMaterial } });
  } catch (error) {
    next(error);
  }
};

export const updateMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.materialId, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!material) return res.status(404).json({ message: 'Material not found' });
    res.status(200).json({ status: 'success', data: { material } });
  } catch (error) {
    next(error);
  }
};

export const getLedger = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.materialId) filter.materialId = req.params.materialId;
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const ledger = await MaterialLedger.find(filter)
      .populate('materialId', 'name unit')
      .populate('projectId', 'name')
      .populate('createdBy', 'name')
      .sort('-createdAt');
    res.status(200).json({ status: 'success', data: { ledger } });
  } catch (error) {
    next(error);
  }
};

export const createLedgerEntry = async (req, res, next) => {
  try {
    const { materialId, projectId, type, quantity, notes, referenceId } = req.body;
    
    // Create Ledger entry
    const entry = await MaterialLedger.create({
      organizationId: req.user.organizationId,
      materialId,
      projectId,
      type,
      quantity, // Positive for IN, Negative for OUT
      notes,
      referenceId,
      createdBy: req.user._id
    });

    // Update Material current stock
    const material = await Material.findById(materialId);
    if (material) {
      material.currentStock += quantity;
      await material.save();
    }

    res.status(201).json({ status: 'success', data: { entry } });
  } catch (error) {
    next(error);
  }
};
