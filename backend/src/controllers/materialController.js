import Material from '../models/Material.js';
import MaterialLedger from '../models/MaterialLedger.js';
import GoodsReceivedNote from '../models/GoodsReceivedNote.js';
import MaterialIndent from '../models/MaterialIndent.js';
import StoreIssue from '../models/StoreIssue.js';
import AppError from '../utils/AppError.js';

// ==================== MATERIAL CATALOG ====================

export const getMaterials = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId) filter.projectId = req.params.projectId;
    else if (req.query.projectId) filter.projectId = req.query.projectId;
    if (req.query.category && req.query.category !== 'ALL') filter.category = req.query.category;

    const materials = await Material.find(filter)
      .populate('projectId', 'name projectCode')
      .sort('category name');

    res.status(200).json({ status: 'success', data: { materials } });
  } catch (error) {
    next(error);
  }
};

export const createMaterial = async (req, res, next) => {
  try {
    const pId = req.params.projectId || req.body.projectId;
    const count = await Material.countDocuments({ organizationId: req.user.organizationId });
    const autoCode = req.body.materialCode || `MAT-${String(count + 1).padStart(3, '0')}`;

    const newMaterial = await Material.create({
      ...req.body,
      materialCode: autoCode,
      projectId: pId,
      organizationId: req.user.organizationId
    });

    // If initial stock > 0, log initial ledger entry
    if (newMaterial.currentStock > 0) {
      await MaterialLedger.create({
        organizationId: req.user.organizationId,
        projectId: pId,
        materialId: newMaterial._id,
        type: 'RECEIPT',
        quantity: newMaterial.currentStock,
        referenceId: 'OPENING-STOCK',
        notes: 'Initial opening stock balance entered',
        createdBy: req.user._id
      });
    }

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
    if (!material) return next(new AppError('Material not found', 404));
    res.status(200).json({ status: 'success', data: { material } });
  } catch (error) {
    next(error);
  }
};

export const deleteMaterial = async (req, res, next) => {
  try {
    const material = await Material.findOneAndDelete({
      _id: req.params.materialId,
      organizationId: req.user.organizationId
    });
    if (!material) return next(new AppError('Material not found', 404));
    res.status(200).json({ status: 'success', message: 'Material removed from catalog' });
  } catch (error) {
    next(error);
  }
};

// ==================== GOODS RECEIVED NOTE (GRN) ====================

export const getGRNs = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const grns = await GoodsReceivedNote.find(filter)
      .populate('projectId', 'name projectCode')
      .populate('receivedBy', 'name')
      .populate('approvedBy', 'name')
      .sort('-receivedDate -createdAt');

    res.status(200).json({ status: 'success', data: { grns } });
  } catch (error) {
    next(error);
  }
};

export const createGRN = async (req, res, next) => {
  try {
    const { projectId, supplierName, challanNo, vehicleNo, items, poNumber, inspectionNotes } = req.body;
    if (!items || items.length === 0) {
      return next(new AppError('GRN must include at least one inward line item', 400));
    }

    const count = await GoodsReceivedNote.countDocuments({ organizationId: req.user.organizationId });
    const grnNo = req.body.grnNo || `GRN-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const grn = await GoodsReceivedNote.create({
      organizationId: req.user.organizationId,
      projectId,
      grnNo,
      supplierName,
      challanNo,
      vehicleNo: vehicleNo || '',
      poNumber: poNumber || '',
      items,
      inspectionNotes: inspectionNotes || 'Passed site visual and laboratory quality inspection.',
      status: 'ACCEPTED',
      receivedBy: req.user._id,
      approvedBy: req.user._id
    });

    // Update Material currentStock and create MaterialLedger entries
    for (const item of items) {
      const acceptedQty = Number(item.acceptedQty) || 0;
      if (acceptedQty > 0) {
        if (item.materialId) {
          await Material.findByIdAndUpdate(item.materialId, {
            $inc: { currentStock: acceptedQty }
          });
        }

        await MaterialLedger.create({
          organizationId: req.user.organizationId,
          projectId,
          materialId: item.materialId,
          type: 'RECEIPT',
          quantity: acceptedQty,
          referenceId: grn.grnNo,
          notes: `GRN from ${supplierName} (Challan: ${challanNo})`,
          createdBy: req.user._id
        });
      }
    }

    const populatedGRN = await GoodsReceivedNote.findById(grn._id)
      .populate('projectId', 'name projectCode')
      .populate('receivedBy', 'name');

    res.status(201).json({ status: 'success', data: { grn: populatedGRN } });
  } catch (error) {
    next(error);
  }
};

// ==================== STORE ISSUE SLIPS (CONSUMPTION) ====================

export const getStoreIssues = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const issues = await StoreIssue.find(filter)
      .populate('projectId', 'name projectCode')
      .populate('issuedBy', 'name')
      .sort('-issueDate -createdAt');

    res.status(200).json({ status: 'success', data: { issues } });
  } catch (error) {
    next(error);
  }
};

export const createStoreIssue = async (req, res, next) => {
  try {
    const { projectId, issuedTo, locationGrid, purpose, items, wbsCode } = req.body;
    if (!items || items.length === 0) {
      return next(new AppError('Store Issue slip must include at least one item', 400));
    }

    const count = await StoreIssue.countDocuments({ organizationId: req.user.organizationId });
    const issueSlipNo = req.body.issueSlipNo || `ISS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Verify stock availability
    for (const it of items) {
      const mat = await Material.findById(it.materialId);
      if (!mat) return next(new AppError(`Material "${it.materialName}" not found`, 404));
      if (mat.currentStock < it.issuedQty) {
        return next(new AppError(`Insufficient stock for "${mat.name}". Available: ${mat.currentStock} ${mat.unit}, Requested: ${it.issuedQty} ${mat.unit}`, 400));
      }
    }

    const storeIssue = await StoreIssue.create({
      organizationId: req.user.organizationId,
      projectId,
      issueSlipNo,
      issuedTo,
      locationGrid,
      purpose,
      wbsCode: wbsCode || '',
      items,
      status: 'ISSUED',
      issuedBy: req.user._id
    });

    // Deduct stock and write to MaterialLedger
    for (const it of items) {
      const issuedQty = Number(it.issuedQty) || 0;
      await Material.findByIdAndUpdate(it.materialId, {
        $inc: { currentStock: -issuedQty }
      });

      await MaterialLedger.create({
        organizationId: req.user.organizationId,
        projectId,
        materialId: it.materialId,
        type: 'CONSUMPTION',
        quantity: -issuedQty,
        referenceId: storeIssue.issueSlipNo,
        notes: `Issued to ${issuedTo} for ${purpose} at ${locationGrid}`,
        createdBy: req.user._id
      });
    }

    const populatedIssue = await StoreIssue.findById(storeIssue._id)
      .populate('projectId', 'name projectCode')
      .populate('issuedBy', 'name');

    res.status(201).json({ status: 'success', data: { storeIssue: populatedIssue } });
  } catch (error) {
    next(error);
  }
};

// ==================== MATERIAL INDENTS (SITE REQUISITIONS) ====================

export const getIndents = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const indents = await MaterialIndent.find(filter)
      .populate('projectId', 'name projectCode')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .sort('-requestDate -createdAt');

    res.status(200).json({ status: 'success', data: { indents } });
  } catch (error) {
    next(error);
  }
};

export const createIndent = async (req, res, next) => {
  try {
    const { projectId, requiredByDate, priority, wbsActivity, remarks, items } = req.body;
    const count = await MaterialIndent.countDocuments({ organizationId: req.user.organizationId });
    const indentNo = req.body.indentNo || `IND-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const indent = await MaterialIndent.create({
      organizationId: req.user.organizationId,
      projectId,
      indentNo,
      requiredByDate,
      priority: priority || 'MEDIUM',
      wbsActivity: wbsActivity || '',
      remarks: remarks || '',
      items,
      requestedBy: req.user._id,
      status: 'PENDING_APPROVAL'
    });

    const populatedIndent = await MaterialIndent.findById(indent._id)
      .populate('projectId', 'name projectCode')
      .populate('requestedBy', 'name');

    res.status(201).json({ status: 'success', data: { indent: populatedIndent } });
  } catch (error) {
    next(error);
  }
};

export const approveIndent = async (req, res, next) => {
  try {
    const indent = await MaterialIndent.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      {
        status: 'APPROVED',
        approvedBy: req.user._id,
        approvedAt: new Date()
      },
      { new: true }
    )
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name')
      .populate('projectId', 'name projectCode');

    if (!indent) return next(new AppError('Indent not found', 404));

    res.status(200).json({ status: 'success', data: { indent } });
  } catch (error) {
    next(error);
  }
};

// ==================== LEDGER & STOCK ANALYTICS ====================

export const getLedger = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.materialId) filter.materialId = req.params.materialId;
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const ledger = await MaterialLedger.find(filter)
      .populate('materialId', 'name unit materialCode category')
      .populate('projectId', 'name projectCode')
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
    
    const entry = await MaterialLedger.create({
      organizationId: req.user.organizationId,
      materialId,
      projectId,
      type,
      quantity,
      notes,
      referenceId,
      createdBy: req.user._id
    });

    const material = await Material.findById(materialId);
    if (material) {
      material.currentStock += Number(quantity);
      await material.save();
    }

    res.status(201).json({ status: 'success', data: { entry } });
  } catch (error) {
    next(error);
  }
};

export const getStoreSummary = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const materials = await Material.find(filter);
    const grnCount = await GoodsReceivedNote.countDocuments(filter);
    const issueCount = await StoreIssue.countDocuments(filter);
    const pendingIndents = await MaterialIndent.countDocuments({ ...filter, status: 'PENDING_APPROVAL' });

    let totalValuation = 0;
    let lowStockCount = 0;

    materials.forEach(m => {
      totalValuation += (m.currentStock || 0) * (m.unitPrice || 0);
      if (m.currentStock <= m.minStock) lowStockCount++;
    });

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          totalSKUs: materials.length,
          totalValuation,
          lowStockCount,
          grnCount,
          issueCount,
          pendingIndents
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

