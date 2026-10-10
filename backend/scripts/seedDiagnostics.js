import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Test from '../src/models/Test.js';
import Doctor from '../src/models/Doctor.js';
import Patient from '../src/models/Patient.js';
import Order from '../src/models/Order.js';
import Sample from '../src/models/Sample.js';
import Result from '../src/models/Result.js';
import InventoryItem from '../src/models/InventoryItem.js';
import InventoryLog from '../src/models/InventoryLog.js';
import LabPaymentReceipt from '../src/models/LabPaymentReceipt.js';
import CashierShift from '../src/models/CashierShift.js';
import CriticalAlert from '../src/models/CriticalAlert.js';
import ReportDispatch from '../src/models/ReportDispatch.js';

dotenv.config();

const seedForOrg = async (org) => {
  console.log(`Seeding data for organization: ${org.name} (${org.email}, id: ${org._id})`);

  let admin = await User.findOne({ organizationId: org._id });
  if (!admin) {
    admin = await User.create({
      organizationId: org._id,
      name: 'Dr. Ananya Sen (MD Pathologist)',
      email: org.email,
      passwordHash: '123456',
      role: 'ADMIN',
      status: 'active'
    });
  }

  // 1. Create Referring Doctor
  let doctor = await Doctor.findOne({ organizationId: org._id });
  if (!doctor) {
    doctor = await Doctor.create({
      organizationId: org._id,
      name: 'Dr. S. K. Mukherjee, MD',
      specialization: 'Internal Medicine',
      phone: '+91 98301 22334',
      email: 'sk.mukherjee@medcare.org',
      clinicAddress: 'Apex Health Clinic, Suite 4B',
      commissionRate: 15,
      panNumber: 'ABCDE1234F',
      bankDetails: {
        accountName: 'Dr S K Mukherjee',
        accountNumber: '91802004812391',
        ifscCode: 'HDFC0001842',
        bankName: 'HDFC Bank',
        upiId: 'skmukherjee@okhdfcbank'
      }
    });
  }

  // 2. Create Standard Diagnostic Tests
  let cbcTest = await Test.findOne({ organizationId: org._id, name: /Complete Blood Count/i });
  if (!cbcTest) {
    cbcTest = await Test.create({
      organizationId: org._id,
      name: 'Complete Blood Count (CBC)',
      testId: 'TST-CBC-01',
      category: 'Hematology',
      sampleType: 'EDTA Whole Blood',
      method: 'Automated 5-Part Differential & Photometry',
      price: 450,
      tatHours: 4,
      parameters: [
        { name: 'Hemoglobin (Hb)', unit: 'g/dL', referenceRange: '13.0 - 17.0', defaultValue: '11.2' },
        { name: 'Total Leukocyte Count (WBC)', unit: '10^3/µL', referenceRange: '4.0 - 11.0', defaultValue: '7.8' },
        { name: 'RBC Count', unit: '10^6/µL', referenceRange: '4.5 - 5.9', defaultValue: '4.2' },
        { name: 'Platelet Count', unit: '10^3/µL', referenceRange: '150 - 450', defaultValue: '210' },
        { name: 'Packed Cell Volume (PCV)', unit: '%', referenceRange: '40 - 50', defaultValue: '36.5' },
        { name: 'MCV', unit: 'fL', referenceRange: '80 - 100', defaultValue: '84.2' },
        { name: 'MCH', unit: 'pg', referenceRange: '27 - 33', defaultValue: '28.1' }
      ]
    });
  }

  let lipidTest = await Test.findOne({ organizationId: org._id, name: /Lipid Profile/i });
  if (!lipidTest) {
    lipidTest = await Test.create({
      organizationId: org._id,
      name: 'Lipid Profile - Extended',
      testId: 'TST-LIP-02',
      category: 'Biochemistry',
      sampleType: 'Serum / Fluoride Plasma',
      method: 'Enzymatic Spectrophotometry',
      price: 850,
      tatHours: 6,
      parameters: [
        { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '< 200', defaultValue: '245' },
        { name: 'HDL Cholesterol (Good)', unit: 'mg/dL', referenceRange: '> 40', defaultValue: '38' },
        { name: 'LDL Cholesterol (Bad)', unit: 'mg/dL', referenceRange: '< 100', defaultValue: '158' },
        { name: 'Serum Triglycerides', unit: 'mg/dL', referenceRange: '< 150', defaultValue: '220' },
        { name: 'VLDL Cholesterol', unit: 'mg/dL', referenceRange: '< 30', defaultValue: '44' },
        { name: 'Total Chol / HDL Ratio', unit: 'Ratio', referenceRange: '< 5.0', defaultValue: '6.4' }
      ]
    });
  }

  let dengueTest = await Test.findOne({ organizationId: org._id, name: /Dengue/i });
  if (!dengueTest) {
    dengueTest = await Test.create({
      organizationId: org._id,
      name: 'Dengue NS1 Antigen & IgM/IgG Duo Rapid',
      testId: 'TST-DNG-03',
      category: 'Microbiology & Serology',
      department: 'Microbiology',
      sampleType: 'Serum / Plain Blood',
      containerType: 'Plain / Red Top',
      method: 'Rapid Immunochromatographic Assay',
      price: 950,
      tatHours: 2,
      parameters: [
        { name: 'Dengue NS1 Antigen', unit: 'Qualitative', referenceRange: 'Negative', defaultValue: 'Positive' },
        { name: 'Dengue IgM Antibody', unit: 'Qualitative', referenceRange: 'Negative', defaultValue: 'Negative' },
        { name: 'Dengue IgG Antibody', unit: 'Qualitative', referenceRange: 'Negative', defaultValue: 'Negative' }
      ]
    });
  }

  let xrayTest = await Test.findOne({ organizationId: org._id, name: /Chest X-Ray/i });
  if (!xrayTest) {
    xrayTest = await Test.create({
      organizationId: org._id,
      name: 'Digital Chest X-Ray PA View',
      testId: 'TST-RAD-04',
      category: 'Radiology & Imaging',
      department: 'Radiology',
      sampleType: 'None',
      containerType: 'Imaging Film / DICOM',
      method: 'High-Frequency Digital Radiography',
      price: 600,
      tatHours: 1,
      parameters: [
        { name: 'Lung Fields', unit: 'Findings', referenceRange: 'Clear', defaultValue: 'Normal bilateral vascularity' },
        { name: 'Cardiothoracic Ratio (CTR)', unit: 'Ratio', referenceRange: '< 0.50', defaultValue: '0.45' },
        { name: 'Costophrenic Angles', unit: 'Findings', referenceRange: 'Acute & Clear', defaultValue: 'Clear' },
        { name: 'Bony Cage & Soft Tissues', unit: 'Findings', referenceRange: 'Intact', defaultValue: 'Intact' }
      ]
    });
  }

  // 3. Create Demo Patients
  let patient1 = await Patient.findOne({ organizationId: org._id, firstName: 'Johnathan' });
  if (!patient1) {
    patient1 = await Patient.create({
      organizationId: org._id,
      firstName: 'Johnathan',
      lastName: 'Doe',
      age: 46,
      gender: 'Male',
      phone: '+91 98112 34567',
      email: 'johndoe@example.com',
      bloodGroup: 'B+',
      referringDoctor: doctor._id
    });
  }

  let patient2 = await Patient.findOne({ organizationId: org._id, firstName: 'Priya' });
  if (!patient2) {
    patient2 = await Patient.create({
      organizationId: org._id,
      firstName: 'Priya',
      lastName: 'Sharma',
      age: 32,
      gender: 'Female',
      phone: '+91 99200 88776',
      email: 'priyasharma@example.com',
      bloodGroup: 'O+',
      referringDoctor: doctor._id
    });
  }

  // 4. Create Fully Completed & Verified Order for Johnathan Doe
  let order1 = await Order.findOne({ organizationId: org._id, patient: patient1._id });
  if (!order1) {
    order1 = await Order.create({
      organizationId: org._id,
      orderId: 'ORD-2026-00042',
      patient: patient1._id,
      referringDoctor: doctor._id,
      tests: [
        { test: cbcTest._id, price: 450, discount: 0, finalPrice: 450 },
        { test: lipidTest._id, price: 850, discount: 50, finalPrice: 800 }
      ],
      subtotal: 1300,
      totalDiscount: 50,
      totalAmount: 1250,
      paidAmount: 1250,
      dueAmount: 0,
      paymentStatus: 'Paid',
      orderStatus: 'Completed',
      paymentMethod: 'UPI'
    });

    const sample1 = await Sample.create({
      organizationId: org._id,
      order: order1._id,
      patient: patient1._id,
      tests: [cbcTest._id, lipidTest._id],
      sampleType: 'EDTA Whole Blood & Serum',
      containerType: 'Lavender & Gold Top SST',
      status: 'Tested',
      barcode: 'SMP-2026-00042',
      collectedAt: new Date(Date.now() - 3600000 * 5)
    });

    await Result.create({
      organizationId: org._id,
      order: order1._id,
      test: cbcTest._id,
      patient: patient1._id,
      sample: sample1._id,
      parameters: [
        { name: 'Hemoglobin (Hb)', value: '11.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', isAbnormal: true },
        { name: 'Total Leukocyte Count (WBC)', value: '7.8', unit: '10^3/µL', referenceRange: '4.0 - 11.0', isAbnormal: false },
        { name: 'RBC Count', value: '4.2', unit: '10^6/µL', referenceRange: '4.5 - 5.9', isAbnormal: true },
        { name: 'Platelet Count', value: '210', unit: '10^3/µL', referenceRange: '150 - 450', isAbnormal: false },
        { name: 'Packed Cell Volume (PCV)', value: '36.5', unit: '%', referenceRange: '40 - 50', isAbnormal: true },
        { name: 'MCV', value: '84.2', unit: 'fL', referenceRange: '80 - 100', isAbnormal: false }
      ],
      status: 'Verified',
      remarks: 'Mild normocytic normochromic anemia. Iron profile correlation advised.',
      enteredBy: admin._id,
      verifiedBy: admin._id,
      verifiedAt: new Date()
    });

    await Result.create({
      organizationId: org._id,
      order: order1._id,
      test: lipidTest._id,
      patient: patient1._id,
      sample: sample1._id,
      parameters: [
        { name: 'Total Cholesterol', value: '245', unit: 'mg/dL', referenceRange: '< 200', isAbnormal: true },
        { name: 'HDL Cholesterol (Good)', value: '38', unit: 'mg/dL', referenceRange: '> 40', isAbnormal: true },
        { name: 'LDL Cholesterol (Bad)', value: '158', unit: 'mg/dL', referenceRange: '< 100', isAbnormal: true },
        { name: 'Serum Triglycerides', value: '220', unit: 'mg/dL', referenceRange: '< 150', isAbnormal: true },
        { name: 'Total Chol / HDL Ratio', value: '6.4', unit: 'Ratio', referenceRange: '< 5.0', isAbnormal: true }
      ],
      status: 'Verified',
      remarks: 'Dyslipidemia observed with elevated LDL and Triglycerides. Dietary modification advised.',
      enteredBy: admin._id,
      verifiedBy: admin._id,
      verifiedAt: new Date()
    });
  }

  // 5. Create Order with Partial Results for Priya Sharma
  let order2 = await Order.findOne({ organizationId: org._id, patient: patient2._id });
  if (!order2) {
    order2 = await Order.create({
      organizationId: org._id,
      orderId: 'ORD-2026-00043',
      patient: patient2._id,
      referringDoctor: doctor._id,
      tests: [
        { test: cbcTest._id, price: 450, discount: 0, finalPrice: 450 }
      ],
      subtotal: 450,
      totalDiscount: 0,
      totalAmount: 450,
      paidAmount: 450,
      dueAmount: 0,
      paymentStatus: 'Paid',
      orderStatus: 'Partial Results'
    });

    const sample2 = await Sample.create({
      organizationId: org._id,
      order: order2._id,
      patient: patient2._id,
      tests: [cbcTest._id],
      sampleType: 'EDTA Whole Blood',
      containerType: 'Lavender Top',
      status: 'Tested',
      barcode: 'SMP-2026-00043',
      collectedAt: new Date(Date.now() - 3600000 * 2)
    });

    await Result.create({
      organizationId: org._id,
      order: order2._id,
      test: cbcTest._id,
      patient: patient2._id,
      sample: sample2._id,
      parameters: [
        { name: 'Hemoglobin (Hb)', value: '13.4', unit: 'g/dL', referenceRange: '12.0 - 15.5', isAbnormal: false },
        { name: 'Total Leukocyte Count (WBC)', value: '6.2', unit: '10^3/µL', referenceRange: '4.0 - 11.0', isAbnormal: false },
        { name: 'Platelet Count', value: '240', unit: '10^3/µL', referenceRange: '150 - 450', isAbnormal: false }
      ],
      status: 'Final',
      remarks: 'Sample within normal clinical limits.',
      enteredBy: admin._id
    });
  }

  // 5b. Create STAT Emergency Order for Vikram Mehta (Dengue + CBC, Expiring in 30 mins)
  let patient3 = await Patient.findOne({ organizationId: org._id, firstName: 'Vikram' });
  if (!patient3) {
    patient3 = await Patient.create({
      organizationId: org._id,
      firstName: 'Vikram',
      lastName: 'Mehta',
      age: 44,
      gender: 'Male',
      phone: '+91 97110 55443',
      email: 'vikram.mehta@example.com',
      bloodGroup: 'A+',
      referringDoctor: doctor._id
    });
  }

  let order3 = await Order.findOne({ organizationId: org._id, patient: patient3._id });
  if (!order3) {
    const createdTime = new Date(Date.now() - 1000 * 60 * 85); // Created 85 mins ago (TAT: 120m -> 35m left!)
    order3 = await Order.create({
      organizationId: org._id,
      orderId: 'ORD-2026-00044',
      patient: patient3._id,
      referringDoctor: doctor._id,
      priority: 'STAT',
      tests: [
        { test: cbcTest._id, price: 450, discount: 0, finalPrice: 450 },
        { test: dengueTest._id, price: 950, discount: 0, finalPrice: 950 }
      ],
      subtotal: 1400,
      totalDiscount: 0,
      totalAmount: 1400,
      paidAmount: 1400,
      dueAmount: 0,
      paymentStatus: 'Paid',
      orderStatus: 'Processing',
      createdAt: createdTime
    });

    await Sample.create({
      organizationId: org._id,
      order: order3._id,
      patient: patient3._id,
      tests: [cbcTest._id],
      sampleType: 'EDTA Whole Blood',
      containerType: 'Lavender Top',
      status: 'Processing',
      barcode: 'SMP-2026-00044-A',
      collectedAt: new Date(createdTime.getTime() + 10 * 60000),
      receivedInLabAt: new Date(createdTime.getTime() + 25 * 60000)
    });

    await Sample.create({
      organizationId: org._id,
      order: order3._id,
      patient: patient3._id,
      tests: [dengueTest._id],
      sampleType: 'Serum / Plain Blood',
      containerType: 'Plain / Red Top',
      status: 'Processing',
      barcode: 'SMP-2026-00044-B',
      collectedAt: new Date(createdTime.getTime() + 10 * 60000),
      receivedInLabAt: new Date(createdTime.getTime() + 25 * 60000)
    });
  }

  // 5c. Create SLA Breached Overdue Order for Kavita Sen (Created 6 hours ago, TAT: 4 hours)
  let patient4 = await Patient.findOne({ organizationId: org._id, firstName: 'Kavita' });
  if (!patient4) {
    patient4 = await Patient.create({
      organizationId: org._id,
      firstName: 'Kavita',
      lastName: 'Sen',
      age: 62,
      gender: 'Female',
      phone: '+91 98319 77665',
      email: 'kavitasen@example.com',
      bloodGroup: 'B+',
      referringDoctor: doctor._id
    });
  }

  let order4 = await Order.findOne({ organizationId: org._id, patient: patient4._id });
  if (!order4) {
    const overdueTime = new Date(Date.now() - 1000 * 60 * 60 * 6); // 6 hours ago (TAT 4h -> 2 hours overdue!)
    order4 = await Order.create({
      organizationId: org._id,
      orderId: 'ORD-2026-00045',
      patient: patient4._id,
      referringDoctor: doctor._id,
      priority: 'Routine',
      tests: [
        { test: cbcTest._id, price: 450, discount: 0, finalPrice: 450 }
      ],
      subtotal: 450,
      totalDiscount: 0,
      totalAmount: 450,
      paidAmount: 450,
      dueAmount: 0,
      paymentStatus: 'Paid',
      orderStatus: 'Collected',
      createdAt: overdueTime
    });

    await Sample.create({
      organizationId: org._id,
      order: order4._id,
      patient: patient4._id,
      tests: [cbcTest._id],
      sampleType: 'EDTA Whole Blood',
      containerType: 'Lavender Top',
      status: 'In Lab',
      barcode: 'SMP-2026-00045',
      collectedAt: new Date(overdueTime.getTime() + 15 * 60000),
      receivedInLabAt: new Date(overdueTime.getTime() + 40 * 60000)
    });
  }

  // 6. Seed Enterprise Clinical Reagents & Consumables
  const existingInventory = await InventoryItem.countDocuments({ organizationId: org._id });
  if (existingInventory === 0) {
    const items = [
      {
        name: 'Sysmex Cellpack DCL Hematology Diluent',
        category: 'Reagent',
        unit: 'tests',
        currentStock: 420,
        minimumStock: 50,
        reorderQuantity: 200,
        batchNumber: 'LOT-SYX-8821',
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180), // 180 days out
        supplier: 'Sysmex Bio-Medical Diagnostics',
        pricePerUnit: 12.5,
        storageCondition: '15°C - 25°C (Room Temp)',
        location: 'Hematology Room - Analyzer A Shelf',
        linkedTests: [cbcTest._id]
      },
      {
        name: 'Roche Total Cholesterol Enzymatic Gen.2 Kit',
        category: 'Reagent',
        unit: 'tests',
        currentStock: 195,
        minimumStock: 40,
        reorderQuantity: 100,
        batchNumber: 'LOT-RCH-4412',
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90), // 90 days out
        supplier: 'Roche Diagnostics India',
        pricePerUnit: 28,
        storageCondition: '2°C - 8°C (Refrigerated)',
        location: 'Cold Storage Walk-in 1',
        linkedTests: [lipidTest._id]
      },
      {
        name: 'Triglycerides GPO-PAP Liquid Reagent',
        category: 'Reagent',
        unit: 'tests',
        currentStock: 18, // LOW STOCK TRIGGER
        minimumStock: 35,
        reorderQuantity: 100,
        batchNumber: 'LOT-TRG-1029',
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 22), // EXPIRING IN 22 DAYS!
        supplier: 'Transasia Bio-Medicals',
        pricePerUnit: 22,
        storageCondition: '2°C - 8°C (Refrigerated)',
        location: 'Fridge B - Tray 3',
        linkedTests: [lipidTest._id]
      },
      {
        name: 'BD Vacutainer K2 EDTA 3ml Lavender Tubes',
        category: 'Vacuum Tube',
        unit: 'tubes',
        currentStock: 520,
        minimumStock: 100,
        reorderQuantity: 500,
        batchNumber: 'LOT-BD-9941',
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year out
        supplier: 'Becton Dickinson India',
        pricePerUnit: 6.5,
        storageCondition: '15°C - 25°C (Room Temp)',
        location: 'Phlebotomy Station 1 & 2',
        linkedTests: [cbcTest._id]
      },
      {
        name: 'BD SST II Advance Gold Top Gel Tubes',
        category: 'Vacuum Tube',
        unit: 'tubes',
        currentStock: 12, // LOW STOCK
        minimumStock: 80,
        reorderQuantity: 200,
        batchNumber: 'LOT-BD-3392',
        expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 240),
        supplier: 'Becton Dickinson India',
        pricePerUnit: 8.0,
        storageCondition: '15°C - 25°C (Room Temp)',
        location: 'Phlebotomy Station 1'
      },
      {
        name: 'Rapid Dengue NS1 & IgG/IgM Combo Device',
        category: 'Rapid Kit',
        unit: 'kits',
        currentStock: 15,
        minimumStock: 20,
        reorderQuantity: 50,
        batchNumber: 'LOT-DNG-0091',
        expiryDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // EXPIRED 8 DAYS AGO! (Quarantine test)
        supplier: 'SD Biosensor Healthcare',
        pricePerUnit: 140,
        storageCondition: '15°C - 25°C (Room Temp)',
        location: 'Quarantine Rack - Rapid Bench'
      }
    ];

    for (const itm of items) {
      const createdItem = await InventoryItem.create({
        ...itm,
        organizationId: org._id
      });

      await InventoryLog.create({
        organizationId: org._id,
        item: createdItem._id,
        type: 'STOCK_IN',
        quantity: createdItem.currentStock,
        previousStock: 0,
        newStock: createdItem.currentStock,
        batchNumber: createdItem.batchNumber,
        notes: `Opening stock entry (Batch: ${createdItem.batchNumber})`,
        performedBy: admin._id
      });
    }

    console.log(`Seeded 6 enterprise clinical inventory items for org: ${org.name}`);
  }

  // 7. Seed Cash Desk Payment Receipts & Active Cashier Shift
  const existingReceiptCount = await LabPaymentReceipt.countDocuments({ organizationId: org._id });
  if (existingReceiptCount === 0) {
    const orders = await Order.find({ organizationId: org._id }).populate('patient');
    for (const ord of orders) {
      if (ord.paidAmount > 0) {
        const rcpt = await LabPaymentReceipt.create({
          organizationId: org._id,
          order: ord._id,
          patient: ord.patient._id,
          amount: ord.paidAmount,
          paymentMethod: ord.paidAmount > 500 ? 'UPI' : 'Cash',
          transactionReference: ord.paidAmount > 500 ? 'UPI/2026/98234190' : '',
          subtotal: ord.subtotal,
          discount: ord.totalDiscount,
          orderTotal: ord.totalAmount,
          paidBeforeThis: 0,
          balanceAfterThis: ord.dueAmount,
          cashier: admin._id,
          cashierName: 'Dr. Ananya Sen / Cash Desk',
          notes: 'Standard patient bill clearance',
          paymentDate: new Date()
        });

        ord.payments = [{
          receiptNumber: rcpt.receiptNumber,
          receiptId: rcpt._id,
          amount: ord.paidAmount,
          paymentMethod: rcpt.paymentMethod,
          transactionReference: rcpt.transactionReference,
          cashierName: 'Cash Desk Cashier',
          paidAt: new Date()
        }];
        await ord.save();
      }
    }
    console.log(`Seeded demo payment receipts for org: ${org.name}`);
  }

  // Seed an Open Cashier Shift if none exists
  const openShift = await CashierShift.findOne({ organizationId: org._id, status: 'Open' });
  if (!openShift) {
    await CashierShift.create({
      organizationId: org._id,
      cashier: admin._id,
      cashierName: 'Dr. Ananya Sen (Cashier)',
      openingCashFloat: 2500, // ₹2,500 float
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 4), // Opened 4 hours ago
      status: 'Open'
    });
    console.log(`Seeded open cashier shift with ₹2,500 float for org: ${org.name}`);
  }

  // 8. Seed Critical Panic Value Alerts & WhatsApp Dispatches
  const existingAlertCount = await CriticalAlert.countDocuments({ organizationId: org._id });
  if (existingAlertCount === 0 && patient3 && order3) {
    await CriticalAlert.create({
      organizationId: org._id,
      order: order3._id,
      patient: patient3._id,
      test: cbcTest._id,
      parameterName: 'Platelet Count',
      observedValue: '14',
      unit: '10^3/µL',
      referenceRange: '150 - 450',
      criticalThreshold: '< 20 × 10³/µL (Spontaneous Hemorrhage risk)',
      severity: 'CRITICAL_PANIC',
      communicationStatus: 'PENDING_COMMUNICATION',
      communicatedPhone: patient3.phone,
      clinicalNotes: 'Severe thrombocytopenia observed in dengue fever. Immediate platelet transfusion consultation needed.'
    });

    // Also seed a communicated alert
    if (patient1 && order1) {
      await CriticalAlert.create({
        organizationId: org._id,
        order: order1._id,
        patient: patient1._id,
        test: cbcTest._id,
        parameterName: 'Hemoglobin (Hb)',
        observedValue: '6.8',
        unit: 'g/dL',
        referenceRange: '13.0 - 17.0',
        criticalThreshold: '< 7.0 g/dL (Severe Life-Threatening Anemia)',
        severity: 'CRITICAL_PANIC',
        communicationStatus: 'COMMUNICATED',
        communicatedTo: 'Dr. S. K. Mukherjee, MD',
        communicatedToRole: 'Referring Doctor',
        communicatedPhone: doctor.phone,
        communicatedBy: admin._id,
        communicatedByName: 'Dr. Ananya Sen (MD Pathologist)',
        communicatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
        readBackConfirmed: true,
        clinicalNotes: 'Doctor notified telephonically. Blood transfusion advised by physician.'
      });
    }

    console.log(`Seeded critical panic alerts for org: ${org.name}`);
  }

  // Seed sample Report Dispatches
  const existingDispatchCount = await ReportDispatch.countDocuments({ organizationId: org._id });
  if (existingDispatchCount === 0 && patient1 && order1) {
    await ReportDispatch.create({
      organizationId: org._id,
      order: order1._id,
      patient: patient1._id,
      recipientType: 'PATIENT',
      recipientName: `${patient1.firstName} ${patient1.lastName}`,
      recipientPhone: patient1.phone,
      channel: 'WHATSAPP',
      status: 'DELIVERED',
      messageContent: `🏥 APEX CLINICAL DIAGNOSTICS & RESEARCH LAB\nDear Johnathan Doe, your investigation report for Order #ORD-2026-00042 is verified.`,
      reportDownloadUrl: `https://apexdiagnostics.in/reports/download/${order1.orderId}?auth=apex2026`,
      dispatchedBy: admin._id,
      dispatchedByName: 'Automated Dispatch'
    });
    console.log(`Seeded report dispatches for org: ${org.name}`);
  }
};

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB...');

    const diagOrgs = await Organization.find({ businessType: 'DIAGNOSTICS' });
    console.log(`Found ${diagOrgs.length} diagnostics organizations.`);

    for (const org of diagOrgs) {
      await seedForOrg(org);
    }

    console.log('All diagnostics organizations successfully seeded with enterprise clinical inventory!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

run();
