import Doctor from '../models/Doctor.js';
import Order from '../models/Order.js';
import DoctorPayout from '../models/DoctorPayout.js';
import AppError from '../utils/AppError.js';

export const getDoctors = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const doctors = await Doctor.find({ organizationId: orgId }).sort({ name: 1 });

    // Aggregate referred orders and payouts for each doctor
    const doctorsWithStats = await Promise.all(
      doctors.map(async (doc) => {
        const docObj = doc.toObject();
        
        // Orders referred by this doctor
        const orders = await Order.find({ 
          organizationId: orgId, 
          referringDoctor: doc._id,
          orderStatus: { $ne: 'Cancelled' }
        }).select('totalAmount subtotal orderStatus createdAt');

        const totalReferrals = orders.length;
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        const commissionRate = doc.commissionRate || 15;
        const totalCommission = Math.round(totalRevenue * (commissionRate / 100));

        // Payouts recorded for this doctor
        const payouts = await DoctorPayout.find({
          organizationId: orgId,
          doctor: doc._id
        }).select('commissionAmount netPaidAmount');

        const totalPaid = payouts.reduce((sum, p) => sum + (p.netPaidAmount || p.commissionAmount || 0), 0);
        const pendingBalance = Math.max(0, totalCommission - totalPaid);

        return {
          ...docObj,
          totalReferrals,
          totalRevenue,
          totalCommission,
          totalPaid,
          pendingBalance
        };
      })
    );

    // Global summary across all doctors
    const globalStats = {
      totalDoctors: doctors.length,
      totalReferredPatients: doctorsWithStats.reduce((acc, d) => acc + d.totalReferrals, 0),
      totalGrossRevenue: doctorsWithStats.reduce((acc, d) => acc + d.totalRevenue, 0),
      totalIncentiveAccrued: doctorsWithStats.reduce((acc, d) => acc + d.totalCommission, 0),
      totalPaidOut: doctorsWithStats.reduce((acc, d) => acc + d.totalPaid, 0),
      totalPendingBalance: doctorsWithStats.reduce((acc, d) => acc + d.pendingBalance, 0)
    };

    res.status(200).json({
      status: 'success',
      results: doctorsWithStats.length,
      data: { 
        doctors: doctorsWithStats,
        stats: globalStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const doctorData = {
      ...req.body,
      organizationId: orgId,
      createdBy: req.user._id
    };

    const doctor = await Doctor.create(doctorData);

    res.status(201).json({
      status: 'success',
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const doctor = await Doctor.findOneAndUpdate(
      { _id: req.params.id, organizationId: orgId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!doctor) return next(new AppError('Doctor not found', 404));

    res.status(200).json({
      status: 'success',
      data: { doctor }
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorLedger = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const doctorId = req.params.id;

    const doctor = await Doctor.findOne({ _id: doctorId, organizationId: orgId });
    if (!doctor) return next(new AppError('Doctor not found', 404));

    // Fetch referred orders
    const orders = await Order.find({
      organizationId: orgId,
      referringDoctor: doctorId,
      orderStatus: { $ne: 'Cancelled' }
    })
    .populate('patient', 'firstName lastName patientId phone')
    .populate('tests.test', 'name')
    .sort({ createdAt: -1 });

    const commissionRate = doctor.commissionRate || 15;

    const enrichedOrders = orders.map(o => {
      const incentive = Math.round((o.totalAmount || 0) * (commissionRate / 100));
      return {
        ...o.toObject(),
        calculatedIncentive: incentive
      };
    });

    // Fetch payout history
    const payouts = await DoctorPayout.find({
      organizationId: orgId,
      doctor: doctorId
    })
    .populate('paidBy', 'name email')
    .sort({ paidAt: -1 });

    const totalRevenue = enrichedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCommission = enrichedOrders.reduce((sum, o) => sum + o.calculatedIncentive, 0);
    const totalPaid = payouts.reduce((sum, p) => sum + (p.netPaidAmount || 0), 0);
    const pendingBalance = Math.max(0, totalCommission - totalPaid);

    res.status(200).json({
      status: 'success',
      data: {
        doctor,
        orders: enrichedOrders,
        payouts,
        summary: {
          totalReferrals: enrichedOrders.length,
          totalRevenue,
          totalCommission,
          totalPaid,
          pendingBalance
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const recordDoctorPayout = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { 
      doctorId, 
      commissionAmount, 
      taxDeduction = 0, 
      paymentMethod = 'UPI', 
      transactionReference, 
      notes, 
      periodStart, 
      periodEnd 
    } = req.body;

    const doctor = await Doctor.findOne({ _id: doctorId, organizationId: orgId });
    if (!doctor) return next(new AppError('Doctor not found', 404));

    const netPaidAmount = Number(commissionAmount) - Number(taxDeduction);

    const payout = await DoctorPayout.create({
      organizationId: orgId,
      doctor: doctorId,
      periodStart: periodStart ? new Date(periodStart) : undefined,
      periodEnd: periodEnd ? new Date(periodEnd) : undefined,
      commissionRate: doctor.commissionRate || 15,
      commissionAmount: Number(commissionAmount),
      taxDeduction: Number(taxDeduction),
      netPaidAmount,
      paymentMethod,
      transactionReference,
      notes,
      paidBy: req.user._id,
      paidAt: new Date()
    });

    const populatedPayout = await DoctorPayout.findById(payout._id)
      .populate('doctor')
      .populate('paidBy', 'name');

    res.status(201).json({
      status: 'success',
      data: { payout: populatedPayout }
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPayouts = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const payouts = await DoctorPayout.find({ organizationId: orgId })
      .populate('doctor', 'name specialization phone clinicName bankDetails panNumber')
      .populate('paidBy', 'name')
      .sort({ paidAt: -1 });

    res.status(200).json({
      status: 'success',
      results: payouts.length,
      data: { payouts }
    });
  } catch (error) {
    next(error);
  }
};
