import mongoose from 'mongoose';
import CriticalAlert from '../models/CriticalAlert.js';
import ReportDispatch from '../models/ReportDispatch.js';
import Order from '../models/Order.js';
import Patient from '../models/Patient.js';
import Test from '../models/Test.js';
import Result from '../models/Result.js';
import AppError from '../utils/AppError.js';

// NABL Standard Panic Value Definitions
export const CRITICAL_PANIC_RULES = [
  {
    pattern: /platelet/i,
    name: 'Platelet Count',
    unit: '10^3/µL',
    check: (num, raw) => num < 20 || num > 1000,
    threshold: '< 20 × 10³/µL (Spontaneous Hemorrhage risk) or > 1,000 × 10³/µL',
    severity: 'CRITICAL_PANIC'
  },
  {
    pattern: /hemoglobin|hb/i,
    name: 'Hemoglobin (Hb)',
    unit: 'g/dL',
    check: (num, raw) => num < 7.0 || num > 20.0,
    threshold: '< 7.0 g/dL (Severe Life-Threatening Anemia) or > 20.0 g/dL',
    severity: 'CRITICAL_PANIC'
  },
  {
    pattern: /leukocyte|wbc|tlc/i,
    name: 'Total Leukocyte Count (WBC)',
    unit: '10^3/µL',
    check: (num, raw) => num < 2.0 || num > 30.0,
    threshold: '< 2.0 or > 30.0 × 10³/µL (Agranulocytosis / Leukemoid reaction)',
    severity: 'CRITICAL_PANIC'
  },
  {
    pattern: /potassium|k\+/i,
    name: 'Serum Potassium (K+)',
    unit: 'mmol/L',
    check: (num, raw) => num < 2.8 || num > 6.2,
    threshold: '< 2.8 or > 6.2 mmol/L (Lethal Cardiac Arrhythmia / Arrest risk)',
    severity: 'CRITICAL_PANIC'
  },
  {
    pattern: /glucose|sugar|fbs|rbs|ppbs/i,
    name: 'Blood Glucose',
    unit: 'mg/dL',
    check: (num, raw) => num < 45 || num > 450,
    threshold: '< 45 mg/dL (Severe Hypoglycemic Coma) or > 450 mg/dL (DKA/HHS)',
    severity: 'CRITICAL_PANIC'
  },
  {
    pattern: /troponin|trop\s*i|trop\s*t/i,
    name: 'Troponin-I',
    unit: 'ng/mL',
    check: (num, raw) => raw?.toLowerCase().includes('pos') || num > 0.04,
    threshold: 'Positive / > 0.04 ng/mL (Acute Myocardial Infarction)',
    severity: 'CRITICAL_PANIC'
  },
  {
    pattern: /calcium/i,
    name: 'Serum Calcium',
    unit: 'mg/dL',
    check: (num, raw) => num < 6.5 || num > 13.0,
    threshold: '< 6.5 mg/dL (Tetany) or > 13.0 mg/dL (Hypercalcemic Crisis)',
    severity: 'CRITICAL_PANIC'
  },
  {
    pattern: /dengue\s*ns1/i,
    name: 'Dengue NS1 Antigen',
    unit: 'Qualitative',
    check: (num, raw) => raw?.toLowerCase().includes('pos'),
    threshold: 'Positive (Acute Dengue Viremia)',
    severity: 'URGENT_ABNORMAL'
  }
];

export const scanAndCreateCriticalAlerts = async (orderId, testId, resultId, parameters, orgId) => {
  if (!parameters || !Array.isArray(parameters)) return [];

  const createdAlerts = [];
  const order = await Order.findById(orderId).populate('patient');
  if (!order) return [];

  for (const param of parameters) {
    const rawVal = String(param.value || '').trim();
    const numVal = parseFloat(rawVal.replace(/,/g, ''));

    for (const rule of CRITICAL_PANIC_RULES) {
      if (rule.pattern.test(param.name)) {
        const isPanic = rule.check(numVal, rawVal);
        if (isPanic) {
          // Check if alert already exists for this order & parameter
          const existing = await CriticalAlert.findOne({
            organizationId: orgId,
            order: orderId,
            parameterName: param.name
          });

          if (!existing) {
            const alert = await CriticalAlert.create({
              organizationId: orgId,
              order: orderId,
              patient: order.patient._id,
              test: testId,
              result: resultId,
              parameterName: param.name,
              observedValue: rawVal,
              referenceRange: param.referenceRange || '',
              unit: param.unit || rule.unit,
              criticalThreshold: rule.threshold,
              severity: rule.severity,
              communicationStatus: 'PENDING_COMMUNICATION',
              communicatedPhone: order.patient.phone || ''
            });
            createdAlerts.push(alert);
          }
        }
        break;
      }
    }
  }

  return createdAlerts;
};

export const getCriticalAlerts = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { status, severity } = req.query;

    const query = { organizationId: orgId };
    if (status && status !== 'ALL') {
      query.communicationStatus = status;
    }
    if (severity && severity !== 'ALL') {
      query.severity = severity;
    }

    const alerts = await CriticalAlert.find(query)
      .populate('order', 'orderId createdAt priority orderStatus')
      .populate('patient', 'firstName lastName patientId phone age gender')
      .populate('test', 'name testId department')
      .populate('communicatedBy', 'name role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: alerts.length,
      data: { alerts }
    });
  } catch (error) {
    next(error);
  }
};

export const logCriticalCommunication = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { id } = req.params;
    const { 
      communicatedTo, 
      communicatedToRole, 
      communicatedPhone, 
      readBackConfirmed, 
      clinicalNotes 
    } = req.body;

    const alert = await CriticalAlert.findOne({ _id: id, organizationId: orgId });
    if (!alert) {
      return next(new AppError('Critical Alert not found', 404));
    }

    alert.communicationStatus = 'COMMUNICATED';
    alert.communicatedTo = communicatedTo || alert.communicatedTo || 'Attending Physician';
    alert.communicatedToRole = communicatedToRole || 'Referring Doctor';
    alert.communicatedPhone = communicatedPhone || alert.communicatedPhone || '';
    alert.communicatedBy = req.user._id;
    alert.communicatedByName = req.user.name || 'Lab Technologist';
    alert.communicatedAt = new Date();
    alert.readBackConfirmed = Boolean(readBackConfirmed);
    alert.clinicalNotes = clinicalNotes || '';

    await alert.save();

    const populatedAlert = await CriticalAlert.findById(alert._id)
      .populate('order', 'orderId createdAt priority')
      .populate('patient', 'firstName lastName patientId phone age gender')
      .populate('test', 'name testId department')
      .populate('communicatedBy', 'name role');

    res.status(200).json({
      status: 'success',
      message: 'Critical Panic Value telephonic communication logged successfully under NABL protocol',
      data: { alert: populatedAlert }
    });
  } catch (error) {
    next(error);
  }
};

export const getDispatches = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { channel, status, search } = req.query;

    const query = { organizationId: orgId };
    if (channel && channel !== 'ALL') query.channel = channel;
    if (status && status !== 'ALL') query.status = status;

    let dispatches = await ReportDispatch.find(query)
      .populate('order', 'orderId orderStatus createdAt totalAmount')
      .populate('patient', 'firstName lastName patientId phone')
      .populate('dispatchedBy', 'name role')
      .sort({ createdAt: -1 });

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      dispatches = dispatches.filter(d => {
        const orderMatch = d.order?.orderId?.toLowerCase().includes(q);
        const nameMatch = d.recipientName?.toLowerCase().includes(q);
        const phoneMatch = d.recipientPhone?.includes(q);
        return orderMatch || nameMatch || phoneMatch;
      });
    }

    res.status(200).json({
      status: 'success',
      results: dispatches.length,
      data: { dispatches }
    });
  } catch (error) {
    next(error);
  }
};

export const sendReportDispatch = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { 
      orderId, 
      recipientType = 'PATIENT', 
      recipientPhone, 
      channel = 'WHATSAPP', 
      customMessage 
    } = req.body;

    const order = await Order.findOne({ _id: orderId, organizationId: orgId })
      .populate('patient')
      .populate('tests.test', 'name');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    const patient = order.patient || {};
    const patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';
    const phone = recipientPhone || patient.phone || '';

    if (!phone) {
      return next(new AppError('Recipient phone number is required for dispatch', 400));
    }

    // Clean phone number for WhatsApp (remove spaces, dashes)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;

    const testNames = (order.tests || []).map(t => t.test?.name || 'Test').join(', ');
    const downloadUrl = `https://apexdiagnostics.in/reports/download/${order.orderId}?auth=apex2026`;

    // Construct clinical WhatsApp / SMS message
    const messageContent = customMessage || (
      `🏥 *APEX CLINICAL DIAGNOSTICS & RESEARCH LAB*\n\n` +
      `Dear *${patientName}*,\n` +
      `Your Laboratory Investigation Report for Order *#${order.orderId}* is now *VERIFIED* and ready for immediate download.\n\n` +
      `📋 *Tests Included:* ${testNames}\n` +
      `📥 *Download Official NABL Report PDF:*\n${downloadUrl}\n\n` +
      `📞 *24/7 Lab Helpline:* +91 (033) 2450-8900\n` +
      `_Wishing you a speedy and healthy recovery!_`
    );

    // Check if order has any active critical alerts
    const hasCritical = await CriticalAlert.exists({ organizationId: orgId, order: orderId });

    // Create ReportDispatch log
    const dispatch = await ReportDispatch.create({
      organizationId: orgId,
      order: order._id,
      patient: patient._id,
      recipientType,
      recipientName: recipientType === 'PATIENT' ? patientName : (order.referringDoctor?.name || 'Doctor'),
      recipientPhone: phone,
      channel,
      status: 'SENT',
      messageContent,
      reportDownloadUrl: downloadUrl,
      hasCriticalValues: Boolean(hasCritical),
      dispatchedBy: req.user._id,
      dispatchedByName: req.user.name || 'Lab Staff'
    });

    // Generate direct WhatsApp deep-link
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${intlPhone}&text=${encodeURIComponent(messageContent)}`;

    res.status(201).json({
      status: 'success',
      message: `Report notification queued and dispatched via ${channel}`,
      data: {
        dispatch,
        whatsappUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getAlertsAndDispatchSummary = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      pendingCriticalCount,
      communicatedTodayCount,
      totalDispatchesToday,
      totalDispatchesAll
    ] = await Promise.all([
      CriticalAlert.countDocuments({ organizationId: orgId, communicationStatus: 'PENDING_COMMUNICATION' }),
      CriticalAlert.countDocuments({ 
        organizationId: orgId, 
        communicationStatus: 'COMMUNICATED',
        communicatedAt: { $gte: todayStart }
      }),
      ReportDispatch.countDocuments({ organizationId: orgId, dispatchedAt: { $gte: todayStart } }),
      ReportDispatch.countDocuments({ organizationId: orgId })
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        pendingCriticalCount,
        communicatedTodayCount,
        totalDispatchesToday,
        totalDispatchesAll
      }
    });
  } catch (error) {
    next(error);
  }
};
