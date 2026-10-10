import User from '../models/User.js';
import Patient from '../models/Patient.js';
import Order from '../models/Order.js';
import Sample from '../models/Sample.js';
import Result from '../models/Result.js';
import AppError from '../utils/AppError.js';

// Get all patients
export const getPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find({ organizationId: req.user.organizationId._id || req.user.organizationId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: patients.length,
      data: { patients }
    });
  } catch (error) {
    next(error);
  }
};

// Get single patient
export const getPatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOne({
      _id: req.params.id,
      organizationId: req.user.organizationId._id || req.user.organizationId
    });

    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// Get full patient details (with orders, samples, results)
export const getPatientFullDetails = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    
    const patient = await Patient.findOne({ _id: req.params.id, organizationId: orgId });
    if (!patient) return next(new AppError('Patient not found', 404));

    const orders = await Order.find({ patient: patient._id, organizationId: orgId })
      .populate('tests.test', 'name testId price')
      .sort({ createdAt: -1 });

    const samples = await Sample.find({ patient: patient._id, organizationId: orgId })
      .sort({ createdAt: -1 });

    const results = await Result.find({ patient: patient._id, organizationId: orgId })
      .populate('test', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { patient, orders, samples, results }
    });
  } catch (error) {
    next(error);
  }
};

// Create patient
export const createPatient = async (req, res, next) => {
  try {
    const patientData = {
      ...req.body,
      organizationId: req.user.organizationId._id || req.user.organizationId,
      createdBy: req.user._id
    };

    const patient = await Patient.create(patientData);

    res.status(201).json({
      status: 'success',
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// Update patient
export const updatePatient = async (req, res, next) => {
  try {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId._id || req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!patient) {
      return next(new AppError('Patient not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { patient }
    });
  } catch (error) {
    next(error);
  }
};

// Get longitudinal cumulative parameter trends across patient visits
export const getPatientCumulativeTrends = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const patientId = req.params.id;

    const results = await Result.find({ patient: patientId, organizationId: orgId })
      .populate('order', 'orderNumber createdAt orderStatus')
      .populate('test', 'name category method')
      .sort({ createdAt: 1 }); // chronological

    // Group parameters across all tests and dates
    const parameterMap = {};

    results.forEach(resItem => {
      const orderDate = resItem.order?.createdAt || resItem.createdAt;
      const orderNumber = resItem.order?.orderNumber || 'ORD-HIST';

      (resItem.parameters || []).forEach(param => {
        if (!param.name) return;
        const paramKey = param.name.trim();

        if (!parameterMap[paramKey]) {
          parameterMap[paramKey] = {
            parameterName: paramKey,
            unit: param.unit || '',
            referenceRange: param.referenceRange || '',
            testName: resItem.test?.name || 'Lab Test',
            history: []
          };
        }

        const numVal = parseFloat(String(param.value || '').replace(/,/g, ''));

        parameterMap[paramKey].history.push({
          resultId: resItem._id,
          orderNumber,
          date: orderDate,
          dateFormatted: new Date(orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawValue: param.value,
          numericValue: !isNaN(numVal) ? numVal : null,
          isAbnormal: param.isAbnormal || false,
          flag: param.flag || 'NORMAL',
          remarks: resItem.remarks || ''
        });
      });
    });

    const trendableParameters = Object.values(parameterMap).filter(p => 
      p.history.some(h => h.numericValue !== null)
    );

    res.status(200).json({
      status: 'success',
      data: {
        parameters: trendableParameters,
        allParameters: Object.values(parameterMap)
      }
    });
  } catch (error) {
    next(error);
  }
};

