import Worker from '../models/Worker.js';
import Attendance from '../models/Attendance.js';
import LabourWageSheet from '../models/LabourWageSheet.js';
import PushNotificationService from '../services/PushNotificationService.js';
import FcmNotificationService from '../services/FcmNotificationService.js';
import AppError from '../utils/AppError.js';

// ==================== WORKER MANAGEMENT ====================

export const getWorkers = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) {
      filter.projectId = req.params.projectId || req.query.projectId;
    }
    if (req.query.category && req.query.category !== 'ALL') {
      filter.category = req.query.category;
    }
    if (req.query.thekedaar && req.query.thekedaar !== 'ALL') {
      filter.thekedaar = req.query.thekedaar;
    }
    
    const workers = await Worker.find(filter)
      .populate('projectId', 'name projectCode')
      .sort('name');

    res.status(200).json({ status: 'success', data: { workers } });
  } catch (error) {
    next(error);
  }
};

export const createWorker = async (req, res, next) => {
  try {
    const count = await Worker.countDocuments({ organizationId: req.user.organizationId });
    const autoCode = req.body.workerCode || `WRK-${String(count + 1).padStart(3, '0')}`;

    const worker = await Worker.create({
      ...req.body,
      workerCode: autoCode,
      projectId: req.params.projectId || req.body.projectId,
      organizationId: req.user.organizationId
    });

    res.status(201).json({ status: 'success', data: { worker } });
  } catch (error) {
    next(error);
  }
};

export const updateWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!worker) return next(new AppError('Worker not found', 404));
    res.status(200).json({ status: 'success', data: { worker } });
  } catch (error) {
    next(error);
  }
};

export const deleteWorker = async (req, res, next) => {
  try {
    const worker = await Worker.findOneAndDelete({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });
    if (!worker) return next(new AppError('Worker not found', 404));
    res.status(200).json({ status: 'success', message: 'Worker record deleted' });
  } catch (error) {
    next(error);
  }
};

// ==================== ATTENDANCE & MUSTER ROLL ====================

export const markAttendance = async (req, res, next) => {
  try {
    const { date, records, projectId } = req.body;
    const finalProjectId = req.params.projectId || projectId;
    const targetDate = new Date(date).setHours(0, 0, 0, 0);

    const attendancePromises = records.map(record => 
      Attendance.findOneAndUpdate(
        { workerId: record.workerId, date: targetDate, organizationId: req.user.organizationId },
        { 
          projectId: finalProjectId || null,
          status: record.status,
          hoursWorked: Number(record.hoursWorked) || (record.status === 'Half-Day' ? 4 : record.status === 'Present' ? 8 : 0),
          overtimeHours: Number(record.overtimeHours) || 0,
          taskLocation: record.taskLocation || '',
          markedBy: req.user._id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    // Delete attendance for workers explicitly excluded from this day's roster
    const incomingWorkerIds = records.map(r => r.workerId);
    await Attendance.deleteMany({
      projectId: finalProjectId,
      date: targetDate,
      organizationId: req.user.organizationId,
      workerId: { $nin: incomingWorkerIds }
    });

    await Promise.all(attendancePromises);

    // Dispatch Web Push notification to contractor project managers / engineers
    PushNotificationService.sendNotification({
      organizationId: req.user.organizationId,
      platform: 'CONTRACTOR',
      title: '📋 Daily Labour Muster Submitted',
      body: `Site muster recorded for ${records.length} worker(s) with geofence stamp.`,
      url: '/labour',
      tag: `attendance-${finalProjectId}-${new Date(targetDate).toISOString().split('T')[0]}`
    }).catch(() => {});

    // Dispatch Firebase Cloud Message (FCM) to field engineers & contractor managers
    FcmNotificationService.sendToOrganization(req.user.organizationId, 'CONTRACTOR', {
      title: '📋 Daily Labour Muster Submitted',
      body: `Site muster recorded for ${records.length} worker(s) with geofence stamp.`,
      clickAction: '/labour',
      data: { projectId: finalProjectId ? finalProjectId.toString() : '' }
    }).catch(() => {});

    res.status(200).json({ status: 'success', message: 'Attendance & Overtime recorded successfully' });
  } catch (error) {
    next(error);
  }
};

export const getMusterRollMatrix = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    const pId = req.params.projectId || req.query.projectId;
    if (pId) filter.projectId = pId;

    const workers = await Worker.find(filter).sort('thekedaar name');

    // Date range: default to last 7 days up to today
    const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(endDate.getTime() - 6 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    // Fetch attendances in range
    const attendances = await Attendance.find({
      organizationId: req.user.organizationId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Build map: workerId -> dateStr -> { status, hours, ot }
    const matrix = {};
    attendances.forEach(att => {
      const wId = att.workerId.toString();
      const dStr = new Date(att.date).toISOString().split('T')[0];
      if (!matrix[wId]) matrix[wId] = {};
      matrix[wId][dStr] = {
        status: att.status,
        hoursWorked: att.hoursWorked || (att.status === 'Half-Day' ? 4 : 8),
        overtimeHours: att.overtimeHours || 0
      };
    });

    res.status(200).json({
      status: 'success',
      data: {
        startDate,
        endDate,
        workers,
        matrix
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAttendanceHistory = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) {
      filter.projectId = req.params.projectId || req.query.projectId;
    }
    if (req.query.date) {
      const targetDate = new Date(req.query.date);
      targetDate.setHours(0, 0, 0, 0);
      filter.date = targetDate;
    }

    const attendances = await Attendance.find(filter)
      .populate('workerId', 'name workerCode category skillLevel dailyRate thekedaar')
      .populate('projectId', 'name projectCode')
      .sort({ date: -1, 'workerId.name': 1 })
      .limit(300);

    res.status(200).json({ status: 'success', data: { attendances } });
  } catch (error) {
    next(error);
  }
};

export const getLabourSummary = async (req, res, next) => {
  try {
    const dateQuery = req.query.date ? new Date(req.query.date) : new Date();
    dateQuery.setHours(0, 0, 0, 0);
    
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) filter.projectId = req.params.projectId || req.query.projectId;

    const workers = await Worker.find(filter);
    const workerIds = workers.map(w => w._id);

    const attendances = await Attendance.find({
      workerId: { $in: workerIds },
      date: dateQuery
    });

    const attendanceMap = {};
    let totalPresentToday = 0;
    let totalHalfDayToday = 0;
    let totalOTHoursToday = 0;

    attendances.forEach(a => { 
      attendanceMap[a.workerId.toString()] = a; 
      if (a.status === 'Present') totalPresentToday++;
      else if (a.status === 'Half-Day') totalHalfDayToday++;
      totalOTHoursToday += (a.overtimeHours || 0);
    });

    const summary = {};
    workers.forEach(w => {
      if (!summary[w.category]) {
        summary[w.category] = { category: w.category, count: 0, present: 0, rateSum: 0 };
      }
      summary[w.category].count += 1;
      summary[w.category].rateSum += w.dailyRate;
      
      const att = attendanceMap[w._id.toString()];
      if (att) {
        if (att.status === 'Present') summary[w.category].present += 1;
        else if (att.status === 'Half-Day') summary[w.category].present += 0.5;
      }
    });

    const categories = Object.values(summary).map(s => ({
      type: s.category,
      count: s.count,
      present: s.present,
      rate: s.count > 0 ? Math.round(s.rateSum / s.count) : 0
    }));

    res.status(200).json({ 
      status: 'success', 
      data: { 
        categories, 
        totalWorkers: workers.length,
        totalPresentToday,
        totalHalfDayToday,
        totalOTHoursToday
      } 
    });
  } catch (error) {
    next(error);
  }
};

// ==================== WAGE SHEETS & PAYOUTS (CPWD FORM 21) ====================

export const generateWageSheet = async (req, res, next) => {
  try {
    const { projectId, startDate, endDate, thekedaar } = req.body;
    const finalProjectId = req.params.projectId || projectId;

    const sDate = new Date(startDate);
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(endDate);
    eDate.setHours(23, 59, 59, 999);

    const workerFilter = { organizationId: req.user.organizationId };
    if (finalProjectId) workerFilter.projectId = finalProjectId;
    if (thekedaar && thekedaar !== 'ALL') workerFilter.thekedaar = thekedaar;

    const workers = await Worker.find(workerFilter);
    if (workers.length === 0) {
      return next(new AppError('No workers found for wage calculation', 400));
    }

    // Fetch all attendances for these workers in range
    const attendances = await Attendance.find({
      organizationId: req.user.organizationId,
      workerId: { $in: workers.map(w => w._id) },
      date: { $gte: sDate, $lte: eDate }
    });

    const attMap = {};
    attendances.forEach(a => {
      const key = a.workerId.toString();
      if (!attMap[key]) attMap[key] = { daysPresent: 0, halfDays: 0, otHours: 0 };
      if (a.status === 'Present') attMap[key].daysPresent++;
      else if (a.status === 'Half-Day') attMap[key].halfDays++;
      attMap[key].otHours += (a.overtimeHours || 0);
    });

    // Build line items
    const lineItems = workers.map(w => {
      const stats = attMap[w._id.toString()] || { daysPresent: 0, halfDays: 0, otHours: 0 };
      const daysWorkedEffective = stats.daysPresent + (stats.halfDays * 0.5);
      const baseWages = Math.round(daysWorkedEffective * w.dailyRate);
      const otRate = w.overtimeHourlyRate || Math.round((w.dailyRate / 8) * 1.5);
      const otWages = Math.round(stats.otHours * otRate);
      const grossWage = baseWages + otWages;
      
      // Advance deduction (take min of worker's outstanding advance or 25% of gross wage)
      const maxDeductible = Math.round(grossWage * 0.25);
      const advanceDeduction = Math.min(w.totalAdvance || 0, maxDeductible);
      
      // 1% Labour Welfare Cess
      const statutoryDeduction = Math.round(grossWage * 0.01);
      const netPayable = Math.max(0, grossWage - advanceDeduction - statutoryDeduction);

      return {
        workerId: w._id,
        workerName: w.name,
        workerCode: w.workerCode || '',
        trade: w.category,
        skillLevel: w.skillLevel || 'SKILLED',
        thekedaar: w.thekedaar || 'General Site Gang',
        dailyRate: w.dailyRate,
        overtimeHourlyRate: otRate,
        daysPresent: stats.daysPresent,
        halfDays: stats.halfDays,
        daysWorkedEffective,
        otHours: stats.otHours,
        baseWages,
        otWages,
        grossWage,
        advanceDeduction,
        statutoryDeduction,
        netPayable,
        paymentStatus: 'PENDING'
      };
    }).filter(item => item.daysWorkedEffective > 0 || item.otHours > 0);

    const count = await LabourWageSheet.countDocuments({ organizationId: req.user.organizationId });
    const sheetNo = req.body.sheetNo || `NMR-${new Date().getFullYear()}-W${String(count + 1).padStart(3, '0')}`;

    const wageSheet = await LabourWageSheet.create({
      organizationId: req.user.organizationId,
      projectId: finalProjectId,
      sheetNo,
      thekedaar: thekedaar || 'All Gangs',
      startDate: sDate,
      endDate: eDate,
      lineItems,
      status: 'VERIFIED',
      preparedBy: req.user._id,
      verifiedBy: req.user._id
    });

    const populatedSheet = await LabourWageSheet.findById(wageSheet._id)
      .populate('projectId', 'name projectCode')
      .populate('preparedBy', 'name');

    res.status(201).json({ status: 'success', data: { wageSheet: populatedSheet } });
  } catch (error) {
    next(error);
  }
};

export const getWageSheets = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) {
      filter.projectId = req.params.projectId || req.query.projectId;
    }

    const wageSheets = await LabourWageSheet.find(filter)
      .populate('projectId', 'name projectCode')
      .populate('preparedBy', 'name')
      .populate('approvedBy', 'name')
      .sort('-startDate -createdAt');

    res.status(200).json({ status: 'success', data: { wageSheets } });
  } catch (error) {
    next(error);
  }
};

export const getWageSheetById = async (req, res, next) => {
  try {
    const sheet = await LabourWageSheet.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    })
      .populate('projectId', 'name projectCode clientName location')
      .populate('preparedBy', 'name')
      .populate('verifiedBy', 'name')
      .populate('approvedBy', 'name');

    if (!sheet) return next(new AppError('Muster roll wage sheet not found', 404));

    res.status(200).json({ status: 'success', data: { wageSheet: sheet } });
  } catch (error) {
    next(error);
  }
};

export const disburseWageSheet = async (req, res, next) => {
  try {
    const sheet = await LabourWageSheet.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId
    });

    if (!sheet) return next(new AppError('Wage sheet not found', 404));
    if (sheet.status === 'DISBURSED') {
      return next(new AppError('This wage sheet has already been disbursed', 400));
    }

    // Update each worker's totalPaid, reduce advance, and record payment
    for (const item of sheet.lineItems) {
      if (item.netPayable > 0) {
        await Worker.findByIdAndUpdate(item.workerId, {
          $inc: {
            totalPaid: item.netPayable,
            totalAdvance: -(item.advanceDeduction || 0)
          },
          $push: {
            payments: {
              amount: item.netPayable,
              type: 'WAGE',
              date: new Date(),
              notes: `Muster Roll Settlement ${sheet.sheetNo}`,
              paymentMode: req.body.paymentMode || 'CASH'
            }
          }
        });
      }
      item.paymentStatus = 'PAID';
      item.paidAt = new Date();
      item.paymentMode = req.body.paymentMode || 'CASH';
    }

    sheet.status = 'DISBURSED';
    sheet.disbursedAt = new Date();
    sheet.approvedBy = req.user._id;
    await sheet.save();

    res.status(200).json({ status: 'success', message: 'Wages disbursed successfully', data: { wageSheet: sheet } });
  } catch (error) {
    next(error);
  }
};

export const addWorkerAdvance = async (req, res, next) => {
  try {
    const { amount, notes, paymentMode } = req.body;
    if (!amount || amount <= 0) return next(new AppError('Valid advance amount required', 400));

    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      {
        $inc: { totalAdvance: amount },
        $push: {
          payments: {
            amount,
            type: 'ADVANCE',
            date: new Date(),
            notes: notes || 'Site cash advance for rations / batta',
            paymentMode: paymentMode || 'CASH'
          }
        }
      },
      { new: true }
    );

    if (!worker) return next(new AppError('Worker not found', 404));

    res.status(200).json({ status: 'success', data: { worker } });
  } catch (error) {
    next(error);
  }
};

