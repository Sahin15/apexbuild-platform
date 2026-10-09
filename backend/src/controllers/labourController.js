import Worker from '../models/Worker.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';

export const getWorkers = async (req, res, next) => {
  try {
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) filter.projectId = req.params.projectId || req.query.projectId;
    
    const workers = await Worker.find(filter).populate('projectId', 'name').sort('name');
    res.status(200).json({ status: 'success', data: { workers } });
  } catch (error) {
    next(error);
  }
};

export const createWorker = async (req, res, next) => {
  try {
    const worker = await Worker.create({
      ...req.body,
      projectId: req.params.projectId || req.body.projectId,
      organizationId: req.user.organizationId
    });
    res.status(201).json({ status: 'success', data: { worker } });
  } catch (error) {
    next(error);
  }
};

export const markAttendance = async (req, res, next) => {
  try {
    // Expecting an array of { workerId, status } and a date
    const { date, records, projectId } = req.body;
    const finalProjectId = req.params.projectId || projectId;
    const targetDate = new Date(date).setHours(0,0,0,0);

    const attendancePromises = records.map(record => 
      Attendance.findOneAndUpdate(
        { workerId: record.workerId, date: targetDate, organizationId: req.user.organizationId },
        { 
          projectId: finalProjectId || null,
          status: record.status,
          markedBy: req.user._id
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )
    );

    // Delete attendance for workers who were previously marked in this project for this date but are now unmarked
    const incomingWorkerIds = records.map(r => r.workerId);
    await Attendance.deleteMany({
      projectId: finalProjectId,
      date: targetDate,
      organizationId: req.user.organizationId,
      workerId: { $nin: incomingWorkerIds }
    });

    await Promise.all(attendancePromises);
    res.status(200).json({ status: 'success', message: 'Attendance marked successfully' });
  } catch (error) {
    next(error);
  }
};

export const getLabourSummary = async (req, res, next) => {
  try {
    const dateQuery = req.query.date ? new Date(req.query.date) : new Date();
    dateQuery.setHours(0,0,0,0);
    
    const filter = { organizationId: req.user.organizationId };
    if (req.params.projectId || req.query.projectId) filter.projectId = req.params.projectId || req.query.projectId;

    const workers = await Worker.find(filter);
    const workerIds = workers.map(w => w._id);

    const attendances = await Attendance.find({
      workerId: { $in: workerIds },
      date: dateQuery
    });

    const attendanceMap = {};
    attendances.forEach(a => { attendanceMap[a.workerId.toString()] = a.status; });

    const summary = {};
    workers.forEach(w => {
      if (!summary[w.category]) {
        summary[w.category] = { category: w.category, count: 0, present: 0, rateSum: 0 };
      }
      summary[w.category].count += 1;
      summary[w.category].rateSum += w.dailyRate;
      
      const status = attendanceMap[w._id.toString()];
      if (status === 'Present') summary[w.category].present += 1;
      else if (status === 'Half-Day') summary[w.category].present += 0.5;
    });

    const categories = Object.values(summary).map(s => ({
      type: s.category,
      count: s.count,
      present: s.present,
      rate: s.count > 0 ? Math.round(s.rateSum / s.count) : 0
    }));

    res.status(200).json({ status: 'success', data: { categories, totalWorkers: workers.length } });
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
      targetDate.setHours(0,0,0,0);
      filter.date = targetDate;
    }

    const attendances = await Attendance.find(filter)
      .populate('workerId', 'name category dailyRate')
      .populate('projectId', 'name')
      .sort({ date: -1, 'workerId.name': 1 })
      .limit(200); // Limit to last 200 records to prevent huge responses

    res.status(200).json({ status: 'success', data: { attendances } });
  } catch (error) {
    next(error);
  }
};

export const addWorkerPayment = async (req, res, next) => {
  try {
    const { amount, date, notes } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ status: 'error', message: 'Valid payment amount is required' });
    }

    const worker = await Worker.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId },
      { 
        $inc: { totalPaid: amount },
        $push: { payments: { amount, date: date || new Date(), notes } }
      },
      { new: true }
    );

    if (!worker) {
      return res.status(404).json({ status: 'error', message: 'Worker not found' });
    }

    res.status(200).json({ status: 'success', data: { worker } });
  } catch (error) {
    next(error);
  }
};
