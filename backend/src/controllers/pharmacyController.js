import mongoose from 'mongoose';
import PharmacyMedicine from '../models/PharmacyMedicine.js';
import PharmacyBatch from '../models/PharmacyBatch.js';
import PharmacySupplier from '../models/PharmacySupplier.js';
import PharmacyPurchaseOrder from '../models/PharmacyPurchaseOrder.js';
import PharmacyGRN from '../models/PharmacyGRN.js';
import PharmacySale from '../models/PharmacySale.js';
import PharmacyReturn from '../models/PharmacyReturn.js';
import PharmacyCustomer from '../models/PharmacyCustomer.js';
import PharmacyDebitNote from '../models/PharmacyDebitNote.js';
import PharmacyDisposalLog from '../models/PharmacyDisposalLog.js';
import AppError from '../utils/AppError.js';

// Helper to convert MM/YYYY or YYYY-MM string to end-of-month Date object
function parseExpiryToDate(expStr) {
  if (!expStr) return new Date();
  
  if (expStr.includes('/')) {
    const parts = expStr.split('/');
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      // End of specified month
      return new Date(year, month, 0, 23, 59, 59, 999);
    }
  }

  if (expStr.includes('-')) {
    const parts = expStr.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parts.length === 3 ? parseInt(parts[2], 10) : 0;
      return day > 0 ? new Date(year, month - 1, day, 23, 59, 59) : new Date(year, month, 0, 23, 59, 59);
    }
  }

  const parsed = new Date(expStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

// -------------------------------------------------------------
// MEDICINE MASTER CATALOGUE
// -------------------------------------------------------------

// @desc    Get all medicines for the pharmacy organization
// @route   GET /api/v1/pharmacy/medicines
export const getMedicines = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, scheduleCategory, isColdChain, isChronic } = req.query;

    const query = { organizationId, isDiscontinued: false };

    if (search && search.trim()) {
      const term = search.trim();
      query.$or = [
        { brandName: { $regex: term, $options: 'i' } },
        { genericName: { $regex: term, $options: 'i' } },
        { manufacturer: { $regex: term, $options: 'i' } },
        { hsnCode: { $regex: term, $options: 'i' } },
      ];
    }

    if (scheduleCategory && scheduleCategory !== 'ALL') {
      query.scheduleCategory = scheduleCategory;
    }

    if (isColdChain === 'true') {
      query.isColdChain = true;
    }

    if (isChronic === 'true') {
      query.isChronic = true;
    }

    // Check if tenant has any medicines, if not auto-seed sample medicines for demo
    const count = await PharmacyMedicine.countDocuments({ organizationId });
    if (count === 0) {
      await autoSeedPharmacyDemoData(organizationId);
    }

    const medicines = await PharmacyMedicine.find(query).sort({ brandName: 1 }).lean();

    // Aggregate stock & batch count per medicine
    const medicineIds = medicines.map(m => m._id);
    const batchAggregates = await PharmacyBatch.aggregate([
      { 
        $match: { 
          organizationId, 
          medicineId: { $in: medicineIds }, 
          status: { $in: ['SALEABLE', 'NEAR_EXPIRY'] } 
        } 
      },
      {
        $group: {
          _id: '$medicineId',
          totalStock: { $sum: '$quantityOnHand' },
          batchesCount: { $sum: 1 },
          earliestExpiry: { $min: '$expiryDateObj' }
        }
      }
    ]);

    const batchMap = new Map();
    batchAggregates.forEach(agg => {
      batchMap.set(agg._id.toString(), agg);
    });

    const enriched = medicines.map(med => {
      const agg = batchMap.get(med._id.toString());
      return {
        ...med,
        totalStock: agg ? agg.totalStock : 0,
        batchesCount: agg ? agg.batchesCount : 0,
        earliestExpiry: agg ? agg.earliestExpiry : null
      };
    });

    res.status(200).json({
      status: 'success',
      results: enriched.length,
      data: {
        medicines: enriched
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new medicine in master catalogue
// @route   POST /api/v1/pharmacy/medicines
export const createMedicine = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { 
      brandName, genericName, dosageForm, strength, packSize, 
      unitConversionFactor, manufacturer, scheduleCategory, 
      storageCondition, isColdChain, isChronic, hsnCode, 
      gstRate, reorderLevel, barcode, rackLocation, notes,
      initialBatch // Optional initial stock batch creation
    } = req.body;

    if (!brandName || !genericName) {
      return next(new AppError('Brand Name and Generic Salt Composition are required', 400));
    }

    // Check duplicate brand name in this organization
    const existing = await PharmacyMedicine.findOne({
      organizationId,
      brandName: { $regex: new RegExp(`^${brandName.trim()}$`, 'i') },
      isDiscontinued: false
    });

    if (existing) {
      return next(new AppError(`Medicine with Brand Name "${brandName}" already exists in your catalogue`, 409));
    }

    const medicine = await PharmacyMedicine.create({
      organizationId,
      brandName: brandName.trim(),
      genericName: genericName.trim(),
      dosageForm: dosageForm || 'Tablet',
      strength: strength ? strength.trim() : '',
      packSize: packSize ? packSize.trim() : '10 Tablets / Strip',
      unitConversionFactor: Number(unitConversionFactor) || 1,
      manufacturer: manufacturer ? manufacturer.trim() : 'Generic / Unknown',
      scheduleCategory: scheduleCategory || 'SCHEDULE_H',
      storageCondition: storageCondition || (isColdChain ? 'COLD_CHAIN_2_8' : 'ROOM_TEMPERATURE'),
      isColdChain: Boolean(isColdChain),
      isChronic: Boolean(isChronic),
      hsnCode: hsnCode ? hsnCode.trim() : '30049099',
      gstRate: Number(gstRate) || 12,
      reorderLevel: Number(reorderLevel) || 20,
      barcode: barcode ? barcode.trim() : undefined,
      rackLocation: rackLocation ? rackLocation.trim() : 'Rack A-01',
      notes: notes || ''
    });

    // If initial batch details provided, create the first batch
    let createdBatch = null;
    if (initialBatch && initialBatch.batchNumber && initialBatch.expiryDate) {
      const expDateObj = parseExpiryToDate(initialBatch.expiryDate);
      createdBatch = await PharmacyBatch.create({
        organizationId,
        medicineId: medicine._id,
        batchNumber: initialBatch.batchNumber.trim().toUpperCase(),
        mfgDate: initialBatch.mfgDate || '',
        expiryDate: initialBatch.expiryDate,
        expiryDateObj: expDateObj,
        purchasePrice: Number(initialBatch.purchasePrice) || 0,
        mrp: Number(initialBatch.mrp) || 0,
        sellingPrice: Number(initialBatch.sellingPrice) || Number(initialBatch.mrp) || 0,
        quantityOnHand: Number(initialBatch.quantityOnHand) || 0,
        rackLocation: medicine.rackLocation,
        status: expDateObj < new Date() ? 'EXPIRED' : 'SALEABLE'
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        medicine,
        initialBatch: createdBatch
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get medicine by ID with active batches sorted by FEFO
// @route   GET /api/v1/pharmacy/medicines/:id
export const getMedicineById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const medicine = await PharmacyMedicine.findOne({
      _id: req.params.id,
      organizationId
    }).lean();

    if (!medicine) {
      return next(new AppError('Medicine not found', 404));
    }

    // Fetch batches sorted by FEFO (Earliest Expiry First)
    const batches = await PharmacyBatch.find({
      organizationId,
      medicineId: medicine._id
    }).sort({ expiryDateObj: 1 }).lean();

    res.status(200).json({
      status: 'success',
      data: {
        medicine: {
          ...medicine,
          batches
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update medicine master attributes
// @route   PATCH /api/v1/pharmacy/medicines/:id
export const updateMedicine = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const medicine = await PharmacyMedicine.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return next(new AppError('Medicine not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { medicine }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// BATCH INVENTORY & FEFO CONTROLLER
// -------------------------------------------------------------

// @desc    Get all batches across the pharmacy with filters
// @route   GET /api/v1/pharmacy/inventory/batches
export const getBatches = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, medicineId, search } = req.query;

    const query = { organizationId };

    if (medicineId) {
      query.medicineId = medicineId;
    }

    if (status && status !== 'ALL') {
      if (status === 'NEAR_EXPIRY') {
        // Expiring within next 60 days but not expired yet
        const now = new Date();
        const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
        query.expiryDateObj = { $gte: now, $lte: in60Days };
        query.status = { $ne: 'QUARANTINED' };
      } else if (status === 'EXPIRED') {
        query.$or = [
          { status: 'EXPIRED' },
          { expiryDateObj: { $lte: new Date() } }
        ];
      } else {
        query.status = status;
      }
    }

    let batches = await PharmacyBatch.find(query)
      .populate('medicineId', 'brandName genericName manufacturer dosageForm scheduleCategory hsnCode gstRate')
      .populate('supplierId', 'name phone dlNumber')
      .sort({ expiryDateObj: 1 })
      .lean();

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      batches = batches.filter(b => 
        b.batchNumber?.toLowerCase().includes(term) ||
        b.rackLocation?.toLowerCase().includes(term) ||
        b.medicineId?.brandName?.toLowerCase().includes(term) ||
        b.medicineId?.genericName?.toLowerCase().includes(term)
      );
    }

    const now = Date.now();
    const enriched = batches.map(b => {
      const expTime = new Date(b.expiryDateObj).getTime();
      const daysUntilExpiry = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
      
      let computedStatus = b.status;
      if (b.status !== 'QUARANTINED') {
        if (daysUntilExpiry <= 0) computedStatus = 'EXPIRED';
        else if (daysUntilExpiry <= 60) computedStatus = 'NEAR_EXPIRY';
        else computedStatus = 'SALEABLE';
      }

      return {
        ...b,
        brandName: b.medicineId?.brandName || 'Unknown Brand',
        genericName: b.medicineId?.genericName || '',
        daysUntilExpiry,
        computedStatus
      };
    });

    res.status(200).json({
      status: 'success',
      results: enriched.length,
      data: {
        batches: enriched
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Adjust batch physical count discrepancy
// @route   POST /api/v1/pharmacy/inventory/batches/:id/adjust
export const adjustBatchStock = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { newQuantity, reason, notes } = req.body;

    if (newQuantity === undefined || isNaN(newQuantity) || Number(newQuantity) < 0) {
      return next(new AppError('Valid non-negative stock count is required', 400));
    }

    const batch = await PharmacyBatch.findOne({
      _id: req.params.id,
      organizationId
    });

    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    const previousQty = batch.quantityOnHand;
    batch.quantityOnHand = Number(newQuantity);
    if (notes) batch.notes = `${batch.notes ? batch.notes + ' | ' : ''}Adjustment: ${reason} (from ${previousQty} to ${newQuantity})`;
    await batch.save();

    res.status(200).json({
      status: 'success',
      message: `Stock for batch ${batch.batchNumber} adjusted successfully`,
      data: {
        batch
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle batch quarantine status
// @route   POST /api/v1/pharmacy/inventory/batches/:id/quarantine
export const toggleBatchQuarantine = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const batch = await PharmacyBatch.findOne({
      _id: req.params.id,
      organizationId
    });

    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    if (batch.status === 'QUARANTINED') {
      // Restore to saleable
      batch.status = batch.expiryDateObj < new Date() ? 'EXPIRED' : 'SALEABLE';
      batch.quantityOnHand = batch.quarantineQuantity || batch.quantityOnHand;
      batch.quarantineQuantity = 0;
      batch.rackLocation = 'Rack A-01 (Restored)';
    } else {
      // Quarantine
      batch.quarantineQuantity = batch.quantityOnHand;
      batch.quantityOnHand = 0;
      batch.status = 'QUARANTINED';
      batch.rackLocation = 'Quarantine Bin Q-1';
    }

    await batch.save();

    res.status(200).json({
      status: 'success',
      message: `Batch ${batch.batchNumber} status updated to ${batch.status}`,
      data: { batch }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// SUPPLIERS CONTROLLER
// -------------------------------------------------------------

// @desc    Get authorized distributors
// @route   GET /api/v1/pharmacy/suppliers
export const getSuppliers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const suppliers = await PharmacySupplier.find({ organizationId, isActive: true })
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: suppliers.length,
      data: { suppliers }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new distributor
// @route   POST /api/v1/pharmacy/suppliers
export const createSupplier = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const supplier = await PharmacySupplier.create({
      ...req.body,
      organizationId
    });

    res.status(201).json({
      status: 'success',
      data: { supplier }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// PROCUREMENT: PURCHASE ORDERS (PO) CONTROLLER
// -------------------------------------------------------------

// @desc    Get all purchase orders for organization
// @route   GET /api/v1/pharmacy/purchases/pos
export const getPurchaseOrders = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { status, search } = req.query;

    const query = { organizationId };
    if (status && status !== 'ALL') {
      query.status = status;
    }

    let pos = await PharmacyPurchaseOrder.find(query)
      .populate('supplierId', 'name dlNumber phone email paymentTerms')
      .populate('items.medicineId', 'brandName genericName dosageForm packSize')
      .populate('createdById', 'name')
      .sort({ orderDate: -1 })
      .lean();

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      pos = pos.filter(po => 
        po.poNumber?.toLowerCase().includes(term) ||
        po.supplierId?.name?.toLowerCase().includes(term)
      );
    }

    res.status(200).json({
      status: 'success',
      results: pos.length,
      data: { purchaseOrders: pos }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new purchase order
// @route   POST /api/v1/pharmacy/purchases/pos
export const createPurchaseOrder = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { supplierId, expectedDeliveryDate, items, notes } = req.body;

    if (!supplierId) {
      return next(new AppError('Supplier / Distributor is required', 400));
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Purchase order must contain at least one medicine item', 400));
    }

    // Generate unique PO Number
    const year = new Date().getFullYear();
    const count = await PharmacyPurchaseOrder.countDocuments({ organizationId });
    const poNumber = `PO-${year}-${String(count + 1).padStart(4, '0')}`;

    let totalEstimatedAmount = 0;
    const sanitizedItems = items.map(item => {
      const qty = Number(item.orderQuantity) || 1;
      const price = Number(item.estimatedPurchasePrice) || 0;
      const itemTotal = qty * price;
      totalEstimatedAmount += itemTotal;
      return {
        medicineId: item.medicineId,
        packSize: item.packSize || '10 Tablets / Strip',
        orderQuantity: qty,
        receivedQuantity: 0,
        estimatedPurchasePrice: price,
        estimatedAmount: itemTotal
      };
    });

    const po = await PharmacyPurchaseOrder.create({
      organizationId,
      poNumber,
      supplierId,
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      status: 'ORDERED',
      items: sanitizedItems,
      totalEstimatedAmount,
      notes: notes || '',
      createdById: req.user._id
    });

    const populated = await PharmacyPurchaseOrder.findById(po._id)
      .populate('supplierId', 'name dlNumber phone')
      .populate('items.medicineId', 'brandName genericName dosageForm');

    res.status(201).json({
      status: 'success',
      data: { purchaseOrder: populated }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get PO by ID
// @route   GET /api/v1/pharmacy/purchases/pos/:id
export const getPurchaseOrderById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const po = await PharmacyPurchaseOrder.findOne({ _id: req.params.id, organizationId })
      .populate('supplierId', 'name dlNumber phone email paymentTerms address')
      .populate('items.medicineId', 'brandName genericName dosageForm packSize manufacturer')
      .populate('createdById', 'name')
      .populate('grnIds', 'grnNumber supplierInvoiceNumber grandTotal receivedDate');

    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder: po }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update PO status (e.g. CANCELLED, ORDERED)
// @route   PATCH /api/v1/pharmacy/purchases/pos/:id/status
export const updatePOStatus = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { status } = req.body;

    if (!['DRAFT', 'ORDERED', 'CANCELLED'].includes(status)) {
      return next(new AppError('Invalid status update', 400));
    }

    const po = await PharmacyPurchaseOrder.findOneAndUpdate(
      { _id: req.params.id, organizationId },
      { status },
      { new: true }
    );

    if (!po) {
      return next(new AppError('Purchase order not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { purchaseOrder: po }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// GOODS RECEIVED NOTE (GRN) & STOCK INWARDING CONTROLLER
// -------------------------------------------------------------

// @desc    Get all Goods Received Notes
// @route   GET /api/v1/pharmacy/purchases/grn
export const getGoodsReceivedNotes = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { paymentStatus, search } = req.query;

    const query = { organizationId };
    if (paymentStatus && paymentStatus !== 'ALL') {
      query.paymentStatus = paymentStatus;
    }

    let grns = await PharmacyGRN.find(query)
      .populate('supplierId', 'name dlNumber gstin phone')
      .populate('poId', 'poNumber')
      .populate('verifiedByPharmacistId', 'name')
      .populate('items.medicineId', 'brandName genericName dosageForm')
      .sort({ receivedDate: -1 })
      .lean();

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      grns = grns.filter(g => 
        g.grnNumber?.toLowerCase().includes(term) ||
        g.supplierInvoiceNumber?.toLowerCase().includes(term) ||
        g.supplierId?.name?.toLowerCase().includes(term)
      );
    }

    res.status(200).json({
      status: 'success',
      results: grns.length,
      data: { goodsReceivedNotes: grns }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get GRN by ID
// @route   GET /api/v1/pharmacy/purchases/grn/:id
export const getGRNById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const grn = await PharmacyGRN.findOne({ _id: req.params.id, organizationId })
      .populate('supplierId', 'name dlNumber gstin phone email paymentTerms address')
      .populate('poId', 'poNumber orderDate')
      .populate('verifiedByPharmacistId', 'name')
      .populate('items.medicineId', 'brandName genericName dosageForm packSize manufacturer')
      .populate('items.createdBatchId', 'batchNumber quantityOnHand status rackLocation');

    if (!grn) {
      return next(new AppError('Goods Received Note not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { goodsReceivedNote: grn }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Inward new shipment: Creates GRN + creates or updates batches atomically
// @route   POST /api/v1/pharmacy/purchases/grn
export const createGoodsReceivedNote = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      poId,
      supplierId,
      supplierInvoiceNumber,
      supplierInvoiceDate,
      paymentTerms,
      dueDate,
      items,
      pharmacistNotes
    } = req.body;

    if (!supplierId || !supplierInvoiceNumber || !supplierInvoiceDate) {
      return next(new AppError('Supplier, Invoice Number, and Invoice Date are required', 400));
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('GRN must contain at least one verified medicine batch line', 400));
    }

    // Check duplicate invoice from same supplier in this organization
    const existingGRN = await PharmacyGRN.findOne({
      organizationId,
      supplierId,
      supplierInvoiceNumber: supplierInvoiceNumber.trim()
    });

    if (existingGRN) {
      return next(new AppError(`Supplier Invoice #${supplierInvoiceNumber} has already been inwarded under ${existingGRN.grnNumber}`, 409));
    }

    // Generate GRN Number
    const year = new Date().getFullYear();
    const grnCount = await PharmacyGRN.countDocuments({ organizationId });
    const grnNumber = `GRN-${year}-${String(grnCount + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;

    const processedItems = [];
    const createdBatchIds = [];

    for (const item of items) {
      const qty = Number(item.quantityReceived) || 0;
      const freeQty = Number(item.freeQuantity) || 0;
      const rate = Number(item.purchasePrice) || 0;
      const discPct = Number(item.tradeDiscountPercent) || 0;
      const gstRate = Number(item.gstRate) || 12;
      const mrp = Number(item.mrp) || 0;
      const sellingPrice = Number(item.sellingPrice) || mrp;
      const batchNo = String(item.batchNumber || '').trim().toUpperCase();

      if (!batchNo || !item.expiryDate || qty <= 0) {
        return next(new AppError('Each line must have a valid Batch Number, Expiry Date, and Received Qty > 0', 400));
      }

      const lineGross = qty * rate;
      const lineDisc = lineGross * (discPct / 100);
      const lineTaxable = lineGross - lineDisc;
      const lineGst = lineTaxable * (gstRate / 100);
      const lineNet = lineTaxable + lineGst;

      subtotal += lineGross;
      discountTotal += lineDisc;
      taxTotal += lineGst;
      grandTotal += lineNet;

      const expDateObj = parseExpiryToDate(item.expiryDate);

      // Inward or Increment Batch in PharmacyBatch
      let batch = await PharmacyBatch.findOne({
        organizationId,
        medicineId: item.medicineId,
        batchNumber: batchNo
      });

      const totalPhysicalInward = qty + freeQty;

      if (batch) {
        batch.quantityOnHand += totalPhysicalInward;
        batch.purchasePrice = rate;
        batch.mrp = mrp;
        batch.sellingPrice = sellingPrice;
        if (item.rackLocation) batch.rackLocation = item.rackLocation;
        if (expDateObj > new Date() && batch.status === 'EXPIRED') {
          batch.status = 'SALEABLE';
        }
        await batch.save();
      } else {
        batch = await PharmacyBatch.create({
          organizationId,
          medicineId: item.medicineId,
          supplierId,
          batchNumber: batchNo,
          mfgDate: item.mfgDate || '',
          expiryDate: item.expiryDate,
          expiryDateObj: expDateObj,
          purchasePrice: rate,
          mrp,
          sellingPrice,
          quantityOnHand: totalPhysicalInward,
          quarantineQuantity: 0,
          rackLocation: item.rackLocation || 'Rack A-01',
          status: expDateObj < new Date() ? 'EXPIRED' : 'SALEABLE'
        });
      }

      createdBatchIds.push(batch._id);

      processedItems.push({
        medicineId: item.medicineId,
        batchNumber: batchNo,
        mfgDate: item.mfgDate || '',
        expiryDate: item.expiryDate,
        expiryDateObj: expDateObj,
        quantityReceived: qty,
        freeQuantity: freeQty,
        purchasePrice: rate,
        tradeDiscountPercent: discPct,
        gstRate,
        mrp,
        sellingPrice,
        rackLocation: item.rackLocation || batch.rackLocation,
        totalCost: Math.round(lineTaxable * 100) / 100,
        gstAmount: Math.round(lineGst * 100) / 100,
        netAmount: Math.round(lineNet * 100) / 100,
        createdBatchId: batch._id
      });
    }

    let calculatedDueDate = dueDate ? new Date(dueDate) : null;
    if (!calculatedDueDate) {
      const days = paymentTerms === 'NET_30' ? 30 : paymentTerms === 'NET_15' ? 15 : paymentTerms === 'NET_60' ? 60 : 21;
      calculatedDueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const grn = await PharmacyGRN.create({
      organizationId,
      grnNumber,
      poId: poId || undefined,
      supplierId,
      supplierInvoiceNumber: supplierInvoiceNumber.trim(),
      supplierInvoiceDate: new Date(supplierInvoiceDate),
      receivedDate: new Date(),
      paymentTerms: paymentTerms || 'NET_21',
      dueDate: calculatedDueDate,
      status: 'VERIFIED_AND_INWARDED',
      items: processedItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      verifiedByPharmacistId: req.user._id,
      pharmacistNotes: pharmacistNotes || ''
    });

    // Update batch records with grnId
    await PharmacyBatch.updateMany(
      { _id: { $in: createdBatchIds } },
      { $set: { grnId: grn._id } }
    );

    // If linked to a PO, update received quantities & status
    if (poId) {
      const po = await PharmacyPurchaseOrder.findOne({ _id: poId, organizationId });
      if (po) {
        let allFulfilled = true;
        po.items.forEach(poItem => {
          const matchingReceived = processedItems.filter(
            pi => pi.medicineId.toString() === poItem.medicineId.toString()
          );
          const totalReceivedForMed = matchingReceived.reduce((acc, curr) => acc + curr.quantityReceived, 0);
          poItem.receivedQuantity = (poItem.receivedQuantity || 0) + totalReceivedForMed;
          if (poItem.receivedQuantity < poItem.orderQuantity) {
            allFulfilled = false;
          }
        });
        po.status = allFulfilled ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
        if (!po.grnIds) po.grnIds = [];
        po.grnIds.push(grn._id);
        await po.save();
      }
    }

    const populatedGRN = await PharmacyGRN.findById(grn._id)
      .populate('supplierId', 'name dlNumber phone')
      .populate('items.medicineId', 'brandName genericName dosageForm')
      .populate('verifiedByPharmacistId', 'name');

    res.status(201).json({
      status: 'success',
      message: `Shipment successfully inwarded under ${grnNumber}. ${processedItems.length} batches updated in live stock.`,
      data: { goodsReceivedNote: populatedGRN }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record partial or full payment against GRN invoice
// @route   POST /api/v1/pharmacy/purchases/grn/:id/payment
export const recordGRNPayment = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { amount } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return next(new AppError('Valid payment amount is required', 400));
    }

    const grn = await PharmacyGRN.findOne({ _id: req.params.id, organizationId });
    if (!grn) {
      return next(new AppError('Goods Received Note not found', 404));
    }

    const newPaid = (grn.paidAmount || 0) + payAmount;
    grn.paidAmount = Math.round(newPaid * 100) / 100;
    if (grn.paidAmount >= grn.grandTotal) {
      grn.paymentStatus = 'PAID';
    } else {
      grn.paymentStatus = 'PARTIALLY_PAID';
    }

    await grn.save();

    res.status(200).json({
      status: 'success',
      message: `Recorded payment of ₹${payAmount.toFixed(2)}. Status: ${grn.paymentStatus}`,
      data: { goodsReceivedNote: grn }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// POINT OF SALE & INVOICING CONTROLLER
// -------------------------------------------------------------

// @desc    Get all counter sales with filtering
// @route   GET /api/v1/pharmacy/sales
export const getSales = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { scheduleCategory, paymentMethod, startDate, endDate, search } = req.query;

    const query = { organizationId };

    if (scheduleCategory && scheduleCategory !== 'ALL') {
      query.highestSchedule = scheduleCategory;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      query['payment.method'] = paymentMethod;
    }

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.saleDate.$lte = eDate;
      }
    }

    let sales = await PharmacySale.find(query)
      .populate('items.medicineId', 'brandName genericName dosageForm')
      .populate('pharmacistId', 'name')
      .sort({ saleDate: -1 })
      .lean();

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      sales = sales.filter(s => 
        s.billNumber?.toLowerCase().includes(term) ||
        s.customer?.name?.toLowerCase().includes(term) ||
        s.customer?.phone?.includes(term) ||
        s.doctor?.name?.toLowerCase().includes(term)
      );
    }

    res.status(200).json({
      status: 'success',
      results: sales.length,
      data: { sales }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new counter sale & atomically decrement batch inventory
// @route   POST /api/v1/pharmacy/sales
export const createSale = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      customer,
      doctor,
      items,
      payment,
      notes
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Counter sale must contain at least one medicine item', 400));
    }

    // Generate unique Bill Number
    const year = new Date().getFullYear();
    const count = await PharmacySale.countDocuments({ organizationId });
    const billNumber = `RX-${year}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let discountTotal = 0;
    let taxTotal = 0;
    let isSchedulePrescription = false;
    let highestSchedule = 'OTC';

    const scheduleRank = { 'OTC': 0, 'SCHEDULE_H': 1, 'SCHEDULE_H1': 2, 'SCHEDULE_X': 3 };

    const processedItems = [];

    // Atomically verify & decrement batches
    for (const item of items) {
      const qty = Number(item.quantity) || 1;
      const unitPrice = Number(item.unitPrice) || 0;
      const discPct = Number(item.discountPercent) || 0;
      const gstRate = Number(item.gstRate) || 12;

      // Find batch (supports batchId ObjectId or batchNumber fallback)
      let batch = null;
      if (item.batchId && mongoose.Types.ObjectId.isValid(item.batchId)) {
        batch = await PharmacyBatch.findOne({
          _id: item.batchId,
          organizationId
        });
      }
      if (!batch && (item.batchNumber || item.batchNo)) {
        batch = await PharmacyBatch.findOne({
          batchNumber: item.batchNumber || item.batchNo,
          organizationId
        });
      }

      if (!batch) {
        return next(new AppError(`Batch not found for ${item.brandName || 'item'}. Check batch number.`, 404));
      }

      if (batch.status === 'QUARANTINED') {
        return next(new AppError(`Batch ${batch.batchNumber} is QUARANTINED and strictly barred from sale`, 422));
      }

      if (batch.expiryDateObj <= new Date()) {
        return next(new AppError(`Batch ${batch.batchNumber} expired on ${batch.expiryDate} and cannot be dispensed`, 422));
      }

      if (batch.quantityOnHand < qty) {
        return next(new AppError(`Insufficient stock in Batch ${batch.batchNumber}. Available: ${batch.quantityOnHand}, Requested: ${qty}`, 400));
      }

      // Decrement stock
      batch.quantityOnHand -= qty;
      if (batch.quantityOnHand === 0) {
        batch.status = 'DEPLETED';
      }
      await batch.save();

      const lineGross = qty * unitPrice;
      const lineDisc = lineGross * (discPct / 100);
      const lineTaxable = lineGross - lineDisc;
      const lineTax = lineTaxable * (gstRate / 100);
      const lineTotal = lineTaxable + lineTax;

      subtotal += lineGross;
      discountTotal += lineDisc;
      taxTotal += lineTax;

      const sched = item.scheduleCategory || 'OTC';
      if ((scheduleRank[sched] || 0) > (scheduleRank[highestSchedule] || 0)) {
        highestSchedule = sched;
      }
      if (sched !== 'OTC') {
        isSchedulePrescription = true;
      }

      processedItems.push({
        medicineId: batch.medicineId || item.medicineId,
        batchId: batch._id,
        brandName: item.brandName || batch.brandName || 'Medicine',
        genericName: item.genericName || batch.genericName || '',
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        quantity: qty,
        unitPrice,
        discountPercent: discPct,
        discountAmount: Math.round(lineDisc * 100) / 100,
        taxableAmount: Math.round(lineTaxable * 100) / 100,
        gstRate,
        gstAmount: Math.round(lineTax * 100) / 100,
        totalAmount: Math.round(lineTotal * 100) / 100,
        scheduleCategory: sched,
        rackLocation: batch.rackLocation
      });
    }

    const unroundedGrand = subtotal - discountTotal + taxTotal;
    const roundedGrand = Math.round(unroundedGrand);
    const roundOff = Math.round((roundedGrand - unroundedGrand) * 100) / 100;

    // Check Khata store credit limit if payment method is KHATA
    let linkedCustomer = null;
    const custPhone = customer?.phone?.trim();
    if (custPhone) {
      linkedCustomer = await PharmacyCustomer.findOne({ organizationId, phone: custPhone });
    }

    if (payment?.method === 'KHATA') {
      if (!linkedCustomer) {
        return next(new AppError(`Patient account with phone ${custPhone || 'N/A'} was not found in Customer Directory. Please register patient first to extend Khata credit.`, 400));
      }
      if (!linkedCustomer.khata?.isEnabled) {
        return next(new AppError(`Khata store credit is not enabled for ${linkedCustomer.name}. Enable Khata in patient profile first.`, 400));
      }
      const currentBal = linkedCustomer.khata?.currentBalance || 0;
      const creditLimit = linkedCustomer.khata?.creditLimit || 5000;
      if (currentBal + roundedGrand > creditLimit) {
        return next(new AppError(`Khata credit limit of ₹${creditLimit} exceeded for ${linkedCustomer.name}. Current balance: ₹${currentBal}, This bill: ₹${roundedGrand} (Total would be ₹${currentBal + roundedGrand}).`, 422));
      }
    }

    const sale = await PharmacySale.create({
      organizationId,
      billNumber,
      saleDate: new Date(),
      customer: {
        name: customer?.name?.trim() || 'Walk-in Customer',
        phone: customer?.phone?.trim() || '',
        age: customer?.age ? Number(customer.age) : undefined,
        gender: customer?.gender || 'UNKNOWN',
        address: customer?.address || ''
      },
      doctor: {
        name: doctor?.name?.trim() || 'Walk-in / OTC',
        registrationNumber: doctor?.registrationNumber?.trim() || '',
        hospitalClinic: doctor?.hospitalClinic?.trim() || '',
        prescriptionDate: doctor?.prescriptionDate ? new Date(doctor.prescriptionDate) : undefined
      },
      rxVerified: Boolean(doctor?.registrationNumber || isSchedulePrescription),
      items: processedItems,
      pricing: {
        subtotal: Math.round(subtotal * 100) / 100,
        discountTotal: Math.round(discountTotal * 100) / 100,
        taxTotal: Math.round(taxTotal * 100) / 100,
        roundOff,
        grandTotal: roundedGrand
      },
      payment: {
        method: payment?.method || 'UPI',
        status: payment?.method === 'KHATA' ? 'UNPAID' : 'PAID',
        amountReceived: payment?.amountReceived || roundedGrand,
        changeReturned: payment?.changeReturned || 0,
        referenceNumber: payment?.referenceNumber || ''
      },
      highestSchedule,
      isSchedulePrescription,
      pharmacistId: req.user._id,
      pharmacistName: req.user.name || 'Rahul Roy (WB-48291)',
      status: 'COMPLETED',
      notes: notes || ''
    });

    // Update customer's Khata ledger and chronic refill schedule
    if (linkedCustomer) {
      if (payment?.method === 'KHATA') {
        linkedCustomer.khata.currentBalance = Math.round(((linkedCustomer.khata.currentBalance || 0) + roundedGrand) * 100) / 100;
        linkedCustomer.ledger.push({
          transactionDate: new Date(),
          type: 'DEBIT_SALE',
          amount: roundedGrand,
          balanceAfter: linkedCustomer.khata.currentBalance,
          billNumber,
          saleId: sale._id,
          paymentMethod: 'KHATA',
          notes: `Counter POS Sale ${billNumber}`,
          recordedById: req.user._id
        });
      }

      // Check if chronic medications match
      let chronicUpdated = false;
      if (linkedCustomer.chronicMedications && linkedCustomer.chronicMedications.length > 0) {
        linkedCustomer.chronicMedications.forEach(cm => {
          const matched = processedItems.find(pi =>
            (cm.medicineId && pi.medicineId && cm.medicineId.toString() === pi.medicineId.toString()) ||
            (cm.brandName && pi.brandName && pi.brandName.toLowerCase().includes(cm.brandName.toLowerCase()))
          );
          if (matched) {
            cm.lastRefillDate = new Date();
            const days = cm.daysSupply || 30;
            cm.nextRefillDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            chronicUpdated = true;
          }
        });
      }

      if (payment?.method === 'KHATA' || chronicUpdated) {
        await linkedCustomer.save();
      }
    }

    res.status(201).json({
      status: 'success',
      message: `Invoice ${billNumber} generated successfully. Stock deducted from active batches.${payment?.method === 'KHATA' ? ` Debited ₹${roundedGrand} to ${linkedCustomer?.name}'s Khata account.` : ''}`,
      data: { sale }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single sale by ID
// @route   GET /api/v1/pharmacy/sales/:id
export const getSaleById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const sale = await PharmacySale.findOne({ _id: req.params.id, organizationId })
      .populate('items.medicineId', 'brandName genericName dosageForm manufacturer hsnCode')
      .populate('pharmacistId', 'name licenseNumber');

    if (!sale) {
      return next(new AppError('Sales invoice not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { sale }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Schedule H / H1 / X Statutory Drug Register
// @route   GET /api/v1/pharmacy/sales/schedule-register
export const getScheduleRegister = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { schedule, startDate, endDate, doctor } = req.query;

    const query = { 
      organizationId,
      isSchedulePrescription: true 
    };

    if (schedule && schedule !== 'ALL') {
      query.highestSchedule = schedule;
    }

    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
        query.saleDate.$lte = eDate;
      }
    }

    if (doctor && doctor.trim()) {
      query['doctor.name'] = { $regex: doctor.trim(), $options: 'i' };
    }

    const sales = await PharmacySale.find(query)
      .populate('items.medicineId', 'brandName genericName manufacturer')
      .populate('pharmacistId', 'name licenseNumber')
      .sort({ saleDate: -1 })
      .lean();

    const registerRows = [];
    sales.forEach(s => {
      s.items.forEach(item => {
        if (item.scheduleCategory !== 'OTC') {
          registerRows.push({
            saleId: s._id,
            billNumber: s.billNumber,
            date: s.saleDate,
            patientName: s.customer?.name,
            patientAge: s.customer?.age,
            patientAddress: s.customer?.address || 'Local Chemist Area',
            doctorName: s.doctor?.name,
            doctorRegNo: s.doctor?.registrationNumber || 'N/A',
            brandName: item.brandName,
            genericName: item.genericName,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            quantityDispensed: item.quantity,
            scheduleCategory: item.scheduleCategory,
            pharmacistName: s.pharmacistName
          });
        }
      });
    });

    res.status(200).json({
      status: 'success',
      results: registerRows.length,
      data: { registerRows }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// CUSTOMER SALES RETURNS & REFUNDS CONTROLLER
// -------------------------------------------------------------

// @desc    Get all customer sales returns
// @route   GET /api/v1/pharmacy/sales/returns
export const getSalesReturns = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const returns = await PharmacyReturn.find({ organizationId })
      .populate('items.medicineId', 'brandName genericName dosageForm')
      .populate('pharmacistId', 'name')
      .sort({ returnDate: -1 })
      .lean();

    res.status(200).json({
      status: 'success',
      results: returns.length,
      data: { returns }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process customer sales return and re-inward or quarantine stock
// @route   POST /api/v1/pharmacy/sales/returns
export const createSalesReturn = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      originalSaleId,
      items,
      refundMode,
      pharmacistNotes
    } = req.body;

    if (!originalSaleId || !items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Original sale reference and return item lines are required', 400));
    }

    const sale = await PharmacySale.findOne({ _id: originalSaleId, organizationId });
    if (!sale) {
      return next(new AppError('Original sales invoice not found', 404));
    }

    const year = new Date().getFullYear();
    const count = await PharmacyReturn.countDocuments({ organizationId });
    const returnNumber = `RET-${year}-${String(count + 1).padStart(4, '0')}`;

    let totalRefundAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const returnQty = Number(item.quantityReturned) || 1;
      const unitPrice = Number(item.unitRefundPrice) || 0;
      const refund = returnQty * unitPrice;
      totalRefundAmount += refund;

      const batch = await PharmacyBatch.findOne({ _id: item.batchId, organizationId });
      if (batch) {
        if (item.action === 'RETURN_TO_SHELF') {
          if (batch.expiryDateObj > new Date() && batch.status !== 'QUARANTINED') {
            batch.quantityOnHand += returnQty;
            if (batch.status === 'DEPLETED') batch.status = 'SALEABLE';
          } else {
            batch.quarantineQuantity += returnQty;
          }
        } else {
          batch.quarantineQuantity += returnQty;
        }
        await batch.save();
      }

      processedItems.push({
        medicineId: item.medicineId,
        batchId: item.batchId,
        brandName: item.brandName,
        batchNumber: item.batchNumber,
        quantityReturned: returnQty,
        unitRefundPrice: unitPrice,
        refundAmount: refund,
        action: item.action || 'RETURN_TO_SHELF',
        reason: item.reason || 'PATIENT_RECOVERY_EXCESS'
      });
    }

    const salesReturn = await PharmacyReturn.create({
      organizationId,
      returnNumber,
      originalSaleId: sale._id,
      originalBillNumber: sale.billNumber,
      returnDate: new Date(),
      customer: sale.customer,
      items: processedItems,
      totalRefundAmount: Math.round(totalRefundAmount * 100) / 100,
      refundMode: refundMode || 'CASH',
      pharmacistId: req.user._id,
      pharmacistNotes: pharmacistNotes || ''
    });

    sale.status = 'PARTIALLY_RETURNED';
    await sale.save();

    res.status(201).json({
      status: 'success',
      message: `Customer return ${returnNumber} processed. Refund: ₹${totalRefundAmount.toFixed(2)}`,
      data: { salesReturn }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// DASHBOARD ANALYTICS
// -------------------------------------------------------------

// @desc    Get pharmacy live operational KPIs and inventory valuations
// @route   GET /api/v1/pharmacy/dashboard
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    // Check count and seed if zero
    const medCount = await PharmacyMedicine.countDocuments({ organizationId });
    if (medCount === 0) {
      await autoSeedPharmacyDemoData(organizationId);
    }

    const now = new Date();
    const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      medicinesTotal,
      batchesAll,
      suppliersCount,
      payablesAgg,
      pendingPOsCount,
      todaySalesAgg,
      recentSales,
      khataAgg,
      refillDueCount
    ] = await Promise.all([
      PharmacyMedicine.countDocuments({ organizationId, isDiscontinued: false }),
      PharmacyBatch.find({ organizationId }).lean(),
      PharmacySupplier.countDocuments({ organizationId, isActive: true }),
      PharmacyGRN.aggregate([
        { $match: { organizationId, paymentStatus: { $ne: 'PAID' } } },
        { $group: { _id: null, totalDue: { $sum: { $subtract: ['$grandTotal', '$paidAmount'] } }, count: { $sum: 1 } } }
      ]),
      PharmacyPurchaseOrder.countDocuments({ organizationId, status: { $in: ['ORDERED', 'PARTIALLY_RECEIVED'] } }),
      PharmacySale.aggregate([
        { $match: { organizationId, saleDate: { $gte: todayStart } } },
        { $group: { _id: null, totalSales: { $sum: '$pricing.grandTotal' }, count: { $sum: 1 } } }
      ]),
      PharmacySale.find({ organizationId }).sort({ saleDate: -1 }).limit(5).lean(),
      PharmacyCustomer.aggregate([
        { $match: { organizationId, 'khata.isEnabled': true, 'khata.currentBalance': { $gt: 0 } } },
        { $group: { _id: null, totalKhata: { $sum: '$khata.currentBalance' }, count: { $sum: 1 } } }
      ]),
      PharmacyCustomer.countDocuments({
        organizationId,
        'chronicMedications.nextRefillDate': { $lte: in60Days }
      })
    ]);

    let totalCostValuation = 0;
    let totalMrpValuation = 0;
    let totalUnitsInStock = 0;
    let quarantinedCount = 0;
    let expiredCount = 0;
    let nearExpiryCount = 0;

    batchesAll.forEach(b => {
      const activeUnits = b.status === 'QUARANTINED' ? b.quarantineQuantity : b.quantityOnHand;
      totalUnitsInStock += activeUnits;
      totalCostValuation += activeUnits * b.purchasePrice;
      totalMrpValuation += activeUnits * b.mrp;

      if (b.status === 'QUARANTINED') {
        quarantinedCount += 1;
      }

      if (b.expiryDateObj <= now) {
        expiredCount += 1;
      } else if (b.expiryDateObj <= in60Days) {
        nearExpiryCount += 1;
      }
    });

    const supplierPayablesTotal = payablesAgg.length > 0 ? Math.round(payablesAgg[0].totalDue * 100) / 100 : 0;
    const unpaidInvoicesCount = payablesAgg.length > 0 ? payablesAgg[0].count : 0;
    const todayGrossSales = todaySalesAgg.length > 0 ? todaySalesAgg[0].totalSales : 0;
    const todayBillsCount = todaySalesAgg.length > 0 ? todaySalesAgg[0].count : 0;
    const totalKhataReceivables = khataAgg.length > 0 ? Math.round(khataAgg[0].totalKhata * 100) / 100 : 0;
    const khataDebtorsCount = khataAgg.length > 0 ? khataAgg[0].count : 0;

    res.status(200).json({
      status: 'success',
      data: {
        medicinesTotal,
        batchesTotal: batchesAll.length,
        totalUnitsInStock,
        totalCostValuation,
        totalMrpValuation,
        estimatedGrossMargin: totalMrpValuation > 0 ? (((totalMrpValuation - totalCostValuation) / totalMrpValuation) * 100).toFixed(1) : '24.0',
        nearExpiryCount,
        expiredCount,
        quarantinedCount,
        suppliersCount,
        supplierPayablesTotal,
        unpaidInvoicesCount,
        pendingPOsCount,
        todayGrossSales,
        todayBillsCount,
        totalKhataReceivables,
        khataDebtorsCount,
        refillDueCount,
        recentSales
      }
    });
  } catch (error) {
    next(error);
  }
};

// -------------------------------------------------------------
// SEED INITIAL PHARMACY DEMO DATA IF WORKSPACE IS EMPTY
// -------------------------------------------------------------
async function autoSeedPharmacyDemoData(organizationId) {
  try {
    // 1. Create Demo Suppliers
    const supplier1 = await PharmacySupplier.create({
      organizationId,
      name: 'Bengal Drug House',
      dlNumber: 'Form 20B/21B-WB-4819',
      gstin: '19AABCB1234F1Z1',
      contactPerson: 'Amitabh Sen',
      phone: '9830112233',
      email: 'sales@bengaldrug.com',
      paymentTermsDays: 21,
      outstandingBalance: 64200
    });

    const supplier2 = await PharmacySupplier.create({
      organizationId,
      name: 'Medopharm Wholesale Distributors',
      dlNumber: 'Form 20B/21B-WB-9012',
      gstin: '19XYZPA9988H1Z8',
      contactPerson: 'Rajesh Sharma',
      phone: '9831998877',
      email: 'orders@medopharm.in',
      paymentTermsDays: 30,
      outstandingBalance: 48200
    });

    // 2. Create Standard Retail Medicines
    const m1 = await PharmacyMedicine.create({
      organizationId,
      brandName: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      dosageForm: 'Tablet',
      strength: '625mg',
      packSize: '10 Tablets / Strip',
      manufacturer: 'GlaxoSmithKline',
      scheduleCategory: 'SCHEDULE_H',
      storageCondition: 'ROOM_TEMPERATURE',
      hsnCode: '30041010',
      gstRate: 12,
      reorderLevel: 25,
      rackLocation: 'Rack A-02'
    });

    const m2 = await PharmacyMedicine.create({
      organizationId,
      brandName: 'Telma 40 Tablets',
      genericName: 'Telmisartan 40mg',
      dosageForm: 'Tablet',
      strength: '40mg',
      packSize: '15 Tablets / Strip',
      manufacturer: 'Glenmark Pharmaceuticals',
      scheduleCategory: 'SCHEDULE_H',
      storageCondition: 'ROOM_TEMPERATURE',
      isChronic: true,
      hsnCode: '30049099',
      gstRate: 12,
      reorderLevel: 30,
      rackLocation: 'Rack B-04'
    });

    const m3 = await PharmacyMedicine.create({
      organizationId,
      brandName: 'Pan 40 Tablet',
      genericName: 'Pantoprazole 40mg',
      dosageForm: 'Tablet',
      strength: '40mg',
      packSize: '15 Tablets / Strip',
      manufacturer: 'Alkem Laboratories',
      scheduleCategory: 'SCHEDULE_H',
      hsnCode: '30049099',
      gstRate: 12,
      reorderLevel: 30,
      rackLocation: 'Rack B-01'
    });

    const m4 = await PharmacyMedicine.create({
      organizationId,
      brandName: 'Azithral 500 Tablet',
      genericName: 'Azithromycin 500mg',
      dosageForm: 'Tablet',
      strength: '500mg',
      packSize: '5 Tablets / Strip',
      manufacturer: 'Alembic Pharmaceuticals',
      scheduleCategory: 'SCHEDULE_H1',
      hsnCode: '30042099',
      gstRate: 12,
      reorderLevel: 20,
      rackLocation: 'Rack A-05'
    });

    const m5 = await PharmacyMedicine.create({
      organizationId,
      brandName: 'Crocin 650 Advance',
      genericName: 'Paracetamol 650mg Fast Release',
      dosageForm: 'Tablet',
      strength: '650mg',
      packSize: '15 Tablets / Strip',
      manufacturer: 'GlaxoSmithKline',
      scheduleCategory: 'OTC',
      hsnCode: '30049060',
      gstRate: 12,
      reorderLevel: 50,
      rackLocation: 'Rack OTC-01'
    });

    const m6 = await PharmacyMedicine.create({
      organizationId,
      brandName: 'Human Mixtard 30/70',
      genericName: 'Biphasic Isophane Insulin Injection (3ml)',
      dosageForm: 'Injection',
      strength: '100 IU/ml',
      packSize: '1 Penfill Cartridge',
      manufacturer: 'Novo Nordisk',
      scheduleCategory: 'SCHEDULE_H',
      storageCondition: 'COLD_CHAIN_2_8',
      isColdChain: true,
      isChronic: true,
      hsnCode: '30043110',
      gstRate: 5,
      reorderLevel: 15,
      rackLocation: 'Fridge F-01 (3.8°C)'
    });

    // 3. Create Sample Batches with FEFO and Expiry Tiers
    // Batch 1: Augmentin near expiry (Nov 2026)
    await PharmacyBatch.create({
      organizationId,
      medicineId: m1._id,
      batchNumber: 'AUG24018',
      mfgDate: '03/2024',
      expiryDate: '11/2026',
      expiryDateObj: parseExpiryToDate('11/2026'),
      purchasePrice: 162.00,
      mrp: 204.50,
      sellingPrice: 204.50,
      quantityOnHand: 42,
      rackLocation: 'Rack A-02',
      supplierId: supplier2._id,
      status: 'NEAR_EXPIRY'
    });

    // Batch 2: Augmentin fresher batch (Apr 2027)
    await PharmacyBatch.create({
      organizationId,
      medicineId: m1._id,
      batchNumber: 'AUG24089',
      mfgDate: '08/2024',
      expiryDate: '04/2027',
      expiryDateObj: parseExpiryToDate('04/2027'),
      purchasePrice: 162.00,
      mrp: 204.50,
      sellingPrice: 204.50,
      quantityOnHand: 120,
      rackLocation: 'Rack A-02',
      supplierId: supplier2._id,
      status: 'SALEABLE'
    });

    // Batch 3: Telma 40
    await PharmacyBatch.create({
      organizationId,
      medicineId: m2._id,
      batchNumber: 'TLM2409',
      mfgDate: '01/2024',
      expiryDate: '12/2026',
      expiryDateObj: parseExpiryToDate('12/2026'),
      purchasePrice: 110.00,
      mrp: 142.00,
      sellingPrice: 142.00,
      quantityOnHand: 60,
      rackLocation: 'Rack B-04',
      supplierId: supplier1._id,
      status: 'NEAR_EXPIRY'
    });

    // Batch 4: Pan 40
    await PharmacyBatch.create({
      organizationId,
      medicineId: m3._id,
      batchNumber: 'PAN2477',
      mfgDate: '07/2024',
      expiryDate: '08/2027',
      expiryDateObj: parseExpiryToDate('08/2027'),
      purchasePrice: 120.00,
      mrp: 155.00,
      sellingPrice: 155.00,
      quantityOnHand: 180,
      rackLocation: 'Rack B-01',
      supplierId: supplier1._id,
      status: 'SALEABLE'
    });

    // Batch 5: Azithral 500
    await PharmacyBatch.create({
      organizationId,
      medicineId: m4._id,
      batchNumber: 'AZI2411',
      mfgDate: '02/2024',
      expiryDate: '02/2027',
      expiryDateObj: parseExpiryToDate('02/2027'),
      purchasePrice: 92.00,
      mrp: 121.50,
      sellingPrice: 121.50,
      quantityOnHand: 55,
      rackLocation: 'Rack A-05',
      supplierId: supplier2._id,
      status: 'SALEABLE'
    });

    // Batch 6: Crocin 650
    await PharmacyBatch.create({
      organizationId,
      medicineId: m5._id,
      batchNumber: 'CRO2490',
      mfgDate: '10/2024',
      expiryDate: '10/2027',
      expiryDateObj: parseExpiryToDate('10/2027'),
      purchasePrice: 24.50,
      mrp: 32.00,
      sellingPrice: 32.00,
      quantityOnHand: 300,
      rackLocation: 'Rack OTC-01',
      supplierId: supplier1._id,
      status: 'SALEABLE'
    });

    // Batch 7: Human Mixtard (Cold chain)
    await PharmacyBatch.create({
      organizationId,
      medicineId: m6._id,
      batchNumber: 'MIX2404',
      mfgDate: '05/2024',
      expiryDate: '05/2027',
      expiryDateObj: parseExpiryToDate('05/2027'),
      purchasePrice: 185.00,
      mrp: 235.00,
      sellingPrice: 235.00,
      quantityOnHand: 28,
      rackLocation: 'Fridge F-01 (3.8°C)',
      supplierId: supplier2._id,
      status: 'SALEABLE'
    });

    console.log(`[Pharmacy OS] Auto-seeded demo medicine master and batches for organization: ${organizationId}`);

    // Auto-seed Demo Chronic Patients & Khata accounts if empty
    const custCount = await PharmacyCustomer.countDocuments({ organizationId });
    if (custCount === 0) {
      const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const in25Days = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
      const overdue2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      // Customer 1: Suresh Ganguly (Hypertension + Diabetes)
      await PharmacyCustomer.create({
        organizationId,
        name: 'Suresh Ganguly',
        phone: '9830012345',
        age: 48,
        gender: 'MALE',
        address: 'Block B, Lake Gardens, Kolkata - 700045',
        bloodGroup: 'B+',
        allergies: ['Penicillin'],
        chronicConditions: ['HYPERTENSION', 'DIABETES'],
        preferredDoctor: {
          name: 'Dr. A. K. Banerjee (MD)',
          registrationNumber: 'WBMC-38291',
          hospitalClinic: 'Apollo Clinic, South Kolkata',
          phone: '9830199882'
        },
        chronicMedications: [
          {
            medicineId: m1._id,
            brandName: 'Augmentin 625 Duo',
            dosage: '1 Tablet Twice Daily',
            dailyFrequency: '1-0-1',
            daysSupply: 10,
            lastRefillDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            nextRefillDate: in3Days,
            notes: 'Post-dental extraction course'
          },
          {
            medicineId: m2._id,
            brandName: 'Telma 40 Tablets',
            dosage: '1 Tablet Daily Morning',
            dailyFrequency: '1-0-0',
            daysSupply: 30,
            lastRefillDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            nextRefillDate: in25Days,
            notes: 'Essential hypertension maintenance'
          }
        ],
        khata: {
          isEnabled: true,
          creditLimit: 5000,
          currentBalance: 412.00,
          status: 'ACTIVE'
        },
        ledger: [
          {
            transactionDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
            type: 'DEBIT_SALE',
            amount: 412.00,
            balanceAfter: 412.00,
            billNumber: 'RX-2026-0001',
            paymentMethod: 'KHATA',
            notes: 'Counter POS Dispensing RX-2026-0001'
          }
        ],
        notes: 'Regular customer since 2021. Always pays Khata on 1st of month.'
      });

      // Customer 2: Anjali Sharma (Cardiac & Hypertension) - DUE FOR REFILL
      await PharmacyCustomer.create({
        organizationId,
        name: 'Anjali Sharma',
        phone: '9832233445',
        age: 62,
        gender: 'FEMALE',
        address: '54 Gariahat Road, Ballygunge, Kolkata - 700019',
        bloodGroup: 'O+',
        allergies: ['Sulfa drugs'],
        chronicConditions: ['CARDIAC', 'HYPERTENSION'],
        preferredDoctor: {
          name: 'Dr. P. Roy (Cardiologist)',
          registrationNumber: 'WBMC-21049',
          hospitalClinic: 'Rabindranath Tagore International Institute',
          phone: '9831002211'
        },
        chronicMedications: [
          {
            medicineId: m2._id,
            brandName: 'Telma 40 Tablets',
            dosage: '1 Tablet Daily Morning',
            dailyFrequency: '1-0-0',
            daysSupply: 30,
            lastRefillDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
            nextRefillDate: overdue2Days,
            notes: 'Cardiac BP maintenance'
          }
        ],
        khata: {
          isEnabled: true,
          creditLimit: 10000,
          currentBalance: 2380.00,
          status: 'ACTIVE'
        },
        ledger: [
          {
            transactionDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
            type: 'DEBIT_SALE',
            amount: 2380.00,
            balanceAfter: 2380.00,
            billNumber: 'RX-2026-0839',
            paymentMethod: 'KHATA',
            notes: 'Monthly chronic medicine bundle'
          }
        ],
        notes: 'Senior citizen. Prefers home delivery with digital Khata invoice.'
      });

      // Customer 3: Subir Chakraborty (Antibiotics / General)
      await PharmacyCustomer.create({
        organizationId,
        name: 'Subir Chakraborty',
        phone: '9831122334',
        age: 52,
        gender: 'MALE',
        address: 'Salt Lake Sector 1, Kolkata - 700064',
        bloodGroup: 'A+',
        chronicConditions: ['HYPERTENSION'],
        preferredDoctor: {
          name: 'Dr. R. Sengupta (MBBS)',
          registrationNumber: 'WBMC-49102',
          hospitalClinic: 'AMRI Hospital, Dhakuria'
        },
        chronicMedications: [
          {
            medicineId: m4._id,
            brandName: 'Azithral 500 Tablet',
            dosage: '1 Tablet Daily After Dinner',
            dailyFrequency: '0-0-1',
            daysSupply: 5,
            lastRefillDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
            nextRefillDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
          }
        ],
        khata: {
          isEnabled: true,
          creditLimit: 5000,
          currentBalance: 0,
          status: 'ACTIVE'
        },
        ledger: [
          {
            transactionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            type: 'CREDIT_PAYMENT',
            amount: 1500.00,
            balanceAfter: 0,
            paymentMethod: 'UPI',
            referenceNumber: 'UPI/9831122334@okaxis',
            notes: 'Cleared previous balance in full'
          }
        ]
      });

      // Customer 4: Mita Debnath (OTC Customer)
      await PharmacyCustomer.create({
        organizationId,
        name: 'Mita Debnath',
        phone: '9836677889',
        age: 34,
        gender: 'FEMALE',
        address: 'College Street, Kolkata - 700073',
        chronicConditions: ['OTHER'],
        khata: {
          isEnabled: false,
          creditLimit: 0,
          currentBalance: 0
        },
        notes: 'Walk-in cash customer.'
      });

      console.log(`[Pharmacy OS] Auto-seeded demo patients with Khata ledgers and chronic refills.`);
    }

  } catch (err) {
    console.error('[Pharmacy OS] Auto-seed error:', err.message);
  }
}

// -------------------------------------------------------------
// PATIENT DIRECTORY, CHRONIC BOOK & KHATA CREDIT CONTROLLER
// -------------------------------------------------------------

// @desc    Get all pharmacy patients with multi-criteria filters
// @route   GET /api/v1/pharmacy/customers
export const getCustomers = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { search, chronicCondition, khataStatus, refillStatus } = req.query;

    const query = { organizationId };

    if (chronicCondition && chronicCondition !== 'ALL') {
      query.chronicConditions = chronicCondition;
    }

    if (khataStatus && khataStatus !== 'ALL') {
      if (khataStatus === 'HAS_BALANCE') {
        query['khata.currentBalance'] = { $gt: 0 };
      } else if (khataStatus === 'ENABLED') {
        query['khata.isEnabled'] = true;
      } else if (khataStatus === 'BLOCKED') {
        query['khata.status'] = 'BLOCKED';
      }
    }

    let customers = await PharmacyCustomer.find(query)
      .populate('chronicMedications.medicineId', 'brandName dosageForm packSize manufacturer')
      .sort({ updatedAt: -1 });

    // Transform to plain objects with virtuals
    let customerList = customers.map(c => c.toObject());

    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      customerList = customerList.filter(c =>
        c.name?.toLowerCase().includes(term) ||
        c.phone?.includes(term) ||
        c.address?.toLowerCase().includes(term) ||
        c.preferredDoctor?.name?.toLowerCase().includes(term)
      );
    }

    if (refillStatus && refillStatus !== 'ALL') {
      customerList = customerList.filter(c => c.refillStatus === refillStatus);
    }

    // Compute summary analytics
    let totalKhataReceivables = 0;
    let totalPatientsWithKhata = 0;
    let totalChronicPatients = 0;
    let dueForRefillCount = 0;

    customerList.forEach(c => {
      if (c.khata?.isEnabled) {
        totalPatientsWithKhata += 1;
        totalKhataReceivables += (c.khata.currentBalance || 0);
      }
      if (c.chronicConditions && c.chronicConditions.length > 0) {
        totalChronicPatients += 1;
      }
      if (c.refillStatus === 'DUE_SOON' || c.refillStatus === 'OVERDUE') {
        dueForRefillCount += 1;
      }
    });

    res.status(200).json({
      status: 'success',
      results: customerList.length,
      summary: {
        totalPatients: customerList.length,
        totalKhataReceivables: Math.round(totalKhataReceivables * 100) / 100,
        totalPatientsWithKhata,
        totalChronicPatients,
        dueForRefillCount
      },
      data: { customers: customerList }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient profile with ledger audit trail
// @route   GET /api/v1/pharmacy/customers/:id
export const getCustomerById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const customer = await PharmacyCustomer.findOne({ _id: req.params.id, organizationId })
      .populate('chronicMedications.medicineId', 'brandName genericName dosageForm packSize strength')
      .populate('ledger.recordedById', 'name');

    if (!customer) {
      return next(new AppError('Patient profile not found', 404));
    }

    const obj = customer.toObject();
    if (obj.ledger && obj.ledger.length > 0) {
      obj.ledger.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));
    }

    res.status(200).json({
      status: 'success',
      data: { customer: obj }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register new patient profile
// @route   POST /api/v1/pharmacy/customers
export const createCustomer = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      phone,
      email,
      age,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicConditions,
      preferredDoctor,
      chronicMedications,
      khata,
      initialBalance,
      notes
    } = req.body;

    if (!name || !phone) {
      return next(new AppError('Patient Name and Mobile Phone are required', 400));
    }

    const existing = await PharmacyCustomer.findOne({ organizationId, phone: phone.trim() });
    if (existing) {
      return next(new AppError(`A patient with phone ${phone.trim()} already exists: ${existing.name}`, 400));
    }

    // Process chronic medications
    const processedMedications = [];
    if (chronicMedications && Array.isArray(chronicMedications)) {
      chronicMedications.forEach(m => {
        if (m.brandName) {
          const days = Number(m.daysSupply) || 30;
          const lastRefill = m.lastRefillDate ? new Date(m.lastRefillDate) : new Date();
          const nextRefill = m.nextRefillDate ? new Date(m.nextRefillDate) : new Date(lastRefill.getTime() + days * 24 * 60 * 60 * 1000);
          processedMedications.push({
            medicineId: m.medicineId || undefined,
            brandName: m.brandName.trim(),
            dosage: m.dosage || '1 Tablet Daily',
            dailyFrequency: m.dailyFrequency || '1-0-0',
            daysSupply: days,
            lastRefillDate: lastRefill,
            nextRefillDate: nextRefill,
            notes: m.notes || ''
          });
        }
      });
    }

    const initBal = Number(initialBalance) || 0;
    const ledger = [];
    if (initBal > 0) {
      ledger.push({
        transactionDate: new Date(),
        type: 'ADJUSTMENT_DEBIT',
        amount: initBal,
        balanceAfter: initBal,
        paymentMethod: 'NONE',
        notes: 'Opening Khata credit balance brought forward',
        recordedById: req.user._id
      });
    }

    const customer = await PharmacyCustomer.create({
      organizationId,
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim(),
      age: age ? Number(age) : undefined,
      gender: gender || 'UNKNOWN',
      address: address?.trim(),
      bloodGroup: bloodGroup?.trim(),
      allergies: Array.isArray(allergies) ? allergies : [],
      chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : [],
      preferredDoctor: preferredDoctor || {},
      chronicMedications: processedMedications,
      khata: {
        isEnabled: Boolean(khata?.isEnabled || initBal > 0),
        creditLimit: Number(khata?.creditLimit) || 5000,
        currentBalance: initBal,
        status: khata?.status || 'ACTIVE'
      },
      ledger,
      notes: notes || ''
    });

    res.status(201).json({
      status: 'success',
      message: `Patient profile for ${customer.name} created successfully.`,
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update patient demographic and chronic medication profile
// @route   PATCH /api/v1/pharmacy/customers/:id
export const updateCustomer = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      phone,
      email,
      age,
      gender,
      address,
      bloodGroup,
      allergies,
      chronicConditions,
      preferredDoctor,
      chronicMedications,
      khata,
      notes,
      isActive
    } = req.body;

    const customer = await PharmacyCustomer.findOne({ _id: req.params.id, organizationId });
    if (!customer) {
      return next(new AppError('Patient profile not found', 404));
    }

    if (name) customer.name = name.trim();
    if (phone) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email?.trim();
    if (age !== undefined) customer.age = age ? Number(age) : undefined;
    if (gender) customer.gender = gender;
    if (address !== undefined) customer.address = address?.trim();
    if (bloodGroup !== undefined) customer.bloodGroup = bloodGroup?.trim();
    if (allergies) customer.allergies = allergies;
    if (chronicConditions) customer.chronicConditions = chronicConditions;
    if (preferredDoctor) customer.preferredDoctor = preferredDoctor;
    if (notes !== undefined) customer.notes = notes;
    if (isActive !== undefined) customer.isActive = isActive;

    if (khata) {
      if (khata.isEnabled !== undefined) customer.khata.isEnabled = khata.isEnabled;
      if (khata.creditLimit !== undefined) customer.khata.creditLimit = Number(khata.creditLimit);
      if (khata.status) customer.khata.status = khata.status;
    }

    if (chronicMedications && Array.isArray(chronicMedications)) {
      customer.chronicMedications = chronicMedications.map(m => {
        const days = Number(m.daysSupply) || 30;
        const lastRefill = m.lastRefillDate ? new Date(m.lastRefillDate) : new Date();
        const nextRefill = m.nextRefillDate ? new Date(m.nextRefillDate) : new Date(lastRefill.getTime() + days * 24 * 60 * 60 * 1000);
        return {
          medicineId: m.medicineId || undefined,
          brandName: m.brandName.trim(),
          dosage: m.dosage || '1 Tablet Daily',
          dailyFrequency: m.dailyFrequency || '1-0-0',
          daysSupply: days,
          lastRefillDate: lastRefill,
          nextRefillDate: nextRefill,
          notes: m.notes || ''
        };
      });
    }

    await customer.save();

    res.status(200).json({
      status: 'success',
      message: 'Patient profile updated successfully',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record patient Khata credit repayment
// @route   POST /api/v1/pharmacy/customers/:id/khata-payment
export const recordKhataPayment = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { amount, paymentMethod, referenceNumber, notes } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return next(new AppError('Valid repayment amount is required', 400));
    }

    const customer = await PharmacyCustomer.findOne({ _id: req.params.id, organizationId });
    if (!customer) {
      return next(new AppError('Patient profile not found', 404));
    }

    const previousBal = customer.khata.currentBalance || 0;
    const newBal = Math.round(Math.max(0, previousBal - payAmount) * 100) / 100;
    customer.khata.currentBalance = newBal;

    customer.ledger.push({
      transactionDate: new Date(),
      type: 'CREDIT_PAYMENT',
      amount: payAmount,
      balanceAfter: newBal,
      paymentMethod: paymentMethod || 'CASH',
      referenceNumber: referenceNumber || '',
      notes: notes || `Khata repayment received via ${paymentMethod || 'CASH'}`,
      recordedById: req.user._id
    });

    await customer.save();

    res.status(200).json({
      status: 'success',
      message: `Repayment of ₹${payAmount.toFixed(2)} recorded for ${customer.name}. New outstanding balance: ₹${newBal.toFixed(2)}`,
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patients due for chronic medication refills with direct WhatsApp messaging payload
// @route   GET /api/v1/pharmacy/customers/refill-alerts
export const getRefillAlerts = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const customers = await PharmacyCustomer.find({
      organizationId,
      'chronicMedications.0': { $exists: true }
    })
    .populate('chronicMedications.medicineId', 'brandName dosageForm packSize')
    .sort({ 'chronicMedications.nextRefillDate': 1 })
    .lean();

    const alerts = [];
    const now = Date.now();

    customers.forEach(c => {
      const dueMeds = c.chronicMedications.filter(m => m.nextRefillDate && new Date(m.nextRefillDate) <= in7Days);
      if (dueMeds.length > 0) {
        dueMeds.forEach(med => {
          const expTime = new Date(med.nextRefillDate).getTime();
          const daysLeft = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
          
          const medNames = dueMeds.map(m => m.brandName).join(', ');
          const waText = encodeURIComponent(
            `Hello ${c.name}, this is a reminder from ApexCare Pharmacy. Your scheduled monthly chronic refill for ${medNames} is due ${daysLeft <= 0 ? 'today' : `in ${daysLeft} days`}. Please reply to have your medicines prepared for pickup or home delivery.`
          );
          const waUrl = c.phone ? `https://wa.me/91${c.phone.replace(/\D/g, '')}?text=${waText}` : null;

          alerts.push({
            customerId: c._id,
            customerName: c.name,
            phone: c.phone,
            chronicConditions: c.chronicConditions || [],
            medicineBrand: med.brandName,
            dosage: med.dosage,
            daysSupply: med.daysSupply,
            lastRefillDate: med.lastRefillDate,
            nextRefillDate: med.nextRefillDate,
            daysLeft,
            status: daysLeft < 0 ? 'OVERDUE' : daysLeft === 0 ? 'DUE_TODAY' : 'DUE_SOON',
            preferredDoctor: c.preferredDoctor?.name,
            khataBalance: c.khata?.isEnabled ? c.khata.currentBalance : null,
            whatsAppUrl: waUrl
          });
        });
      }
    });

    res.status(200).json({
      status: 'success',
      results: alerts.length,
      data: { refillAlerts: alerts }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// PHASE 6: EXPIRY MANAGEMENT & SUPPLIER RETURNS (DEBIT NOTES / CLAIMS)
// ==========================================

// @desc    Get all supplier debit notes (claims) with search, filters & summary metrics
// @route   GET /api/v1/pharmacy/debit-notes
export const getDebitNotes = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const { supplierId, status, returnType, search } = req.query;

    let query = { organizationId };

    if (supplierId && mongoose.isValidObjectId(supplierId)) {
      query.supplierId = supplierId;
    }
    if (status && status !== 'ALL') {
      query.status = status;
    }
    if (returnType && returnType !== 'ALL') {
      query.returnType = returnType;
    }
    if (search) {
      query.$or = [
        { debitNoteNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
        { 'items.brandName': { $regex: search, $options: 'i' } },
        { 'items.batchNumber': { $regex: search, $options: 'i' } },
        { 'settlement.creditNoteNumber': { $regex: search, $options: 'i' } }
      ];
    }

    const [debitNotes, summaryAgg] = await Promise.all([
      PharmacyDebitNote.find(query)
        .populate('supplierId', 'name dlNumber gstin phone email address')
        .populate('issuedById', 'name email')
        .populate('settlement.adjustedGrnId', 'grnNumber grandTotal supplierInvoiceNumber')
        .sort({ debitNoteDate: -1 })
        .lean(),
      PharmacyDebitNote.aggregate([
        { $match: { organizationId } },
        {
          $group: {
            _id: null,
            totalCount: { $sum: 1 },
            totalClaimAmount: { $sum: '$grandTotal' },
            pendingClaimsAmount: {
              $sum: {
                $cond: [{ $in: ['$status', ['ISSUED', 'SENT_TO_SUPPLIER', 'ACKNOWLEDGED']] }, '$grandTotal', 0]
              }
            },
            settledClaimsAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'SETTLED'] }, '$grandTotal', 0]
              }
            },
            pendingCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['ISSUED', 'SENT_TO_SUPPLIER', 'ACKNOWLEDGED']] }, 1, 0]
              }
            },
            settledCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'SETTLED'] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const summary = summaryAgg.length > 0 ? summaryAgg[0] : {
      totalCount: 0,
      totalClaimAmount: 0,
      pendingClaimsAmount: 0,
      settledClaimsAmount: 0,
      pendingCount: 0,
      settledCount: 0
    };

    res.status(200).json({
      status: 'success',
      results: debitNotes.length,
      summary,
      data: { debitNotes }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single debit note by ID
// @route   GET /api/v1/pharmacy/debit-notes/:id
export const getDebitNoteById = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const debitNote = await PharmacyDebitNote.findOne({
      _id: req.params.id,
      organizationId
    })
      .populate('supplierId', 'name dlNumber gstin phone email address')
      .populate('issuedById', 'name email')
      .populate('settlement.adjustedGrnId', 'grnNumber grandTotal supplierInvoiceNumber supplierInvoiceDate')
      .lean();

    if (!debitNote) {
      return next(new AppError('Debit Note not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { debitNote }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Supplier Debit Note (Claim)
// @route   POST /api/v1/pharmacy/debit-notes
export const createDebitNote = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      supplierId,
      returnType = 'EXPIRY_RETURN',
      items,
      pharmacistNotes,
      status = 'ISSUED'
    } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError('Supplier and at least one return item are required', 400));
    }

    const supplier = await PharmacySupplier.findOne({ _id: supplierId, organizationId });
    if (!supplier) {
      return next(new AppError('Supplier not found', 404));
    }

    // Generate unique sequential debit note number
    const count = await PharmacyDebitNote.countDocuments({ organizationId });
    const year = new Date().getFullYear();
    const debitNoteNumber = `DN-${year}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let taxTotal = 0;
    let grandTotal = 0;
    let totalQuantity = 0;
    const processedItems = [];

    // Process each item and adjust batch stock atomically
    for (const item of items) {
      const batch = await PharmacyBatch.findOne({
        _id: item.batchId,
        organizationId
      });

      if (!batch) {
        return next(new AppError(`Batch ${item.batchNumber || item.batchId} not found`, 404));
      }

      const returnQty = Number(item.quantityReturned);
      if (isNaN(returnQty) || returnQty <= 0) {
        return next(new AppError(`Invalid return quantity for batch ${batch.batchNumber}`, 400));
      }

      const availableQty = (batch.status === 'QUARANTINED' ? (batch.quarantineQuantity || 0) : (batch.quantityOnHand || 0));
      if (returnQty > availableQty) {
        return next(new AppError(`Return quantity (${returnQty}) exceeds available units (${availableQty}) for batch ${batch.batchNumber}`, 400));
      }

      const unitPrice = Number(item.unitPurchasePrice || batch.purchasePrice || 0);
      const gstRate = Number(item.gstRate !== undefined ? item.gstRate : 12);
      const taxable = Math.round(returnQty * unitPrice * 100) / 100;
      const gst = Math.round((taxable * (gstRate / 100)) * 100) / 100;
      const totalClaim = Math.round((taxable + gst) * 100) / 100;

      subtotal += taxable;
      taxTotal += gst;
      grandTotal += totalClaim;
      totalQuantity += returnQty;

      // Deduct stock from batch
      if (batch.status === 'QUARANTINED') {
        batch.quarantineQuantity = Math.max(0, (batch.quarantineQuantity || 0) - returnQty);
      } else {
        batch.quantityOnHand = Math.max(0, batch.quantityOnHand - returnQty);
      }

      if ((batch.quantityOnHand + (batch.quarantineQuantity || 0)) <= 0) {
        batch.status = 'RETURNED_TO_SUPPLIER';
      }

      batch.notes = `${batch.notes ? batch.notes + ' | ' : ''}Returned ${returnQty} units via ${debitNoteNumber}`;
      await batch.save();

      processedItems.push({
        medicineId: batch.medicineId,
        brandName: item.brandName || 'Medicine',
        genericName: item.genericName || '',
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        expiryDateObj: batch.expiryDateObj,
        quantityReturned: returnQty,
        unitPurchasePrice: unitPrice,
        gstRate,
        taxableAmount: taxable,
        gstAmount: gst,
        totalClaimAmount: totalClaim,
        reason: item.reason || 'EXPIRED_STOCK'
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;
    grandTotal = Math.round(grandTotal * 100) / 100;

    // Supplier balance reduction: pharmacy claims money back, reducing what we owe distributor
    supplier.outstandingBalance = Math.max(0, (supplier.outstandingBalance || 0) - grandTotal);
    await supplier.save();

    const debitNote = await PharmacyDebitNote.create({
      organizationId,
      debitNoteNumber,
      supplierId: supplier._id,
      supplierName: supplier.name,
      supplierGstin: supplier.gstin || '',
      supplierDlNumber: supplier.dlNumber || '',
      returnType,
      status,
      items: processedItems,
      totalQuantity,
      subtotal,
      taxTotal,
      grandTotal,
      settlement: {
        settlementType: 'PENDING',
        settledAmount: 0
      },
      pharmacistNotes: pharmacistNotes || '',
      issuedById: req.user._id
    });

    res.status(201).json({
      status: 'success',
      message: `Debit Note ${debitNoteNumber} generated successfully for ₹${grandTotal.toFixed(2)}`,
      data: { debitNote }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Settle or update status of a Supplier Debit Note
// @route   PUT /api/v1/pharmacy/debit-notes/:id/settle
export const settleDebitNote = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      settlementType, // 'ADJUSTED_AGAINST_GRN', 'REFUND_RECEIVED', 'REPLACED_WITH_FRESH_STOCK', 'WRITTEN_OFF'
      creditNoteNumber,
      creditNoteDate,
      adjustedGrnId,
      settledAmount,
      settlementNotes,
      status = 'SETTLED'
    } = req.body;

    const debitNote = await PharmacyDebitNote.findOne({
      _id: req.params.id,
      organizationId
    });

    if (!debitNote) {
      return next(new AppError('Debit note not found', 404));
    }

    const finalSettledAmount = Number(settledAmount !== undefined ? settledAmount : debitNote.grandTotal);

    debitNote.status = status;
    debitNote.settlement = {
      settlementType: settlementType || 'ADJUSTED_AGAINST_GRN',
      settledAmount: finalSettledAmount,
      creditNoteNumber: creditNoteNumber || '',
      creditNoteDate: creditNoteDate ? new Date(creditNoteDate) : new Date(),
      adjustedGrnId: adjustedGrnId && mongoose.isValidObjectId(adjustedGrnId) ? adjustedGrnId : undefined,
      settlementDate: new Date(),
      settlementNotes: settlementNotes || ''
    };

    // If knocking off against an unpaid GRN invoice
    if (settlementType === 'ADJUSTED_AGAINST_GRN' && adjustedGrnId && mongoose.isValidObjectId(adjustedGrnId)) {
      const grn = await PharmacyGRN.findOne({ _id: adjustedGrnId, organizationId });
      if (grn) {
        grn.paidAmount = Math.min(grn.grandTotal, (grn.paidAmount || 0) + finalSettledAmount);
        if (grn.paidAmount >= grn.grandTotal) {
          grn.paymentStatus = 'PAID';
        } else if (grn.paidAmount > 0) {
          grn.paymentStatus = 'PARTIALLY_PAID';
        }
        grn.pharmacistNotes = `${grn.pharmacistNotes ? grn.pharmacistNotes + ' | ' : ''}Offset ₹${finalSettledAmount} via Debit Note ${debitNote.debitNoteNumber}`;
        await grn.save();
      }
    }

    await debitNote.save();

    res.status(200).json({
      status: 'success',
      message: `Debit Note ${debitNote.debitNoteNumber} settled successfully`,
      data: { debitNote }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Statutory Destruction / Disposal Register logs
// @route   GET /api/v1/pharmacy/disposals
export const getDisposalLogs = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const logs = await PharmacyDisposalLog.find({ organizationId })
      .populate('pharmacistId', 'name email')
      .sort({ disposalDate: -1 })
      .lean();

    const summaryAgg = await PharmacyDisposalLog.aggregate([
      { $match: { organizationId } },
      {
        $group: {
          _id: null,
          totalDisposals: { $sum: 1 },
          totalUnitsDisposed: { $sum: '$quantityDisposed' },
          totalLossAmount: { $sum: '$totalLoss' }
        }
      }
    ]);

    const summary = summaryAgg.length > 0 ? summaryAgg[0] : {
      totalDisposals: 0,
      totalUnitsDisposed: 0,
      totalLossAmount: 0
    };

    res.status(200).json({
      status: 'success',
      results: logs.length,
      summary,
      data: { disposals: logs }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new certified disposal / destruction log
// @route   POST /api/v1/pharmacy/disposals
export const createDisposalLog = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      batchId,
      quantityDisposed,
      method = 'INCINERATION_BIOMEDICAL_AGENCY',
      agencyName = 'Medicare Bio-Waste Solutions Pvt Ltd',
      agencyCertificateNumber = '',
      witnessedBy = '',
      remarks = ''
    } = req.body;

    if (!batchId || !quantityDisposed || Number(quantityDisposed) <= 0) {
      return next(new AppError('Batch and valid disposal quantity are required', 400));
    }

    const batch = await PharmacyBatch.findOne({ _id: batchId, organizationId });
    if (!batch) {
      return next(new AppError('Batch not found', 404));
    }

    const qty = Number(quantityDisposed);
    const available = batch.status === 'QUARANTINED' ? (batch.quarantineQuantity || 0) : batch.quantityOnHand;
    if (qty > available) {
      return next(new AppError(`Disposal quantity (${qty}) exceeds available stock (${available})`, 400));
    }

    const count = await PharmacyDisposalLog.countDocuments({ organizationId });
    const year = new Date().getFullYear();
    const disposalNumber = `DISP-${year}-${String(count + 1).padStart(4, '0')}`;

    const totalLoss = Math.round(qty * (batch.purchasePrice || 0) * 100) / 100;

    // Deduct stock from batch
    if (batch.status === 'QUARANTINED') {
      batch.quarantineQuantity = Math.max(0, (batch.quarantineQuantity || 0) - qty);
    } else {
      batch.quantityOnHand = Math.max(0, batch.quantityOnHand - qty);
    }

    if ((batch.quantityOnHand + (batch.quarantineQuantity || 0)) <= 0) {
      batch.status = 'DEPLETED';
    }

    batch.notes = `${batch.notes ? batch.notes + ' | ' : ''}Certified destruction of ${qty} units via ${disposalNumber}`;
    await batch.save();

    const log = await PharmacyDisposalLog.create({
      organizationId,
      disposalNumber,
      batchId: batch._id,
      medicineId: batch.medicineId,
      brandName: batch.brandName || 'Medicine',
      genericName: batch.genericName || '',
      batchNumber: batch.batchNumber,
      expiryDate: batch.expiryDate,
      quantityDisposed: qty,
      unitCost: batch.purchasePrice || 0,
      totalLoss,
      method,
      agencyName,
      agencyCertificateNumber,
      witnessedBy: witnessedBy || `${req.user.name || 'Rahul Roy'} (WB-Reg Pharmacist)`,
      pharmacistId: req.user._id,
      remarks
    });

    res.status(201).json({
      status: 'success',
      message: `Disposal recorded: ${disposalNumber} for ${qty} units (Loss: ₹${totalLoss.toFixed(2)})`,
      data: { disposal: log }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get comprehensive expiry surveillance & claim analytics
// @route   GET /api/v1/pharmacy/inventory/expiry-analytics
export const getBatchExpiryAnalytics = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const now = new Date();
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    const [batches, debitNotesAgg, disposalsAgg] = await Promise.all([
      PharmacyBatch.find({ organizationId })
        .populate('supplierId', 'name phone dlNumber gstin')
        .populate('medicineId', 'brandName genericName dosageForm')
        .lean(),
      PharmacyDebitNote.aggregate([
        { $match: { organizationId } },
        {
          $group: {
            _id: null,
            totalClaimsCount: { $sum: 1 },
            totalClaimAmount: { $sum: '$grandTotal' },
            pendingClaimsAmount: {
              $sum: {
                $cond: [{ $in: ['$status', ['ISSUED', 'SENT_TO_SUPPLIER', 'ACKNOWLEDGED']] }, '$grandTotal', 0]
              }
            },
            settledClaimsAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'SETTLED'] }, '$grandTotal', 0]
              }
            }
          }
        }
      ]),
      PharmacyDisposalLog.aggregate([
        { $match: { organizationId } },
        {
          $group: {
            _id: null,
            totalDisposals: { $sum: 1 },
            totalUnitsDisposed: { $sum: '$quantityDisposed' },
            totalLoss: { $sum: '$totalLoss' }
          }
        }
      ])
    ]);

    let expiredLoss = 0;
    let expiredUnits = 0;
    let criticalValue = 0;
    let criticalUnits = 0;
    let nearExpiryValue = 0;
    let nearExpiryUnits = 0;
    let watchlistValue = 0;
    let watchlistUnits = 0;
    let quarantinedUnits = 0;
    let quarantinedValue = 0;

    const classifiedBatches = batches.map(b => {
      const expDate = new Date(b.expiryDateObj);
      const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const activeUnits = b.status === 'QUARANTINED' ? (b.quarantineQuantity || 0) : (b.quantityOnHand || 0);
      const totalCost = Math.round(activeUnits * (b.purchasePrice || 0) * 100) / 100;

      let tier = 'HEALTHY';
      if (b.status === 'QUARANTINED') {
        tier = 'QUARANTINED';
        quarantinedUnits += activeUnits;
        quarantinedValue += totalCost;
      } else if (daysUntilExpiry <= 0 || b.status === 'EXPIRED') {
        tier = 'EXPIRED';
        expiredUnits += activeUnits;
        expiredLoss += totalCost;
      } else if (daysUntilExpiry <= 30) {
        tier = 'CRITICAL_30';
        criticalUnits += activeUnits;
        criticalValue += totalCost;
      } else if (daysUntilExpiry <= 60) {
        tier = 'NEAR_60';
        nearExpiryUnits += activeUnits;
        nearExpiryValue += totalCost;
      } else if (daysUntilExpiry <= 90) {
        tier = 'WATCHLIST_90';
        watchlistUnits += activeUnits;
        watchlistValue += totalCost;
      }

      return {
        ...b,
        brandName: b.medicineId?.brandName || b.brandName || 'Medicine',
        genericName: b.medicineId?.genericName || b.genericName || '',
        dosageForm: b.medicineId?.dosageForm || 'Tablet',
        daysUntilExpiry,
        tier,
        activeUnits,
        totalCost
      };
    });

    const debitSummary = debitNotesAgg.length > 0 ? debitNotesAgg[0] : {
      totalClaimsCount: 0,
      totalClaimAmount: 0,
      pendingClaimsAmount: 0,
      settledClaimsAmount: 0
    };

    const disposalSummary = disposalsAgg.length > 0 ? disposalsAgg[0] : {
      totalDisposals: 0,
      totalUnitsDisposed: 0,
      totalLoss: 0
    };

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          expiredLoss: Math.round(expiredLoss * 100) / 100,
          expiredUnits,
          criticalValue: Math.round(criticalValue * 100) / 100,
          criticalUnits,
          nearExpiryValue: Math.round(nearExpiryValue * 100) / 100,
          nearExpiryUnits,
          watchlistValue: Math.round(watchlistValue * 100) / 100,
          watchlistUnits,
          quarantinedUnits,
          quarantinedValue: Math.round(quarantinedValue * 100) / 100,
          claims: debitSummary,
          disposals: disposalSummary
        },
        batches: classifiedBatches
      }
    });
  } catch (error) {
    next(error);
  }
};


