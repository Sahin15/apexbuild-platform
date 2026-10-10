import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Test from '../models/Test.js';
import Sample from '../models/Sample.js';
import Result from '../models/Result.js';
import Patient from '../models/Patient.js';
import AppError from '../utils/AppError.js';

// Department Category Mappings
export const DEPARTMENT_MAPPINGS = {
  Hematology: ['Hematology', 'Hemato', 'Blood', 'CBC', 'Coagulation', 'Clinical Pathology'],
  Biochemistry: ['Biochemistry', 'Clinical Chemistry', 'Liver', 'Kidney', 'Metabolic', 'Lipid', 'Endocrine'],
  Microbiology: ['Microbiology', 'Serology', 'Infectious', 'Urine', 'Stool', 'Culture'],
  Radiology: ['Radiology', 'Imaging', 'X-Ray', 'Ultrasound', 'USG', 'ECG', 'CT', 'MRI'],
  Immunology: ['Immunology', 'Hormones', 'Thyroid', 'Tumor Marker', 'Vitamin']
};

export const normalizeDepartment = (dept = '', category = '', testName = '') => {
  const combined = `${dept} ${category} ${testName}`.toLowerCase();
  if (combined.includes('hemat') || combined.includes('cbc') || combined.includes('blood count') || combined.includes('esr') || combined.includes('smear')) {
    return 'Hematology';
  }
  if (combined.includes('micro') || combined.includes('sero') || combined.includes('urine') || combined.includes('dengue') || combined.includes('widal') || combined.includes('culture')) {
    return 'Microbiology';
  }
  if (combined.includes('radio') || combined.includes('x-ray') || combined.includes('xray') || combined.includes('ecg') || combined.includes('usg') || combined.includes('scan') || combined.includes('ultrasound')) {
    return 'Radiology';
  }
  if (combined.includes('immuno') || combined.includes('hormone') || combined.includes('thyroid') || combined.includes('vitamin') || combined.includes('tsh')) {
    return 'Immunology';
  }
  if (combined.includes('bio') || combined.includes('chem') || combined.includes('lipid') || combined.includes('lft') || combined.includes('kft') || combined.includes('glucose') || combined.includes('sugar')) {
    return 'Biochemistry';
  }
  return dept || 'Clinical Pathology';
};

export const getDepartmentalWorklist = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { department, priority, tatFilter, search, stage } = req.query;

    // Fetch active lab orders
    const orders = await Order.find({
      organizationId: orgId,
      orderStatus: { $in: ['Registered', 'Sample Pending', 'Partially Collected', 'Collected', 'Processing', 'Partial Results'] }
    })
    .populate('patient')
    .populate('referringDoctor', 'name')
    .populate({
      path: 'tests.test',
      select: 'name testId category department sampleType containerType turnaroundTime tatHours parameters price'
    })
    .sort({ createdAt: -1 });

    const orderIds = orders.map(o => o._id);

    // Fetch associated samples
    const samples = await Sample.find({
      organizationId: orgId,
      order: { $in: orderIds }
    });

    // Fetch associated results
    const results = await Result.find({
      organizationId: orgId,
      order: { $in: orderIds }
    });

    const now = new Date();
    const worklistItems = [];

    orders.forEach(order => {
      const patient = order.patient || {};
      const orderPriority = order.priority || 'Routine';

      (order.tests || []).forEach(testItem => {
        const test = testItem.test;
        if (!test) return;

        const dept = normalizeDepartment(test.department, test.category, test.name);

        // Department filter
        if (department && department !== 'All' && dept.toLowerCase() !== department.toLowerCase()) {
          return;
        }

        // Priority filter
        if (priority && priority !== 'All' && orderPriority !== priority) {
          return;
        }

        // Find associated sample
        const matchingSample = samples.find(s => 
          s.order.toString() === order._id.toString() &&
          s.tests.some(t => t.toString() === test._id.toString())
        );

        // Find associated result
        const matchingResult = results.find(r => 
          r.order.toString() === order._id.toString() &&
          r.test.toString() === test._id.toString()
        );

        // Determine workflow stage
        let workflowStage = 'AWAITING_SAMPLE';
        if (matchingResult?.status === 'Verified') {
          workflowStage = 'VERIFIED';
        } else if (matchingResult?.status === 'Final' || matchingResult?.status === 'Draft') {
          workflowStage = 'RESULT_DRAFT';
        } else if (matchingSample?.status === 'Processing') {
          workflowStage = 'PROCESSING';
        } else if (matchingSample?.status === 'In Lab') {
          workflowStage = 'IN_LAB';
        } else if (matchingSample?.status === 'Collected') {
          workflowStage = 'SAMPLE_COLLECTED';
        } else if (test.sampleType === 'None' || !test.sampleType) {
          workflowStage = 'IN_LAB'; // Radiology or non-sample investigations
        }

        if (stage && stage !== 'All' && workflowStage !== stage) {
          return;
        }

        // TAT SLA Calculation
        const tatHours = test.tatHours || 4;
        const targetDate = new Date(new Date(order.createdAt).getTime() + (tatHours * 3600000));
        const remainingMinutes = Math.round((targetDate - now) / 60000);
        const elapsedMinutes = Math.round((now - new Date(order.createdAt)) / 60000);

        let tatStatus = 'ON_TRACK';
        if (workflowStage === 'VERIFIED') {
          tatStatus = 'COMPLETED';
        } else if (remainingMinutes < 0) {
          tatStatus = 'BREACHED';
        } else if (remainingMinutes <= 45) {
          tatStatus = 'NEAR_BREACH';
        }

        if (tatFilter && tatFilter !== 'ALL' && tatStatus !== tatFilter) {
          return;
        }

        const patientFullName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Patient';

        // Search filter
        if (search && search.trim() !== '') {
          const q = search.trim().toLowerCase();
          const matchPatient = patientFullName.toLowerCase().includes(q) || patient.patientId?.toLowerCase().includes(q) || patient.phone?.includes(q);
          const matchOrder = order.orderId?.toLowerCase().includes(q);
          const matchTest = test.name.toLowerCase().includes(q) || test.testId?.toLowerCase().includes(q);
          const matchBarcode = matchingSample?.barcode?.toLowerCase().includes(q);
          if (!matchPatient && !matchOrder && !matchTest && !matchBarcode) {
            return;
          }
        }

        worklistItems.push({
          id: `${order._id}_${test._id}`,
          orderId: order._id,
          orderNumber: order.orderId,
          orderDate: order.createdAt,
          priority: orderPriority,
          patient: {
            id: patient._id,
            name: patientFullName,
            patientId: patient.patientId || 'PID-NEW',
            age: patient.age,
            gender: patient.gender,
            phone: patient.phone
          },
          doctor: order.referringDoctor?.name || 'Self / Walk-In',
          test: {
            id: test._id,
            name: test.name,
            testId: test.testId,
            department: dept,
            category: test.category || 'General',
            sampleType: test.sampleType || 'Specimen',
            containerType: test.containerType || 'Standard',
            parameters: test.parameters || [],
            tatHours
          },
          sample: matchingSample ? {
            id: matchingSample._id,
            barcode: matchingSample.barcode || matchingSample.sampleId,
            sampleType: matchingSample.sampleType,
            containerType: matchingSample.containerType,
            status: matchingSample.status,
            collectedAt: matchingSample.collectedAt,
            receivedInLabAt: matchingSample.receivedInLabAt
          } : null,
          result: matchingResult ? {
            id: matchingResult._id,
            status: matchingResult.status,
            verifiedAt: matchingResult.verifiedAt,
            parameters: matchingResult.parameters || []
          } : null,
          workflowStage,
          tat: {
            tatHours,
            targetDate,
            remainingMinutes,
            elapsedMinutes,
            tatStatus
          }
        });
      });
    });

    // Sort: STAT first, then Breached / Near Breach, then remaining time ascending
    worklistItems.sort((a, b) => {
      if (a.priority === 'STAT' && b.priority !== 'STAT') return -1;
      if (b.priority === 'STAT' && a.priority !== 'STAT') return 1;

      if (a.tat.tatStatus === 'BREACHED' && b.tat.tatStatus !== 'BREACHED') return -1;
      if (b.tat.tatStatus === 'BREACHED' && a.tat.tatStatus !== 'BREACHED') return 1;

      if (a.tat.tatStatus === 'NEAR_BREACH' && b.tat.tatStatus === 'ON_TRACK') return -1;
      if (b.tat.tatStatus === 'NEAR_BREACH' && a.tat.tatStatus === 'ON_TRACK') return 1;

      return a.tat.remainingMinutes - b.tat.remainingMinutes;
    });

    res.status(200).json({
      status: 'success',
      results: worklistItems.length,
      data: { worklist: worklistItems }
    });
  } catch (error) {
    next(error);
  }
};

export const getTatAnalytics = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const now = new Date();

    const orders = await Order.find({
      organizationId: orgId,
      orderStatus: { $ne: 'Cancelled' },
      createdAt: { $gte: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) } // Last 7 days
    }).populate('tests.test', 'name category department tatHours');

    let totalActive = 0;
    let onTrackCount = 0;
    let nearBreachCount = 0;
    let breachedCount = 0;
    let statCount = 0;

    const departmentStats = {
      Hematology: { total: 0, breached: 0, onTrack: 0 },
      Biochemistry: { total: 0, breached: 0, onTrack: 0 },
      Microbiology: { total: 0, breached: 0, onTrack: 0 },
      Radiology: { total: 0, breached: 0, onTrack: 0 },
      Immunology: { total: 0, breached: 0, onTrack: 0 }
    };

    orders.forEach(order => {
      const isCompleted = order.orderStatus === 'Completed';
      const isStat = order.priority === 'STAT';
      if (isStat && !isCompleted) statCount++;

      (order.tests || []).forEach(testItem => {
        const test = testItem.test;
        if (!test) return;
        totalActive++;

        const dept = normalizeDepartment(test.department, test.category, test.name);
        if (!departmentStats[dept]) {
          departmentStats[dept] = { total: 0, breached: 0, onTrack: 0 };
        }
        departmentStats[dept].total++;

        if (isCompleted) {
          departmentStats[dept].onTrack++;
          onTrackCount++;
          return;
        }

        const tatHours = test.tatHours || 4;
        const targetDate = new Date(new Date(order.createdAt).getTime() + (tatHours * 3600000));
        const remainingMinutes = Math.round((targetDate - now) / 60000);

        if (remainingMinutes < 0) {
          breachedCount++;
          departmentStats[dept].breached++;
        } else if (remainingMinutes <= 45) {
          nearBreachCount++;
          departmentStats[dept].onTrack++;
        } else {
          onTrackCount++;
          departmentStats[dept].onTrack++;
        }
      });
    });

    const slaComplianceRate = totalActive > 0 
      ? (((totalActive - breachedCount) / totalActive) * 100).toFixed(1) 
      : '100.0';

    res.status(200).json({
      status: 'success',
      data: {
        totalActive,
        onTrackCount,
        nearBreachCount,
        breachedCount,
        statCount,
        slaComplianceRate,
        departmentStats
      }
    });
  } catch (error) {
    next(error);
  }
};

export const batchUpdateWorklistStatus = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { sampleIds, orderIds, newStatus } = req.body;

    const timestamp = new Date();

    if (sampleIds && sampleIds.length > 0) {
      const updateData = { status: newStatus };
      if (newStatus === 'In Lab') {
        updateData.receivedInLabAt = timestamp;
        updateData.receivedInLabBy = req.user._id;
      } else if (newStatus === 'Processing') {
        updateData.processingAt = timestamp;
        updateData.processedBy = req.user._id;
      } else if (newStatus === 'Tested') {
        updateData.testedAt = timestamp;
        updateData.testedBy = req.user._id;
      }

      await Sample.updateMany(
        { _id: { $in: sampleIds }, organizationId: orgId },
        { $set: updateData }
      );
    }

    if (orderIds && orderIds.length > 0) {
      let orderStatusToSet = newStatus === 'Processing' ? 'Processing' : 
                             newStatus === 'In Lab' ? 'Collected' : undefined;
      if (orderStatusToSet) {
        await Order.updateMany(
          { _id: { $in: orderIds }, organizationId: orgId },
          { $set: { orderStatus: orderStatusToSet } }
        );
      }
    }

    res.status(200).json({
      status: 'success',
      message: `Batch updated ${sampleIds?.length || orderIds?.length || 0} items to ${newStatus}`
    });
  } catch (error) {
    next(error);
  }
};
