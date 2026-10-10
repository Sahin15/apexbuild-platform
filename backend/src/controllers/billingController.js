import Measurement from '../models/Measurement.js';
import RABill from '../models/RABill.js';
import BOQItem from '../models/BOQItem.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

// Helper to sync BOQItem completedQuantity with all verified/billed measurements
const syncBOQItemProgress = async (boqItemId) => {
  try {
    const agg = await Measurement.aggregate([
      { $match: { boqItemId, status: { $in: ['VERIFIED', 'BILLED'] } } },
      { $group: { _id: '$boqItemId', total: { $sum: '$quantity' } } }
    ]);
    const totalQty = agg.length > 0 ? Number(agg[0].total.toFixed(3)) : 0;
    const boqItem = await BOQItem.findById(boqItemId);
    if (boqItem) {
      boqItem.completedQuantity = totalQty;
      boqItem.remainingQuantity = Math.max(0, Number((boqItem.quantity - totalQty).toFixed(3)));
      await boqItem.save();
    }
  } catch (err) {
    console.error('Error syncing BOQ item progress:', err);
  }
};

export const getMeasurements = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) filter.projectId = req.params.projectId || req.query.projectId;
    if (req.query.status && req.query.status !== 'ALL') filter.status = req.query.status;
    if (req.query.boqItemId) filter.boqItemId = req.query.boqItemId;

    const measurements = await Measurement.find(filter)
      .populate('projectId', 'name projectCode')
      .populate('boqItemId', 'itemCode description unit rate quantity completedQuantity remainingQuantity')
      .populate('measuredBy', 'name email')
      .populate('verifiedBy', 'name email')
      .sort('-date -createdAt');

    res.status(200).json({ status: 'success', data: { measurements } });
  } catch (error) {
    next(error);
  }
};

export const getMeasurementSummary = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.query.projectId) filter.projectId = req.query.projectId;

    const measurements = await Measurement.find(filter).populate('boqItemId', 'rate unit');

    let totalEntries = measurements.length;
    let pendingCount = 0;
    let verifiedCount = 0;
    let billedCount = 0;
    let draftCount = 0;
    let totalVerifiedVal = 0;
    let totalVerifiedQty = 0;

    measurements.forEach(m => {
      const rate = m.boqItemId?.rate || 0;
      if (m.status === 'DRAFT') draftCount++;
      else if (m.status === 'PENDING') pendingCount++;
      else if (m.status === 'VERIFIED') {
        verifiedCount++;
        totalVerifiedQty += m.quantity || 0;
        totalVerifiedVal += (m.quantity || 0) * rate;
      } else if (m.status === 'BILLED') {
        billedCount++;
        totalVerifiedQty += m.quantity || 0;
        totalVerifiedVal += (m.quantity || 0) * rate;
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalEntries,
        draftCount,
        pendingCount,
        verifiedCount,
        billedCount,
        totalVerifiedQty: Number(totalVerifiedQty.toFixed(2)),
        totalVerifiedVal: Math.round(totalVerifiedVal)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createMeasurement = async (req, res, next) => {
  try {
    const { 
      boqItemId, mbRef, bookNo, pageNo, location, date, 
      quantity: explicitQty, items, remarks 
    } = req.body;
    const projectId = req.params.projectId || req.body.projectId;

    // Verify BOQ item belongs to this project
    const boqItem = await BOQItem.findOne({ _id: boqItemId, projectId });
    if (!boqItem) {
      return next(new AppError('BOQ Item not found in this project', 404));
    }

    // Calculate quantity from dimensional items if provided
    let calculatedQty = 0;
    let processedItems = [];
    if (Array.isArray(items) && items.length > 0) {
      processedItems = items.map(it => {
        const nos = Number(it.nos) || 1;
        const l = it.length !== undefined && it.length !== '' ? Number(it.length) : 1;
        const b = it.breadth !== undefined && it.breadth !== '' ? Number(it.breadth) : 1;
        const d = it.depth !== undefined && it.depth !== '' ? Number(it.depth) : 1;
        const isDed = Boolean(it.isDeduction);
        const sub = (isDed ? -1 : 1) * Math.abs(Number((nos * l * b * d).toFixed(3)));
        calculatedQty += sub;
        return {
          description: it.description || '',
          nos,
          length: it.length !== undefined && it.length !== '' ? Number(it.length) : 0,
          breadth: it.breadth !== undefined && it.breadth !== '' ? Number(it.breadth) : 0,
          depth: it.depth !== undefined && it.depth !== '' ? Number(it.depth) : 0,
          isDeduction: isDed,
          subTotal: sub
        };
      });
      calculatedQty = Number(calculatedQty.toFixed(3));
    } else {
      calculatedQty = Number(explicitQty) || 0;
    }

    const generatedMbRef = mbRef || `${bookNo || 'MB-01'}/P-${pageNo || '01'}`;

    const measurement = await Measurement.create({
      organizationId: req.user.organizationId,
      projectId,
      boqItemId,
      mbRef: generatedMbRef,
      bookNo: bookNo || 'MB-01',
      pageNo: pageNo || '01',
      location: location || 'General Site',
      date: date || new Date(),
      items: processedItems,
      quantity: calculatedQty,
      unit: boqItem.unit || 'cum',
      status: 'PENDING',
      remarks: remarks || '',
      measuredBy: req.user._id
    });

    res.status(201).json({ status: 'success', data: { measurement } });
  } catch (error) {
    next(error);
  }
};

export const updateMeasurement = async (req, res, next) => {
  try {
    const { 
      projectId, boqItemId, mbRef, bookNo, pageNo, location, date, 
      quantity: explicitQty, items, remarks, status 
    } = req.body;

    const existing = await Measurement.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });

    if (!existing) {
      return next(new AppError('Measurement record not found', 404));
    }

    if (existing.status === 'BILLED') {
      return next(new AppError('Cannot edit measurement that has already been billed in an RA Bill', 400));
    }

    // Verify BOQ item
    const targetBoqItemId = boqItemId || existing.boqItemId;
    const targetProjectId = projectId || existing.projectId;
    const boqItem = await BOQItem.findOne({ _id: targetBoqItemId, projectId: targetProjectId });
    if (!boqItem) {
      return next(new AppError('BOQ Item not found in this project', 404));
    }

    let calculatedQty = existing.quantity;
    let processedItems = existing.items;

    if (Array.isArray(items)) {
      calculatedQty = 0;
      processedItems = items.map(it => {
        const nos = Number(it.nos) || 1;
        const l = it.length !== undefined && it.length !== '' ? Number(it.length) : 1;
        const b = it.breadth !== undefined && it.breadth !== '' ? Number(it.breadth) : 1;
        const d = it.depth !== undefined && it.depth !== '' ? Number(it.depth) : 1;
        const isDed = Boolean(it.isDeduction);
        const sub = (isDed ? -1 : 1) * Math.abs(Number((nos * l * b * d).toFixed(3)));
        calculatedQty += sub;
        return {
          description: it.description || '',
          nos,
          length: it.length !== undefined && it.length !== '' ? Number(it.length) : 0,
          breadth: it.breadth !== undefined && it.breadth !== '' ? Number(it.breadth) : 0,
          depth: it.depth !== undefined && it.depth !== '' ? Number(it.depth) : 0,
          isDeduction: isDed,
          subTotal: sub
        };
      });
      calculatedQty = Number(calculatedQty.toFixed(3));
    } else if (explicitQty !== undefined) {
      calculatedQty = Number(explicitQty);
    }

    const generatedMbRef = mbRef || `${bookNo || existing.bookNo || 'MB-01'}/P-${pageNo || existing.pageNo || '01'}`;

    existing.projectId = targetProjectId;
    existing.boqItemId = targetBoqItemId;
    existing.mbRef = generatedMbRef;
    if (bookNo) existing.bookNo = bookNo;
    if (pageNo) existing.pageNo = pageNo;
    if (location) existing.location = location;
    if (date) existing.date = date;
    if (remarks !== undefined) existing.remarks = remarks;
    if (status && ['DRAFT', 'PENDING', 'VERIFIED', 'REJECTED'].includes(status)) {
      existing.status = status;
      if (status === 'VERIFIED') {
        existing.verifiedBy = req.user._id;
        existing.verifiedAt = new Date();
      }
    }
    existing.items = processedItems;
    existing.quantity = calculatedQty;
    existing.unit = boqItem.unit || existing.unit;

    await existing.save();

    // Sync BOQ progress if verified
    if (existing.status === 'VERIFIED') {
      await syncBOQItemProgress(existing.boqItemId);
    }

    res.status(200).json({ status: 'success', data: { measurement: existing } });
  } catch (error) {
    next(error);
  }
};

export const updateMeasurementStatus = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const measurement = await Measurement.findOne({ 
      _id: req.params.id, 
      organizationId: req.user.organizationId 
    });

    if (!measurement) {
      return next(new AppError('Measurement record not found', 404));
    }

    if (measurement.status === 'BILLED') {
      return next(new AppError('Cannot alter status of a billed measurement', 400));
    }

    measurement.status = status;
    if (status === 'VERIFIED') {
      measurement.verifiedBy = req.user._id;
      measurement.verifiedAt = new Date();
      measurement.rejectionReason = '';
    } else if (status === 'REJECTED') {
      measurement.rejectionReason = rejectionReason || 'Measurement rejected during site verification.';
      measurement.verifiedBy = undefined;
      measurement.verifiedAt = undefined;
    } else {
      measurement.verifiedBy = undefined;
      measurement.verifiedAt = undefined;
    }

    await measurement.save();

    // Keep BOQ progress synchronized
    await syncBOQItemProgress(measurement.boqItemId);

    const populated = await Measurement.findById(measurement._id)
      .populate('projectId', 'name projectCode')
      .populate('boqItemId', 'itemCode description unit rate')
      .populate('measuredBy', 'name email')
      .populate('verifiedBy', 'name email');

    res.status(200).json({ status: 'success', data: { measurement: populated } });
  } catch (error) {
    next(error);
  }
};

export const deleteMeasurement = async (req, res, next) => {
  try {
    const measurement = await Measurement.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!measurement) {
      return next(new AppError('Measurement not found', 404));
    }

    if (measurement.status === 'BILLED') {
      return next(new AppError('Cannot delete a billed measurement record', 400));
    }

    const boqItemId = measurement.boqItemId;
    await Measurement.deleteOne({ _id: measurement._id });

    // Sync BOQ progress in case it was verified
    await syncBOQItemProgress(boqItemId);

    res.status(200).json({ status: 'success', message: 'Measurement record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getBills = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) filter.projectId = req.params.projectId || req.query.projectId;
    if (req.query.status && req.query.status !== 'ALL') filter.status = req.query.status;

    const bills = await RABill.find(filter)
      .populate('projectId', 'name projectCode contractValue contractType location city')
      .populate('clientId', 'name email phone')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .sort('-billSequence -createdAt');

    res.status(200).json({ status: 'success', data: { bills } });
  } catch (error) {
    next(error);
  }
};

export const getBillById = async (req, res, next) => {
  try {
    const bill = await RABill.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
      .populate('projectId', 'name projectCode contractValue contractType location city state buildingPermitNo reraRegistrationNo')
      .populate('clientId', 'name email phone address')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('items.measurementIds', 'mbRef bookNo pageNo date quantity location');

    if (!bill) {
      return next(new AppError('RA Bill not found', 404));
    }

    res.status(200).json({ status: 'success', data: { bill } });
  } catch (error) {
    next(error);
  }
};

export const prepareNextBill = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.query.projectId;
    if (!projectId) {
      return next(new AppError('Project ID is required to prepare an RA Bill', 400));
    }

    const project = await Project.findOne({ _id: projectId, organizationId: req.user.organizationId })
      .populate('clientId');

    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    // 1. Get existing bills for this project to compute cumulative previous values
    const existingBills = await RABill.find({
      projectId,
      organizationId: req.user.organizationId,
      status: { $ne: 'REJECTED' }
    }).sort('billSequence');

    const nextSequence = existingBills.length + 1;
    const nextBillNo = `RA Bill #${String(nextSequence).padStart(2, '0')}`;

    // Map cumulative previous certified quantities per BOQ item
    const previousQtyMap = {};
    let grossPreviousAmount = 0;
    let retentionPreviousAmount = 0;

    existingBills.forEach(b => {
      grossPreviousAmount += b.grossCurrentAmount || 0;
      retentionPreviousAmount += b.retentionAmount || 0;
      if (Array.isArray(b.items)) {
        b.items.forEach(it => {
          const id = it.boqItemId.toString();
          previousQtyMap[id] = (previousQtyMap[id] || 0) + (it.currentQty || 0);
        });
      }
    });

    // 2. Fetch all verified measurements that are unbilled
    const unbilledMeasurements = await Measurement.find({
      projectId,
      organizationId: req.user.organizationId,
      status: 'VERIFIED',
      $or: [{ raBillId: null }, { raBillId: { $exists: false } }]
    }).populate('boqItemId');

    // Group measurements by BOQ item
    const groupedItemsMap = {};
    unbilledMeasurements.forEach(m => {
      const bItem = m.boqItemId;
      if (!bItem) return;
      const bId = bItem._id.toString();
      if (!groupedItemsMap[bId]) {
        groupedItemsMap[bId] = {
          boqItemId: bItem._id,
          itemCode: bItem.itemCode || 'BOQ-ITEM',
          description: bItem.description,
          unit: bItem.unit,
          rate: bItem.rate,
          tenderQty: bItem.quantity,
          previousQty: Number((previousQtyMap[bId] || 0).toFixed(3)),
          currentQty: 0,
          measurementIds: []
        };
      }
      groupedItemsMap[bId].currentQty += m.quantity || 0;
      groupedItemsMap[bId].measurementIds.push(m._id);
    });

    // Format line items
    const preparedItems = Object.values(groupedItemsMap).map(row => {
      const curQty = Number(row.currentQty.toFixed(3));
      const upQty = Number((row.previousQty + curQty).toFixed(3));
      const prevAmt = Math.round(row.previousQty * row.rate);
      const curAmt = Math.round(curQty * row.rate);
      const upAmt = prevAmt + curAmt;

      return {
        ...row,
        currentQty: curQty,
        uptoDateQty: upQty,
        previousAmount: prevAmt,
        currentAmount: curAmt,
        uptoDateAmount: upAmt
      };
    });

    const grossCurrentAmount = preparedItems.reduce((acc, it) => acc + it.currentAmount, 0);
    const grossUptoDateAmount = grossPreviousAmount + grossCurrentAmount;

    // Standard Deductions: 5% Retention, 1% Labour Cess, 2% TDS
    const retentionPercent = 5;
    const retentionAmount = Math.round((grossCurrentAmount * retentionPercent) / 100);
    const labourCessPercent = 1;
    const labourCessAmount = Math.round((grossCurrentAmount * labourCessPercent) / 100);
    const tdsPercent = 2;
    const tdsAmount = Math.round((grossCurrentAmount * tdsPercent) / 100);
    const totalDeductions = retentionAmount + labourCessAmount + tdsAmount;

    const netPayableBeforeTax = Math.max(0, grossCurrentAmount - totalDeductions);
    const gstPercent = 18;
    const gstAmount = Math.round((netPayableBeforeTax * gstPercent) / 100);
    const netPayable = netPayableBeforeTax + gstAmount;

    res.status(200).json({
      status: 'success',
      data: {
        billNo: nextBillNo,
        billSequence: nextSequence,
        billDate: new Date(),
        period: `Period ending ${new Date().toLocaleDateString('en-GB')}`,
        projectId: project._id,
        projectName: project.name,
        client: project.clientId,
        items: preparedItems,
        grossCurrentAmount,
        grossPreviousAmount,
        grossUptoDateAmount,
        retentionPercent,
        retentionAmount,
        retentionUptoDate: retentionPreviousAmount + retentionAmount,
        mobAdvanceRecovery: 0,
        materialRecovery: 0,
        labourCessPercent,
        labourCessAmount,
        tdsPercent,
        tdsAmount,
        otherDeductions: 0,
        totalDeductions,
        netPayableBeforeTax,
        gstPercent,
        gstAmount,
        netPayable,
        unbilledMeasurementsCount: unbilledMeasurements.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createBill = async (req, res, next) => {
  try {
    const { 
      billNo, billSequence, billDate, period, periodFrom, periodTo,
      items, grossCurrentAmount, grossPreviousAmount, grossUptoDateAmount,
      retentionPercent, retentionAmount, mobAdvanceRecovery, materialRecovery,
      labourCessPercent, labourCessAmount, tdsPercent, tdsAmount, otherDeductions,
      totalDeductions, netPayableBeforeTax, gstPercent, gstAmount, netPayable,
      engineerRemarks, clientRemarks 
    } = req.body;

    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) {
      return next(new AppError('Project ID is required to generate an RA Bill', 400));
    }

    const project = await Project.findOne({ _id: projectId, organizationId: req.user.organizationId });
    if (!project) {
      return next(new AppError('Project not found', 404));
    }

    const bill = await RABill.create({
      organizationId: req.user.organizationId,
      projectId,
      clientId: project.clientId,
      billNo: billNo || 'RA Bill #01',
      billSequence: billSequence || 1,
      billDate: billDate || new Date(),
      period: period || `Period ending ${new Date().toLocaleDateString('en-GB')}`,
      periodFrom,
      periodTo,
      items: items || [],
      grossCurrentAmount: grossCurrentAmount || 0,
      grossPreviousAmount: grossPreviousAmount || 0,
      grossUptoDateAmount: grossUptoDateAmount || (grossCurrentAmount || 0),
      grossAmount: grossCurrentAmount || 0,
      retentionPercent: retentionPercent !== undefined ? retentionPercent : 5,
      retentionAmount: retentionAmount || 0,
      retentionUptoDate: (grossPreviousAmount ? 0 : 0) + (retentionAmount || 0),
      mobAdvanceRecovery: mobAdvanceRecovery || 0,
      materialRecovery: materialRecovery || 0,
      labourCessPercent: labourCessPercent !== undefined ? labourCessPercent : 1,
      labourCessAmount: labourCessAmount || 0,
      tdsPercent: tdsPercent !== undefined ? tdsPercent : 2,
      tdsAmount: tdsAmount || 0,
      otherDeductions: otherDeductions || 0,
      totalDeductions: totalDeductions || 0,
      netPayableBeforeTax: netPayableBeforeTax || 0,
      gstPercent: gstPercent !== undefined ? gstPercent : 18,
      gstAmount: gstAmount || 0,
      netPayable: netPayable || 0,
      balanceDue: netPayable || 0,
      status: 'SUBMITTED',
      engineerRemarks: engineerRemarks || '',
      clientRemarks: clientRemarks || '',
      createdBy: req.user._id
    });

    // Mark all included measurements as BILLED and link to this RA Bill
    const allMeasurementIds = [];
    if (Array.isArray(items)) {
      items.forEach(it => {
        if (Array.isArray(it.measurementIds)) {
          allMeasurementIds.push(...it.measurementIds);
        }
      });
    }

    if (allMeasurementIds.length > 0) {
      await Measurement.updateMany(
        { _id: { $in: allMeasurementIds } },
        { status: 'BILLED', raBillId: bill._id }
      );
    }

    const populated = await RABill.findById(bill._id)
      .populate('projectId', 'name projectCode')
      .populate('clientId', 'name email')
      .populate('createdBy', 'name email');

    res.status(201).json({ status: 'success', data: { bill: populated } });
  } catch (error) {
    next(error);
  }
};

export const updateBillStatus = async (req, res, next) => {
  try {
    const { status, paidAmount, paymentDate, paymentReference, clientRemarks } = req.body;
    const bill = await RABill.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!bill) {
      return next(new AppError('RA Bill not found', 404));
    }

    bill.status = status;
    if (status === 'APPROVED') {
      bill.approvedBy = req.user._id;
      bill.approvedAt = new Date();
      if (clientRemarks) bill.clientRemarks = clientRemarks;
    } else if (status === 'PAID') {
      bill.paidAmount = paidAmount !== undefined ? paidAmount : bill.netPayable;
      bill.balanceDue = Math.max(0, bill.netPayable - (bill.paidAmount || 0));
      bill.paymentDate = paymentDate || new Date();
      if (paymentReference) bill.paymentReference = paymentReference;
    } else if (status === 'REJECTED') {
      // Release linked measurements back to VERIFIED
      await Measurement.updateMany(
        { raBillId: bill._id },
        { status: 'VERIFIED', raBillId: null }
      );
      if (clientRemarks) bill.clientRemarks = clientRemarks;
    }

    await bill.save();

    const populated = await RABill.findById(bill._id)
      .populate('projectId', 'name projectCode')
      .populate('clientId', 'name email')
      .populate('createdBy', 'name email')
      .populate('approvedBy', 'name email');

    res.status(200).json({ status: 'success', data: { bill: populated } });
  } catch (error) {
    next(error);
  }
};

export const deleteBill = async (req, res, next) => {
  try {
    const bill = await RABill.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!bill) {
      return next(new AppError('RA Bill not found', 404));
    }

    if (bill.status === 'PAID') {
      return next(new AppError('Cannot delete an RA Bill that has been marked as PAID', 400));
    }

    // Release linked measurements back to VERIFIED
    await Measurement.updateMany(
      { raBillId: bill._id },
      { status: 'VERIFIED', raBillId: null }
    );

    await RABill.deleteOne({ _id: bill._id });

    res.status(200).json({ status: 'success', message: 'RA Bill deleted and linked measurements restored to VERIFIED' });
  } catch (error) {
    next(error);
  }
};
