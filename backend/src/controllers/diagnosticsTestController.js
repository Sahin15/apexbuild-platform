import Test from '../models/Test.js';
import AppError from '../utils/AppError.js';

export const getTests = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    let tests = await Test.find({ organizationId: orgId })
      .populate('includedTests')
      .sort({ isPackage: -1, category: 1, name: 1 });

    // If no packages exist yet, auto-seed popular Master Health Packages
    const packageCount = tests.filter(t => t.isPackage).length;
    if (packageCount === 0 && tests.length > 0) {
      await autoSeedHealthPackages(orgId, tests, req.user._id);
      tests = await Test.find({ organizationId: orgId })
        .populate('includedTests')
        .sort({ isPackage: -1, category: 1, name: 1 });
    }

    res.status(200).json({
      status: 'success',
      results: tests.length,
      data: { tests }
    });
  } catch (error) {
    next(error);
  }
};

export const createTest = async (req, res, next) => {
  try {
    const orgId = req.user.organizationId._id || req.user.organizationId;
    const testData = {
      ...req.body,
      organizationId: orgId,
      createdBy: req.user._id
    };

    // If creating a package, copy parameters from included tests if not provided
    if (testData.isPackage && Array.isArray(testData.includedTests) && testData.includedTests.length > 0) {
      if (!testData.parameters || testData.parameters.length === 0) {
        const bundled = await Test.find({ _id: { $in: testData.includedTests }, organizationId: orgId });
        const allParams = [];
        bundled.forEach(b => {
          (b.parameters || []).forEach(p => {
            allParams.push({
              name: `${b.name} - ${p.name}`,
              unit: p.unit,
              referenceRange: p.referenceRange,
              method: p.method
            });
          });
        });
        testData.parameters = allParams;
      }
    }

    const test = await Test.create(testData);

    res.status(201).json({
      status: 'success',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTest = async (req, res, next) => {
  try {
    const test = await Test.findOneAndUpdate(
      { _id: req.params.id, organizationId: req.user.organizationId._id || req.user.organizationId },
      req.body,
      { new: true, runValidators: true }
    ).populate('includedTests');

    if (!test) {
      return next(new AppError('Test not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { test }
    });
  } catch (error) {
    next(error);
  }
};

async function autoSeedHealthPackages(orgId, existingTests, userId) {
  try {
    const cbcTest = existingTests.find(t => t.name.includes('Complete Blood Count') || t.name.includes('CBC'));
    const lipidTest = existingTests.find(t => t.name.includes('Lipid') || t.name.includes('Cholesterol'));
    const dengueTest = existingTests.find(t => t.name.includes('Dengue'));

    const sampleTests = existingTests.slice(0, 3).map(t => t._id);

    const masterPackages = [
      {
        name: 'Executive Full Body Health Checkup (Comprehensive)',
        category: 'Health Packages',
        department: 'Pathology',
        sampleType: 'Blood & Urine',
        containerType: 'EDTA + SST + Urine Cup',
        price: 1499,
        preparationInstructions: 'Strict 10-12 hours overnight fasting required. Water is permitted.',
        turnaroundTime: '12 Hours',
        tatHours: 12,
        notes: 'Includes Complete Hemogram (CBC), Lipid Profile, Liver & Kidney Function screening, and Fasting Blood Sugar.',
        isPackage: true,
        includedTests: sampleTests,
        parameters: [
          { name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '13.0 - 17.0' },
          { name: 'Platelet Count', unit: '10^3/µL', referenceRange: '150 - 450' },
          { name: 'Blood Glucose (Fasting)', unit: 'mg/dL', referenceRange: '70 - 99' },
          { name: 'Serum Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200' },
          { name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3' },
          { name: 'SGPT / ALT', unit: 'U/L', referenceRange: '< 45' }
        ]
      },
      {
        name: 'Comprehensive Diabetic & Renal Health Panel',
        category: 'Health Packages',
        department: 'Biochemistry',
        sampleType: 'Blood',
        containerType: 'Fluoride + SST',
        price: 899,
        preparationInstructions: 'Fasting 8-10 hours. Take prescribed morning medications after blood collection.',
        turnaroundTime: '6 Hours',
        tatHours: 6,
        notes: 'Monitors long-term glycemic control (HbA1c) along with renal functional markers.',
        isPackage: true,
        includedTests: sampleTests.slice(0, 2),
        parameters: [
          { name: 'Blood Glucose (Fasting)', unit: 'mg/dL', referenceRange: '70 - 99' },
          { name: 'HbA1c (Glycated Hemoglobin)', unit: '%', referenceRange: '< 5.7' },
          { name: 'Serum Creatinine', unit: 'mg/dL', referenceRange: '0.7 - 1.3' },
          { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', referenceRange: '7 - 20' }
        ]
      },
      {
        name: 'Cardiac Risk & Lipid Profile Trio',
        category: 'Health Packages',
        department: 'Biochemistry',
        sampleType: 'Blood',
        containerType: 'SST Gel Tube',
        price: 999,
        preparationInstructions: '12-14 hours fasting. Avoid fatty meals and alcohol 24 hours prior to sampling.',
        turnaroundTime: '8 Hours',
        tatHours: 8,
        notes: 'Full coronary risk assessment measuring atherogenic lipid subfractions.',
        isPackage: true,
        includedTests: sampleTests.slice(0, 2),
        parameters: [
          { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200' },
          { name: 'HDL Cholesterol (Good)', unit: 'mg/dL', referenceRange: '> 40' },
          { name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', referenceRange: '< 100' },
          { name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150' }
        ]
      }
    ];

    for (const pkg of masterPackages) {
      await Test.create({
        organizationId: orgId,
        createdBy: userId,
        ...pkg
      });
    }
  } catch (err) {
    console.error('Error auto-seeding master packages:', err);
  }
}
