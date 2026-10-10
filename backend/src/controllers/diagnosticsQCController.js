import QualityControl from '../models/QualityControl.js';
import AppError from '../utils/AppError.js';
import { evaluateWestgardRules } from '../utils/westgardRules.js';

/**
 * Get all QC lots with runs and summary statistics
 */
export const getQCLots = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { department, status = 'ACTIVE' } = req.query;

    const filter = { organizationId: orgId };
    if (department) filter.department = department;
    if (status !== 'ALL') filter.status = status;

    let lots = await QualityControl.find(filter).sort({ updatedAt: -1 });

    // If completely empty, auto-seed realistic sample controls
    if (lots.length === 0) {
      await autoSeedQC(orgId);
      lots = await QualityControl.find(filter).sort({ updatedAt: -1 });
    }

    // Compute live stats for each lot
    const enrichedLots = lots.map(lot => {
      const runs = lot.runs || [];
      const totalRuns = runs.length;
      const inControlRuns = runs.filter(r => r.status === 'IN_CONTROL').length;
      const warningRuns = runs.filter(r => r.status === 'WARNING').length;
      const outOfControlRuns = runs.filter(r => r.status === 'OUT_OF_CONTROL').length;
      
      const lastRun = runs.length > 0 ? runs[runs.length - 1] : null;
      
      // Calculate running mean and running SD
      let runningMean = lot.targetMean;
      let runningSD = lot.targetSD;
      let runningCV = lot.targetCV;

      if (runs.length >= 2) {
        const values = runs.map(r => r.observedValue);
        runningMean = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
        const variance = values.reduce((sum, val) => sum + Math.pow(val - runningMean, 2), 0) / (values.length - 1);
        runningSD = Number(Math.sqrt(variance).toFixed(2));
        runningCV = runningMean > 0 ? Number(((runningSD / runningMean) * 100).toFixed(2)) : 0;
      }

      return {
        ...lot.toObject(),
        statistics: {
          totalRuns,
          inControlRuns,
          warningRuns,
          outOfControlRuns,
          passRate: totalRuns > 0 ? Number(((inControlRuns / totalRuns) * 100).toFixed(1)) : 100,
          runningMean,
          runningSD,
          runningCV,
          currentStatus: lastRun ? lastRun.status : 'NO_DATA'
        }
      };
    });

    res.status(200).json({
      status: 'success',
      data: { lots: enrichedLots }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register a new QC Control Material Lot
 */
export const createQCLot = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const {
      controlName,
      analyzerName,
      department,
      parameterName,
      unit,
      level,
      lotNumber,
      targetMean,
      targetSD,
      expiryDate
    } = req.body;

    if (!controlName || !analyzerName || !parameterName || !lotNumber || !targetMean || !targetSD) {
      return next(new AppError('Missing required QC lot configuration parameters', 400));
    }

    const newLot = await QualityControl.create({
      organizationId: orgId,
      controlName,
      analyzerName,
      department: department || 'Biochemistry',
      parameterName,
      unit: unit || '',
      level: level || 'Level 1 (Normal)',
      lotNumber,
      targetMean: parseFloat(targetMean),
      targetSD: parseFloat(targetSD),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      runs: []
    });

    res.status(201).json({
      status: 'success',
      data: { lot: newLot }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record daily QC control observation & trigger Westgard Multi-Rules Engine
 */
export const recordQCRun = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { lotId } = req.params;
    const { observedValue, correctiveAction } = req.body;

    if (observedValue === undefined || observedValue === null || isNaN(parseFloat(observedValue))) {
      return next(new AppError('Valid numeric observed value is required', 400));
    }

    const lot = await QualityControl.findOne({ _id: lotId, organizationId: orgId });
    if (!lot) {
      return next(new AppError('Quality control lot not found', 404));
    }

    const numVal = parseFloat(observedValue);
    const historicalRuns = lot.runs || [];

    // Evaluate Westgard Multi-Rules Engine
    const ruleEvaluation = evaluateWestgardRules(numVal, lot.targetMean, lot.targetSD, historicalRuns);

    const runNumber = historicalRuns.length + 1;
    const newRun = {
      date: new Date(),
      runNumber,
      observedValue: numVal,
      zScore: ruleEvaluation.zScore,
      status: ruleEvaluation.status,
      violationRule: ruleEvaluation.violationRule,
      violationDescription: ruleEvaluation.violationDescription,
      technicianName: req.user.name || 'Lab Technologist',
      correctiveAction: correctiveAction || '',
      actionTakenBy: correctiveAction ? req.user.name : '',
      resolved: ruleEvaluation.status !== 'OUT_OF_CONTROL' || !!correctiveAction
    };

    lot.runs.push(newRun);
    await lot.save();

    res.status(200).json({
      status: 'success',
      data: {
        run: newRun,
        evaluation: ruleEvaluation,
        lot
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log CAPA Corrective Action for an Out-of-Control QC Run
 */
export const logQCCorrectiveAction = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const { lotId, runId } = req.params;
    const { correctiveAction } = req.body;

    if (!correctiveAction) {
      return next(new AppError('Corrective action description is required', 400));
    }

    const lot = await QualityControl.findOne({ _id: lotId, organizationId: orgId });
    if (!lot) return next(new AppError('QC lot not found', 404));

    const run = lot.runs.id(runId);
    if (!run) return next(new AppError('QC run not found', 404));

    run.correctiveAction = correctiveAction;
    run.actionTakenBy = req.user.name || 'Quality Manager';
    run.resolved = true;

    await lot.save();

    res.status(200).json({
      status: 'success',
      data: { run }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to auto-seed realistic NABL IQC data for clinical demonstration
 */
async function autoSeedQC(orgId) {
  const seedLots = [
    {
      controlName: 'Bio-Rad Liquichek Immunology Control',
      analyzerName: 'Roche Cobas c311 Chemistry Analyzer',
      department: 'Biochemistry',
      parameterName: 'Blood Glucose (Fasting)',
      unit: 'mg/dL',
      level: 'Level 1 (Normal)',
      lotNumber: 'LOT-2026-GLU101',
      targetMean: 95.0,
      targetSD: 3.2,
      expiryDate: new Date('2026-12-31')
    },
    {
      controlName: 'Bio-Rad Liquichek Lipids Control',
      analyzerName: 'Roche Cobas c311 Chemistry Analyzer',
      department: 'Biochemistry',
      parameterName: 'Serum Total Cholesterol',
      unit: 'mg/dL',
      level: 'Level 2 (High / Pathological)',
      lotNumber: 'LOT-2026-LIP202',
      targetMean: 240.0,
      targetSD: 6.5,
      expiryDate: new Date('2026-11-30')
    },
    {
      controlName: 'Sysmex Eightcheck-3WP Tri-Level',
      analyzerName: 'Sysmex XN-350 5-Part Hematology',
      department: 'Hematology',
      parameterName: 'Hemoglobin (Hb)',
      unit: 'g/dL',
      level: 'Level 1 (Normal)',
      lotNumber: 'LOT-2026-HEM303',
      targetMean: 13.8,
      targetSD: 0.35,
      expiryDate: new Date('2026-10-31')
    },
    {
      controlName: 'Sysmex Eightcheck-3WP Tri-Level',
      analyzerName: 'Sysmex XN-350 5-Part Hematology',
      department: 'Hematology',
      parameterName: 'Platelet Count',
      unit: '10^3/µL',
      level: 'Level 1 (Normal)',
      lotNumber: 'LOT-2026-PLT404',
      targetMean: 215.0,
      targetSD: 9.0,
      expiryDate: new Date('2026-10-31')
    }
  ];

  for (const item of seedLots) {
    // Generate 20 daily runs spanning past 20 days
    const runs = [];
    for (let day = 20; day >= 1; day--) {
      const d = new Date();
      d.setDate(d.getDate() - day);
      d.setHours(8, 30, 0, 0);

      // Random variation around targetMean using Box-Muller transform
      const u1 = Math.random();
      const u2 = Math.random();
      const randStdNormal = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      
      // Inject 1 isolated 1_2s warning and 1 controlled point
      let val = item.targetMean + (randStdNormal * item.targetSD * 0.85);
      if (day === 4 && item.parameterName.includes('Cholesterol')) {
        val = item.targetMean + (2.3 * item.targetSD); // Warning 1_2s
      }

      val = Number(val.toFixed(1));
      const zScore = Number(((val - item.targetMean) / item.targetSD).toFixed(2));
      const absZ = Math.abs(zScore);

      let status = 'IN_CONTROL';
      let violationRule = null;
      let violationDesc = 'In Control';

      if (absZ > 3.0) {
        status = 'OUT_OF_CONTROL';
        violationRule = '1_3s';
        violationDesc = '1_3s Rule Violated';
      } else if (absZ > 2.0) {
        status = 'WARNING';
        violationRule = '1_2s';
        violationDesc = '1_2s Warning Rule';
      }

      runs.push({
        date: d,
        runNumber: 21 - day,
        observedValue: val,
        zScore,
        status,
        violationRule,
        violationDescription: violationDesc,
        technicianName: 'Dr. Anita Roy (Biochemist)',
        correctiveAction: status !== 'IN_CONTROL' ? 'Reagent pack inspected. Quality confirmed on duplicate run.' : '',
        actionTakenBy: status !== 'IN_CONTROL' ? 'Dr. Anita Roy' : '',
        resolved: true
      });
    }

    await QualityControl.create({
      organizationId: orgId,
      ...item,
      runs
    });
  }
}
