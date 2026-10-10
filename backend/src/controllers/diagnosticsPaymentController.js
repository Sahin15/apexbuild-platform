import mongoose from 'mongoose';
import LabPaymentReceipt from '../models/LabPaymentReceipt.js';
import CashierShift from '../models/CashierShift.js';
import Order from '../models/Order.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';

export const getPayments = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { paymentMethod, search, startDate, endDate, dateFilter } = req.query;

    const query = { organizationId: orgId };

    if (paymentMethod && paymentMethod !== 'All') {
      query.paymentMethod = paymentMethod;
    }

    // Handle date filtering
    if (dateFilter === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      query.paymentDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.paymentDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    let payments = await LabPaymentReceipt.find(query)
      .populate({
        path: 'order',
        select: 'orderId subtotal totalDiscount totalAmount paidAmount dueAmount paymentStatus orderStatus createdAt',
        populate: [
          { path: 'tests.test', select: 'name testId price department' },
          { path: 'referringDoctor', select: 'name specialization' }
        ]
      })
      .populate('patient', 'firstName lastName patientId phone age gender email address bloodGroup')
      .populate('cashier', 'name email role')
      .sort({ createdAt: -1 });

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      payments = payments.filter(p => {
        const receiptMatch = p.receiptNumber?.toLowerCase().includes(q);
        const orderMatch = p.order?.orderId?.toLowerCase().includes(q);
        const patientName = `${p.patient?.firstName || ''} ${p.patient?.lastName || ''}`.toLowerCase();
        const patientMatch = patientName.includes(q) || p.patient?.phone?.includes(q) || p.patient?.patientId?.toLowerCase().includes(q);
        const refMatch = p.transactionReference?.toLowerCase().includes(q);
        return receiptMatch || orderMatch || patientMatch || refMatch;
      });
    }

    res.status(200).json({
      status: 'success',
      results: payments.length,
      data: { payments }
    });
  } catch (error) {
    next(error);
  }
};

export const recordPayment = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { orderId, amount, paymentMethod, transactionReference, notes, spotDiscount } = req.body;

    if (!orderId) {
      return next(new AppError('Order ID is required', 400));
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return next(new AppError('Please enter a valid payment amount greater than zero', 400));
    }

    const order = await Order.findOne({ _id: orderId, organizationId: orgId })
      .populate('patient')
      .populate('tests.test')
      .populate('referringDoctor');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Apply spot discount if provided
    const discountAmount = Number(spotDiscount) || 0;
    if (discountAmount > 0) {
      if (discountAmount > order.dueAmount) {
        return next(new AppError('Spot discount cannot exceed remaining due amount', 400));
      }
      order.totalDiscount = (order.totalDiscount || 0) + discountAmount;
      order.totalAmount = Math.max(0, order.totalAmount - discountAmount);
      order.dueAmount = Math.max(0, order.totalAmount - order.paidAmount);
    }

    if (payAmount > order.dueAmount) {
      return next(new AppError(`Payment of ₹${payAmount} exceeds remaining due amount of ₹${order.dueAmount}`, 400));
    }

    const paidBeforeThis = order.paidAmount || 0;
    const balanceAfterThis = Math.max(0, order.dueAmount - payAmount);

    const cashierUser = req.user;
    const cashierName = cashierUser?.name || 'Cash Desk Cashier';

    // Create payment receipt document
    const receipt = await LabPaymentReceipt.create({
      organizationId: orgId,
      order: order._id,
      patient: order.patient._id,
      amount: payAmount,
      paymentMethod: paymentMethod || 'Cash',
      transactionReference: transactionReference || '',
      subtotal: order.subtotal,
      discount: order.totalDiscount,
      orderTotal: order.totalAmount,
      paidBeforeThis,
      balanceAfterThis,
      cashier: cashierUser._id,
      cashierName,
      notes: notes || '',
      paymentDate: new Date()
    });

    // Update order
    order.paidAmount = paidBeforeThis + payAmount;
    order.dueAmount = balanceAfterThis;
    order.paymentStatus = balanceAfterThis === 0 ? 'Paid' : 'Partial';

    if (!order.payments) order.payments = [];
    order.payments.push({
      receiptNumber: receipt.receiptNumber,
      receiptId: receipt._id,
      amount: payAmount,
      paymentMethod: paymentMethod || 'Cash',
      transactionReference: transactionReference || '',
      cashierName,
      paidAt: new Date()
    });

    await order.save();

    // Populate for receipt generation
    const populatedReceipt = await LabPaymentReceipt.findById(receipt._id)
      .populate({
        path: 'order',
        populate: [
          { path: 'tests.test', select: 'name testId price department' },
          { path: 'referringDoctor', select: 'name specialization' }
        ]
      })
      .populate('patient')
      .populate('cashier', 'name role');

    res.status(201).json({
      status: 'success',
      data: {
        receipt: populatedReceipt,
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftSummary = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const userId = req.user._id;

    // Check if there is an active open shift
    let activeShift = await CashierShift.findOne({
      organizationId: orgId,
      status: 'Open'
    }).sort({ createdAt: -1 });

    // Determine time window: from shift start or from today's start
    let startTime;
    if (activeShift) {
      startTime = new Date(activeShift.startTime);
    } else {
      startTime = new Date();
      startTime.setHours(0, 0, 0, 0);
    }

    const endTime = new Date();

    const receipts = await LabPaymentReceipt.find({
      organizationId: orgId,
      paymentDate: { $gte: startTime, $lte: endTime }
    }).populate('order', 'orderId').populate('patient', 'firstName lastName patientId');

    let systemCash = 0;
    let systemUPI = 0;
    let systemCard = 0;
    let systemBankTransfer = 0;
    let systemCheque = 0;

    receipts.forEach(r => {
      const amt = r.amount || 0;
      switch (r.paymentMethod) {
        case 'Cash':
          systemCash += amt;
          break;
        case 'UPI':
          systemUPI += amt;
          break;
        case 'Card':
          systemCard += amt;
          break;
        case 'Bank Transfer':
          systemBankTransfer += amt;
          break;
        case 'Cheque':
          systemCheque += amt;
          break;
        default:
          systemCash += amt;
      }
    });

    const systemTotal = systemCash + systemUPI + systemCard + systemBankTransfer + systemCheque;

    // Calculate outstanding dues across all active lab orders
    const allOrders = await Order.find({ organizationId: orgId, paymentStatus: { $ne: 'Paid' } }).select('dueAmount');
    const totalOutstandingDues = allOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);

    // If activeShift exists, update its system counters
    if (activeShift) {
      activeShift.systemCash = systemCash;
      activeShift.systemUPI = systemUPI;
      activeShift.systemCard = systemCard;
      activeShift.systemBankTransfer = systemBankTransfer;
      activeShift.systemCheque = systemCheque;
      activeShift.systemTotal = systemTotal;
      activeShift.totalTransactions = receipts.length;
      await activeShift.save();
    }

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          systemCash,
          systemUPI,
          systemCard,
          systemBankTransfer,
          systemCheque,
          systemTotal,
          totalTransactions: receipts.length,
          startTime,
          endTime,
          totalOutstandingDues
        },
        activeShift,
        recentReceipts: receipts.slice(-10).reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};

export const openCashierShift = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const userId = req.user._id;
    const { openingCashFloat } = req.body;

    // Check if open shift already exists
    const existingOpenShift = await CashierShift.findOne({
      organizationId: orgId,
      status: 'Open'
    });

    if (existingOpenShift) {
      return next(new AppError('A cashier register shift is already currently active. Please close the active shift first.', 400));
    }

    const shift = await CashierShift.create({
      organizationId: orgId,
      cashier: userId,
      cashierName: req.user.name || 'Cash Desk Cashier',
      openingCashFloat: Number(openingCashFloat) || 0,
      startTime: new Date(),
      status: 'Open'
    });

    res.status(201).json({
      status: 'success',
      message: 'Cashier shift opened successfully',
      data: { shift }
    });
  } catch (error) {
    next(error);
  }
};

export const closeCashierShift = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { 
      shiftId, 
      denominations, 
      physicalCashCounted, 
      handoverTo, 
      closingNotes 
    } = req.body;

    let shift = null;
    if (shiftId) {
      shift = await CashierShift.findOne({ _id: shiftId, organizationId: orgId });
    } else {
      shift = await CashierShift.findOne({ organizationId: orgId, status: 'Open' }).sort({ createdAt: -1 });
    }

    if (!shift) {
      return next(new AppError('No active open cashier shift found to close', 404));
    }

    const endTime = new Date();

    // Recompute total system cash during this shift window
    const receipts = await LabPaymentReceipt.find({
      organizationId: orgId,
      paymentDate: { $gte: shift.startTime, $lte: endTime }
    });

    let systemCash = 0;
    let systemUPI = 0;
    let systemCard = 0;
    let systemBankTransfer = 0;
    let systemCheque = 0;

    receipts.forEach(r => {
      const amt = r.amount || 0;
      switch (r.paymentMethod) {
        case 'Cash': systemCash += amt; break;
        case 'UPI': systemUPI += amt; break;
        case 'Card': systemCard += amt; break;
        case 'Bank Transfer': systemBankTransfer += amt; break;
        case 'Cheque': systemCheque += amt; break;
        default: systemCash += amt;
      }
    });

    const systemTotal = systemCash + systemUPI + systemCard + systemBankTransfer + systemCheque;
    const counted = Number(physicalCashCounted) || 0;
    const expectedCashInDrawer = (shift.openingCashFloat || 0) + systemCash;
    const variance = counted - expectedCashInDrawer;

    shift.status = 'Closed';
    shift.endTime = endTime;
    shift.systemCash = systemCash;
    shift.systemUPI = systemUPI;
    shift.systemCard = systemCard;
    shift.systemBankTransfer = systemBankTransfer;
    shift.systemCheque = systemCheque;
    shift.systemTotal = systemTotal;
    shift.totalTransactions = receipts.length;
    shift.denominations = denominations || shift.denominations;
    shift.physicalCashCounted = counted;
    shift.variance = variance;
    shift.handoverTo = handoverTo || '';
    shift.closingNotes = closingNotes || '';
    shift.closedBy = req.user._id;

    await shift.save();

    res.status(200).json({
      status: 'success',
      message: 'Cashier register shift closed and reconciled successfully',
      data: { shift }
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftHistory = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const shifts = await CashierShift.find({ organizationId: orgId })
      .populate('cashier', 'name email role')
      .populate('closedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      status: 'success',
      results: shifts.length,
      data: { shifts }
    });
  } catch (error) {
    next(error);
  }
};
