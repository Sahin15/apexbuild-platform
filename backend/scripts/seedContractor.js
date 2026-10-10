import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import Project from '../src/models/Project.js';
import Client from '../src/models/Client.js';
import BOQ from '../src/models/BOQ.js';
import BOQItem from '../src/models/BOQItem.js';
import Measurement from '../src/models/Measurement.js';
import RABill from '../src/models/RABill.js';
import Task from '../src/models/Task.js';
import SiteReport from '../src/models/SiteReport.js';
import Material from '../src/models/Material.js';
import MaterialLedger from '../src/models/MaterialLedger.js';
import GoodsReceivedNote from '../src/models/GoodsReceivedNote.js';
import MaterialIndent from '../src/models/MaterialIndent.js';
import StoreIssue from '../src/models/StoreIssue.js';
import Worker from '../src/models/Worker.js';
import Attendance from '../src/models/Attendance.js';
import LabourWageSheet from '../src/models/LabourWageSheet.js';

dotenv.config();

const seedContractor = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for Contractor OS Seeding...');

    // Find contractor org
    let org = await Organization.findOne({ email: 'contractor@example.com' });
    if (!org) {
      org = await Organization.findOne({ businessType: 'CONTRACTOR' });
    }
    if (!org) {
      org = await Organization.create({
        name: 'Apex Infrastructure & Buildcon Ltd',
        email: 'contractor@example.com',
        businessType: 'CONTRACTOR',
        status: 'active'
      });
    }

    let user = await User.findOne({ organizationId: org._id });
    if (!user) {
      user = await User.create({
        organizationId: org._id,
        name: 'Er. Rajesh Sharma (Chief Project Engineer)',
        email: 'contractor@example.com',
        passwordHash: '123456',
        role: 'ADMIN',
        status: 'active'
      });
    }

    // Create or find Client
    let client = await Client.findOne({ organizationId: org._id, name: 'Prestige Urban Infra Pvt Ltd' });
    if (!client) {
      client = await Client.create({
        organizationId: org._id,
        name: 'Prestige Urban Infra Pvt Ltd',
        email: 'projects@prestigeurban.com',
        phone: '+91 98201 44552',
        address: 'Tower 4, Horizon Business Bay, Whitefield, Bengaluru'
      });
    }

    // Create or update Flagship Project
    let project = await Project.findOne({ organizationId: org._id, projectCode: 'PRJ-SKY-01' });
    if (!project) {
      project = await Project.create({
        organizationId: org._id,
        clientId: client._id,
        projectCode: 'PRJ-SKY-01',
        name: 'Skyline Heights Tower A (High-Rise Residential)',
        description: '2B + G + 24 Upper Floors Premium Residential Tower with Post-Tensioned Slabs.',
        projectType: 'RESIDENTIAL',
        location: 'Plot 42, Sector 150',
        city: 'Noida',
        state: 'Uttar Pradesh',
        pincode: '201310',
        contractValue: 48500000,
        estimatedCost: 39200000,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        expectedEndDate: new Date(Date.now() + 450 * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        projectManagerId: user._id,
        createdBy: user._id,
        contractType: 'ITEM_RATE',
        totalBuiltUpArea: '145,000 sq.ft',
        numberOfFloors: 27,
        buildingPermitNo: 'Noida-DA/BP/2026/8941',
        reraRegistrationNo: 'UPRERAPRJ782194'
      });
    }

    // Clean existing BOQ and measurements for fresh clean demonstration
    await BOQ.deleteMany({ projectId: project._id });
    await BOQItem.deleteMany({ projectId: project._id });
    await Measurement.deleteMany({ projectId: project._id });
    await RABill.deleteMany({ projectId: project._id });

    // Create Master BOQ
    const boq = await BOQ.create({
      organizationId: org._id,
      projectId: project._id,
      name: 'Skyline Heights Master Bill of Quantities (Civil & Finishes)',
      version: 'v1.0',
      totalAmount: 18450000,
      status: 'APPROVED',
      createdBy: user._id
    });

    const boqData = [
      {
        sectionId: 'SUB-STRUCTURE',
        itemCode: 'BOQ-01.10',
        description: 'Earthwork excavation in foundation trenches and raft pits in all kinds of soil, including trimming, levelling, and dressing within 50m lead and 1.5m lift.',
        unit: 'cum',
        quantity: 1250,
        rate: 420,
        completedQuantity: 0
      },
      {
        sectionId: 'SUB-STRUCTURE',
        itemCode: 'BOQ-02.05',
        description: 'Providing and laying Plain Cement Concrete (PCC) 1:4:8 (1 cement : 4 coarse sand : 8 graded stone aggregate 40mm nominal size) under footings and ground beams.',
        unit: 'cum',
        quantity: 180,
        rate: 5100,
        completedQuantity: 0
      },
      {
        sectionId: 'SUB-STRUCTURE',
        itemCode: 'BOQ-03.12',
        description: 'Providing and laying Reinforced Cement Concrete M30 grade using design mix with OPC 53 Grade cement and 20mm graded crushed stone aggregate in foundations, raft, and pedestal columns.',
        unit: 'cum',
        quantity: 650,
        rate: 8650,
        completedQuantity: 0
      },
      {
        sectionId: 'STEEL-WORKS',
        itemCode: 'BOQ-04.01',
        description: 'Supplying, cutting, bending, binding, and placing in position High Yield Strength Deformed (HYSD) Fe500D TMT reinforcement bars including binding wire and cover blocks.',
        unit: 'kg',
        quantity: 48000,
        rate: 76,
        completedQuantity: 0
      },
      {
        sectionId: 'SUPER-STRUCTURE',
        itemCode: 'BOQ-05.20',
        description: '200mm thick Autoclaved Aerated Concrete (AAC) block masonry in super-structure with high-strength polymer modified thin-bed block jointing mortar up to floor 5.',
        unit: 'sqm',
        quantity: 3200,
        rate: 1180,
        completedQuantity: 0
      },
      {
        sectionId: 'FINISHES',
        itemCode: 'BOQ-06.10',
        description: 'Internal 12mm thick single-coat gypsum plastering over internal block surfaces with true straight plumb, smooth trowel finish ready for primer.',
        unit: 'sqm',
        quantity: 5500,
        rate: 340,
        completedQuantity: 0
      }
    ];

    const createdBoqItems = [];
    for (const b of boqData) {
      const item = await BOQItem.create({
        boqId: boq._id,
        projectId: project._id,
        sectionId: b.sectionId,
        itemCode: b.itemCode,
        description: b.description,
        unit: b.unit,
        quantity: b.quantity,
        rate: b.rate,
        amount: b.quantity * b.rate,
        completedQuantity: 0,
        remainingQuantity: b.quantity,
        status: 'ACTIVE'
      });
      createdBoqItems.push(item);
    }

    console.log(`Created BOQ with ${createdBoqItems.length} items`);

    // Now seed realistic Measurement Book (MB) records with Sub-Measurements (Nos x L x B x D)
    const excavItem = createdBoqItems[0];
    const pccItem = createdBoqItems[1];
    const rccItem = createdBoqItems[2];
    const aacItem = createdBoqItems[4];

    // 1. Excavation Measurement (VERIFIED)
    const m1Items = [
      { description: 'Foundation Pit Pit-A (Column Grid A1-A6)', nos: 1, length: 24.5, breadth: 8.2, depth: 2.8, isDeduction: false, subTotal: 562.52 },
      { description: 'Foundation Pit Pit-B (Column Grid B1-B6)', nos: 1, length: 24.5, breadth: 8.0, depth: 2.8, isDeduction: false, subTotal: 548.80 },
      { description: 'Deduction for existing boulder outcrop', nos: 1, length: 4.0, breadth: 3.5, depth: 1.2, isDeduction: true, subTotal: -16.80 }
    ];
    const m1Total = Number((562.52 + 548.80 - 16.80).toFixed(2)); // 1094.52

    const m1Doc = await Measurement.create({
      organizationId: org._id,
      projectId: project._id,
      boqItemId: excavItem._id,
      mbRef: 'MB-01/P-14',
      bookNo: 'MB-01',
      pageNo: '14',
      location: 'Basement 2, Foundation Grid A1 to B6',
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      items: m1Items,
      quantity: m1Total,
      unit: excavItem.unit,
      status: 'BILLED',
      remarks: 'Pit levels verified jointly by Junior Engineer & Resident Surveyor using total station.',
      measuredBy: user._id,
      verifiedBy: user._id,
      verifiedAt: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000)
    });

    // Create RA Bill #01 linking m1
    const gross1 = Math.round(m1Total * excavItem.rate); // 1094.52 * 420 = 459698
    const ret1 = Math.round(gross1 * 0.05); // 22985
    const cess1 = Math.round(gross1 * 0.01); // 4597
    const tds1 = Math.round(gross1 * 0.02); // 9194
    const ded1 = ret1 + cess1 + tds1; // 36776
    const netBefTax1 = gross1 - ded1; // 422922
    const gst1 = Math.round(netBefTax1 * 0.18); // 76126
    const net1 = netBefTax1 + gst1; // 499048

    const bill1 = await RABill.create({
      organizationId: org._id,
      projectId: project._id,
      clientId: client._id,
      billNo: 'RA Bill #01',
      billSequence: 1,
      billDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      period: '01 Aug 2026 - 31 Aug 2026',
      items: [{
        boqItemId: excavItem._id,
        itemCode: excavItem.itemCode,
        description: excavItem.description,
        unit: excavItem.unit,
        rate: excavItem.rate,
        tenderQty: excavItem.quantity,
        previousQty: 0,
        currentQty: m1Total,
        uptoDateQty: m1Total,
        previousAmount: 0,
        currentAmount: gross1,
        uptoDateAmount: gross1,
        measurementIds: [m1Doc._id]
      }],
      grossCurrentAmount: gross1,
      grossPreviousAmount: 0,
      grossUptoDateAmount: gross1,
      grossAmount: gross1,
      retentionPercent: 5,
      retentionAmount: ret1,
      retentionUptoDate: ret1,
      mobAdvanceRecovery: 0,
      materialRecovery: 0,
      labourCessPercent: 1,
      labourCessAmount: cess1,
      tdsPercent: 2,
      tdsAmount: tds1,
      otherDeductions: 0,
      totalDeductions: ded1,
      netPayableBeforeTax: netBefTax1,
      gstPercent: 18,
      gstAmount: gst1,
      netPayable: net1,
      paidAmount: net1,
      balanceDue: 0,
      paymentDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      paymentReference: 'RTGS/HDFC94810284',
      status: 'PAID',
      engineerRemarks: 'Measurements certified as per site levels and soil strata verification.',
      clientRemarks: 'Passed and paid in full.',
      createdBy: user._id,
      approvedBy: user._id,
      approvedAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000)
    });

    m1Doc.raBillId = bill1._id;
    await m1Doc.save();

    // Update excavItem completed qty
    excavItem.completedQuantity = m1Total;
    excavItem.remainingQuantity = Math.max(0, excavItem.quantity - m1Total);
    await excavItem.save();

    // 2. PCC Measurement (VERIFIED)
    const m2Items = [
      { description: 'PCC bed below Grid A Raft Beam', nos: 1, length: 24.0, breadth: 1.8, depth: 0.15, isDeduction: false, subTotal: 6.48 },
      { description: 'PCC bed below Grid B Raft Beam', nos: 1, length: 24.0, breadth: 1.8, depth: 0.15, isDeduction: false, subTotal: 6.48 },
      { description: 'PCC bed under Central Raft Slab Area', nos: 1, length: 22.0, breadth: 18.0, depth: 0.15, isDeduction: false, subTotal: 59.40 }
    ];
    const m2Total = Number((6.48 + 6.48 + 59.40).toFixed(2)); // 72.36

    await Measurement.create({
      organizationId: org._id,
      projectId: project._id,
      boqItemId: pccItem._id,
      mbRef: 'MB-01/P-18',
      bookNo: 'MB-01',
      pageNo: '18',
      location: 'Grid A1-B6 Raft Base',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      items: m2Items,
      quantity: m2Total,
      unit: pccItem.unit,
      status: 'VERIFIED',
      remarks: 'PCC 1:4:8 thickness verified with gauge rod before shuttering.',
      measuredBy: user._id,
      verifiedBy: user._id,
      verifiedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    });

    pccItem.completedQuantity = m2Total;
    pccItem.remainingQuantity = Math.max(0, pccItem.quantity - m2Total);
    await pccItem.save();

    // 3. RCC M30 Measurement (PENDING Site Verification)
    const m3Items = [
      { description: 'Combined Footing CF-1 to CF-6', nos: 6, length: 4.5, breadth: 3.2, depth: 0.9, isDeduction: false, subTotal: 77.76 },
      { description: 'Isolated Footings IF-1 to IF-10', nos: 10, length: 2.8, breadth: 2.8, depth: 0.75, isDeduction: false, subTotal: 58.80 },
      { description: 'Pedestal Columns C1 to C16 (H=1.8m)', nos: 16, length: 0.6, breadth: 0.6, depth: 1.8, isDeduction: false, subTotal: 10.37 },
      { description: 'Deduction for elevator lift pit depression', nos: 1, length: 3.0, breadth: 2.5, depth: 0.6, isDeduction: true, subTotal: -4.50 }
    ];
    const m3Total = Number((77.76 + 58.80 + 10.37 - 4.50).toFixed(2)); // 142.43

    await Measurement.create({
      organizationId: org._id,
      projectId: project._id,
      boqItemId: rccItem._id,
      mbRef: 'MB-02/P-04',
      bookNo: 'MB-02',
      pageNo: '04',
      location: 'Basement 2, Tower A Sub-structure Pour #3',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      items: m3Items,
      quantity: m3Total,
      unit: rccItem.unit,
      status: 'PENDING',
      remarks: 'Cube compressive strength test results at 7 days: 22.8 N/mm2. Awaiting 28-day break tests before final client bill.',
      measuredBy: user._id
    });

    // 4. AAC Block Masonry (DRAFT)
    const m4Items = [
      { description: 'External perimeter wall Grid 1 (Floors 1-2)', nos: 2, length: 28.0, breadth: 1.0, depth: 3.1, isDeduction: false, subTotal: 173.60 },
      { description: 'Deduction for Window Openings W1 (1.8m x 1.5m)', nos: 8, length: 1.8, breadth: 1.0, depth: 1.5, isDeduction: true, subTotal: -21.60 }
    ];
    const m4Total = Number((173.60 - 21.60).toFixed(2)); // 152.00

    await Measurement.create({
      organizationId: org._id,
      projectId: project._id,
      boqItemId: aacItem._id,
      mbRef: 'MB-02/P-08',
      bookNo: 'MB-02',
      pageNo: '08',
      location: 'Podium Level 1 & 2 External Facade',
      date: new Date(),
      items: m4Items,
      quantity: m4Total,
      unit: aacItem.unit,
      status: 'DRAFT',
      remarks: 'Draft entry by site engineer. Shuttering removal underway.',
      measuredBy: user._id
    });

    // Clean existing tasks and seed realistic Gantt WBS tasks
    await Task.deleteMany({ projectId: project._id });

    const now = Date.now();
    const d = 24 * 60 * 60 * 1000;

    const t1 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '1.1',
      phase: 'PRE-CONSTRUCTION',
      title: 'Geotechnical Soil Investigation & Borehole Sampling',
      description: 'Standard Penetration Tests (SPT) across 6 boreholes to 30m depth. Soil bearing capacity certification.',
      status: 'completed',
      priority: 'High',
      isMilestone: true,
      isCriticalPath: true,
      startDate: new Date(now - 55 * d),
      endDate: new Date(now - 45 * d),
      durationDays: 10,
      progress: 100,
      slippageDays: 0,
      assigneeName: 'Geotech Surveyors India',
      assigneeRole: 'Geotechnical Consultant',
      createdBy: user._id
    });

    const t2 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '1.2',
      phase: 'SUBSTRUCTURE',
      title: 'Deep Pit Excavation & Shoring Piles Grid A to B',
      description: 'Excavation to 5.5m depth below natural ground level, soil disposal with 50m lead and perimeter shoring.',
      status: 'completed',
      priority: 'Critical',
      isMilestone: false,
      isCriticalPath: true,
      startDate: new Date(now - 45 * d),
      endDate: new Date(now - 25 * d),
      durationDays: 20,
      progress: 100,
      slippageDays: 0,
      dependencies: [t1._id],
      boqItemIds: [excavItem._id],
      assigneeName: 'Apex Earthmovers Squad',
      assigneeRole: 'Substructure Contractor',
      createdBy: user._id
    });

    const t3 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '1.3',
      phase: 'SUBSTRUCTURE',
      title: 'PCC 1:4:8 Bedding Layer Under Foundation Raft',
      description: '150mm thick plain cement concrete layer including level dressing, watering, and ramming.',
      status: 'completed',
      priority: 'Medium',
      isMilestone: false,
      isCriticalPath: true,
      startDate: new Date(now - 25 * d),
      endDate: new Date(now - 18 * d),
      durationDays: 7,
      progress: 100,
      slippageDays: 0,
      dependencies: [t2._id],
      boqItemIds: [pccItem._id],
      assigneeName: 'PCC Pour Team A',
      assigneeRole: 'Civil Gang',
      createdBy: user._id
    });

    const t4 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '1.4',
      phase: 'SUBSTRUCTURE',
      title: 'Raft Reinforcement Fe500D TMT & Sump Shuttering',
      description: 'Bottom and top mesh rebar binding with chairs, spacers, starter bars for columns C1-C16, and sump shuttering.',
      status: 'completed',
      priority: 'Critical',
      isMilestone: false,
      isCriticalPath: true,
      startDate: new Date(now - 18 * d),
      endDate: new Date(now - 6 * d),
      durationDays: 12,
      progress: 100,
      slippageDays: 0,
      dependencies: [t3._id],
      assigneeName: 'Steel Barbenders Team',
      assigneeRole: 'Rebar Subcontractor',
      createdBy: user._id
    });

    const t5 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '1.5',
      phase: 'SUBSTRUCTURE',
      title: 'Raft Concrete Pour M30 Design Mix (Pours #1 to #3)',
      description: 'Continuous monolithic pour of 650 cum with boom placers, transit mixers, and ice water batching to prevent thermal cracking.',
      status: 'in-progress',
      priority: 'Critical',
      isMilestone: true,
      isCriticalPath: true,
      startDate: new Date(now - 6 * d),
      endDate: new Date(now + 8 * d),
      baselineEndDate: new Date(now + 6 * d),
      durationDays: 14,
      progress: 75,
      slippageDays: 2,
      dependencies: [t4._id],
      boqItemIds: [rccItem._id],
      assigneeName: 'UltraTech RMC Fleet',
      assigneeRole: 'RMC Supplier',
      progressLogs: [
        { date: new Date(now - 4 * d), progress: 30, note: 'Pour #1 completed: 210 cum laid.' },
        { date: new Date(now - 1 * d), progress: 75, note: 'Pour #2 completed: 280 cum laid. Cube 7-day tests passed.' }
      ],
      createdBy: user._id
    });

    const t6 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '2.1',
      phase: 'SUPERSTRUCTURE',
      title: 'Basement 2 Retaining Walls & Columns C1-C16',
      description: 'M30 grade RCC columns and shear walls up to Ground Floor transfer slab beam soffit.',
      status: 'in-progress',
      priority: 'High',
      isMilestone: false,
      isCriticalPath: true,
      startDate: new Date(now + 2 * d),
      endDate: new Date(now + 20 * d),
      durationDays: 18,
      progress: 35,
      slippageDays: 0,
      dependencies: [t5._id],
      assigneeName: 'Column Shuttering Crew',
      assigneeRole: 'Formwork Contractor',
      createdBy: user._id
    });

    const t7 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '2.2',
      phase: 'SUPERSTRUCTURE',
      title: 'Ground Floor Transfer Slab Formwork & Post-Tensioning (PT)',
      description: 'High-load transfer slab table formwork, unbonded PT mono-strand tendon laying, profile ducting, and burst reinforcement.',
      status: 'todo',
      priority: 'Critical',
      isMilestone: true,
      isCriticalPath: true,
      startDate: new Date(now + 21 * d),
      endDate: new Date(now + 42 * d),
      durationDays: 21,
      progress: 0,
      slippageDays: 0,
      dependencies: [t6._id],
      assigneeName: 'Freyssinet PT Specialists',
      assigneeRole: 'PT Specialist Contractor',
      createdBy: user._id
    });

    const t8 = await Task.create({
      organizationId: org._id,
      projectId: project._id,
      wbsCode: '3.1',
      phase: 'MASONRY',
      title: '200mm AAC Block Masonry Perimeter Walls (Ground Floor)',
      description: 'External envelope perimeter walls using thin-bed polymer adhesive mortar with tie-beams at lintel height.',
      status: 'todo',
      priority: 'Medium',
      isMilestone: false,
      isCriticalPath: false,
      startDate: new Date(now + 43 * d),
      endDate: new Date(now + 58 * d),
      durationDays: 15,
      progress: 0,
      slippageDays: 0,
      dependencies: [t7._id],
      boqItemIds: [aacItem._id],
      assigneeName: 'Masonry Guild',
      assigneeRole: 'Blockwork Contractor',
      createdBy: user._id
    });

    // Seed Daily Progress Reports (DPR / Site Diary)
    await SiteReport.deleteMany({ projectId: project._id });

    // DPR 1: 2 Days ago (Approved)
    await SiteReport.create({
      organizationId: org._id,
      projectId: project._id,
      dprNo: 'DPR-2026-10-08',
      reportDate: new Date(now - 2 * d),
      siteEngineerId: user._id,
      weather: 'Sunny',
      weatherDetails: {
        condition: 'SUNNY',
        tempMax: 35,
        tempMin: 24,
        rainfallMm: 0,
        shiftHours: 8,
        shiftsWorked: 1
      },
      manpower: [
        { trade: 'Barbenders & Steel Fixers', contractorName: 'Apex Rebar Gang', skilledCount: 16, unskilledCount: 8, totalCount: 24, hoursWorked: 8 },
        { trade: 'Shuttering Carpenters', contractorName: 'Precision Formworks', skilledCount: 12, unskilledCount: 6, totalCount: 18, hoursWorked: 8 },
        { trade: 'Masons (Brick & Stone)', contractorName: 'Apex Civil', skilledCount: 6, unskilledCount: 10, totalCount: 16, hoursWorked: 8 },
        { trade: 'General Site Helpers', contractorName: 'Day Labour Guild', skilledCount: 0, unskilledCount: 22, totalCount: 22, hoursWorked: 8 }
      ],
      totalManpower: 80,
      equipment: [
        { name: 'Tower Crane TC-5040', regNumber: 'EQ-TC-01', hoursRun: 7.5, hoursIdle: 0.5, breakdownHours: 0, remarks: 'Lifting rebar bundles & shuttering ply' },
        { name: 'JCB 3DX Super Excavator', regNumber: 'DL-01-EQ-9921', hoursRun: 6.0, hoursIdle: 2.0, breakdownHours: 0, remarks: 'Site grading & slope dressing' },
        { name: 'Rebar Bending Machine 40mm', regNumber: 'BM-04', hoursRun: 8.0, hoursIdle: 0, breakdownHours: 0, remarks: 'Heavy bar fabrication for raft' }
      ],
      materialsReceived: [
        { materialName: 'Fe 550D TMT Rebar 25mm', quantity: 24.5, unit: 'MT', supplier: 'Kamdhenu Steel Ltd', challanNo: 'CH-88210', vehicleNo: 'HR-55-AC-9122' },
        { materialName: 'OPC 53 Grade Cement', quantity: 450, unit: 'Bags', supplier: 'UltraTech Cement Corp', challanNo: 'CH-88215', vehicleNo: 'DL-1L-AA-3041' }
      ],
      workActivities: [
        { location: 'Foundation Raft Grid A1 to C4', description: 'Rebar mesh tying Fe550D top and bottom layers with chairs & cover blocks', quantityExecuted: 22.5, unit: 'MT', status: 'Completed' },
        { location: 'Perimeter Retaining Wall Trench', description: 'Fixing film-faced plywood shuttering and staging props', quantityExecuted: 75, unit: 'sqm', status: 'Completed' }
      ],
      workCompleted: 'Completed raft reinforcement grid A1 to C4. Shuttering erected along perimeter western flank. All rebar cover blocks verified at 75mm.',
      overallProgress: 42,
      safetyToolboxTopic: 'Working near heavy crane lifting radius & rigger signaling',
      safetyIncidents: 0,
      qualityTests: 'Rebar tensile & bend/re-bend test certificates checked. 100% compliant with IS 1786.',
      issues: 'Minor delay of 45 mins in morning due to rebar delivery truck traffic congestion at entry gate.',
      delays: 'None affecting critical path.',
      nextDayPlan: 'Continue bottom and top rebar mesh binding towards Grid D-F. Concrete pump positioning setup.',
      status: 'APPROVED',
      approvedAt: new Date(now - 1 * d),
      approvedBy: user._id,
      createdBy: user._id
    });

    // DPR 2: 1 Day ago (Approved)
    await SiteReport.create({
      organizationId: org._id,
      projectId: project._id,
      dprNo: 'DPR-2026-10-09',
      reportDate: new Date(now - 1 * d),
      siteEngineerId: user._id,
      weather: 'Clear / Hot',
      weatherDetails: {
        condition: 'SUNNY',
        tempMax: 36,
        tempMin: 25,
        rainfallMm: 0,
        shiftHours: 8,
        shiftsWorked: 1
      },
      manpower: [
        { trade: 'Barbenders & Steel Fixers', contractorName: 'Apex Rebar Gang', skilledCount: 18, unskilledCount: 10, totalCount: 28, hoursWorked: 8 },
        { trade: 'Shuttering Carpenters', contractorName: 'Precision Formworks', skilledCount: 14, unskilledCount: 8, totalCount: 22, hoursWorked: 8 },
        { trade: 'Masons & Concrete Finishers', contractorName: 'Apex Civil', skilledCount: 8, unskilledCount: 12, totalCount: 20, hoursWorked: 8 },
        { trade: 'General Site Helpers', contractorName: 'Day Labour Guild', skilledCount: 0, unskilledCount: 26, totalCount: 26, hoursWorked: 8 }
      ],
      totalManpower: 96,
      equipment: [
        { name: 'Tower Crane TC-5040', regNumber: 'EQ-TC-01', hoursRun: 8.0, hoursIdle: 0, breakdownHours: 0, remarks: 'Operational - round the clock' },
        { name: 'Schwing Stetter Concrete Pump SP1800', regNumber: 'SP-18', hoursRun: 5.5, hoursIdle: 2.5, breakdownHours: 0, remarks: 'Pump trial run and pipe clamping' },
        { name: 'Transit Mixers 7 cum (4 Units)', regNumber: 'TM-01 to 04', hoursRun: 6.0, hoursIdle: 2.0, breakdownHours: 0, remarks: 'Trial batch runs' }
      ],
      materialsReceived: [
        { materialName: 'Manufactured Sand (M-Sand Zone II)', quantity: 65, unit: 'Tonnes', supplier: 'Apex Aggregate Quarries', challanNo: 'CH-9011', vehicleNo: 'UP-16-BT-7744' },
        { materialName: '20mm Graded Coarse Aggregate', quantity: 80, unit: 'Tonnes', supplier: 'Apex Aggregate Quarries', challanNo: 'CH-9012', vehicleNo: 'UP-16-BT-7748' },
        { materialName: 'Fosroc Conplast SP430 Admixture', quantity: 600, unit: 'Liters', supplier: 'Fosroc Chemicals India', challanNo: 'CH-9033', vehicleNo: 'DL-3C-MM-1122' }
      ],
      workActivities: [
        { location: 'Foundation Raft Grid D1 to F6', description: 'Final rebar binding, starter bar alignment for columns C1-C8, and cover clearance check', quantityExecuted: 28.0, unit: 'MT', status: 'Completed' },
        { location: 'Pump Line Alignment', description: '125mm heavy duty pipeline laying from batching staging to raft pour point #1', quantityExecuted: 120, unit: 'm', status: 'Completed' }
      ],
      workCompleted: 'Raft foundation rebar inspection completed jointly with PMC structural consultant. All starter rebar positions verified with total station. Pre-pour clearance signed.',
      overallProgress: 48,
      safetyToolboxTopic: 'Night concreting precautions, high-lux floodlighting, and trip hazard prevention',
      safetyIncidents: 0,
      qualityTests: 'Slump retention check done at 30 mins: 140mm. Admixture dosage verified at 0.8% by weight of cement.',
      issues: 'Water tanker supply delayed by 1 hour, rectified with backup borehole line.',
      delays: 'Nil.',
      nextDayPlan: 'Commence monolithic Raft Concrete Pour #2 (280 cum M30 design mix). Two concrete pumps deployed.',
      status: 'APPROVED',
      approvedAt: new Date(now),
      approvedBy: user._id,
      createdBy: user._id
    });

    // DPR 3: Today's DPR (Submitted - Waiting for signoff)
    await SiteReport.create({
      organizationId: org._id,
      projectId: project._id,
      dprNo: 'DPR-2026-10-10',
      reportDate: new Date(now),
      siteEngineerId: user._id,
      weather: 'Sunny & Clear',
      weatherDetails: {
        condition: 'SUNNY',
        tempMax: 34,
        tempMin: 23,
        rainfallMm: 0,
        shiftHours: 8,
        shiftsWorked: 2
      },
      manpower: [
        { trade: 'Concrete Gang & Vibrator Operators', contractorName: 'Apex Pour Specialists', skilledCount: 16, unskilledCount: 24, totalCount: 40, hoursWorked: 8 },
        { trade: 'Barbenders & Steel Fixers', contractorName: 'Apex Rebar Gang', skilledCount: 14, unskilledCount: 6, totalCount: 20, hoursWorked: 8 },
        { trade: 'Shuttering Carpenters & Prop Fitters', contractorName: 'Precision Formworks', skilledCount: 12, unskilledCount: 6, totalCount: 18, hoursWorked: 8 },
        { trade: 'Masons (Surface Finishers & Floaters)', contractorName: 'Apex Civil', skilledCount: 10, unskilledCount: 8, totalCount: 18, hoursWorked: 8 },
        { trade: 'General Site Helpers & Curing Team', contractorName: 'Day Labour Guild', skilledCount: 0, unskilledCount: 22, totalCount: 22, hoursWorked: 8 }
      ],
      totalManpower: 118,
      equipment: [
        { name: 'Schwing Stetter 36m Boom Placer', regNumber: 'BP-36', hoursRun: 7.5, hoursIdle: 0.5, breakdownHours: 0, remarks: 'Pouring M30 concrete directly into raft grid' },
        { name: 'Transit Mixers 7 cum (6 Units Fleet)', regNumber: 'TM Fleet A', hoursRun: 8.0, hoursIdle: 0, breakdownHours: 0, remarks: 'Continuous cycle from RMC plant (18km lead)' },
        { name: 'Tower Crane TC-5040', regNumber: 'EQ-TC-01', hoursRun: 7.0, hoursIdle: 1.0, breakdownHours: 0, remarks: 'Positioning tremie chutes and vibration stands' },
        { name: 'Needle Vibrators 60mm & 40mm (6 Nos)', regNumber: 'VIB-01-06', hoursRun: 8.0, hoursIdle: 0, breakdownHours: 0, remarks: 'Full compaction without segregation' }
      ],
      materialsReceived: [
        { materialName: 'Ready Mix Concrete M30 Grade (Self-Compacting)', quantity: 280, unit: 'cum', supplier: 'UltraTech RMC Division', challanNo: 'RMC-44912', vehicleNo: 'Fleet Delivery' },
        { materialName: 'Curing Compound (Wax-based Emulsion)', quantity: 200, unit: 'Liters', supplier: 'Fosroc Chemicals India', challanNo: 'CH-9088', vehicleNo: 'DL-4C-EE-9011' },
        { materialName: 'Expanded Polystyrene Joint Filler 25mm', quantity: 45, unit: 'sqm', supplier: 'Supreme Industries', challanNo: 'CH-9092', vehicleNo: 'HR-38-Q-4411' }
      ],
      workActivities: [
        { location: 'Foundation Raft Pour #2 (Grid B2 to E5)', description: 'Monolithic concrete pour M30 design mix with temperature control ice batching', quantityExecuted: 280, unit: 'cum', status: 'Completed' },
        { location: 'Top Surface of Raft Grid B2-E5', description: 'Power floating and trowel smooth finishing followed by curing compound spray', quantityExecuted: 320, unit: 'sqm', status: 'In Progress' },
        { location: 'Column C1-C12 Starter Bars', description: 'Checking plumb line and verticality after concrete vibration', quantityExecuted: 12, unit: 'Nos', status: 'Completed' }
      ],
      workCompleted: 'Monolithic Raft Pour #2 executed successfully. Total 280 cum M30 concrete placed in 7.5 hours continuous pumping. Surface power-floated to ±3mm tolerance. Curing compound applied.',
      overallProgress: 56,
      safetyToolboxTopic: 'Chemical burn prevention from fresh concrete & eye protection during power-floating',
      safetyIncidents: 0,
      qualityTests: '18 concrete cube samples cast (6 for 7-day, 6 for 28-day, 6 for 56-day testing). Initial slump: 135mm, temp: 27°C. Passed all IS 456 criteria.',
      issues: 'Ambient midday temperature touched 34°C; chilled water addition in RMC maintained mix at 27°C.',
      delays: 'Zero delays.',
      nextDayPlan: 'Commence pond curing on raft. Begin column starter rebar tying and shuttering for Basement 2 columns C1-C16.',
      status: 'SUBMITTED',
      createdBy: user._id
    });

    // ==================== PHASE 5: MATERIALS & STORE INVENTORY ====================
    await Material.deleteMany({ projectId: project._id });
    await MaterialLedger.deleteMany({ projectId: project._id });
    await GoodsReceivedNote.deleteMany({ projectId: project._id });
    await MaterialIndent.deleteMany({ projectId: project._id });
    await StoreIssue.deleteMany({ projectId: project._id });

    // Seed Material SKUs
    const mCement = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-CEM-01',
      name: 'UltraTech OPC 53 Grade Cement',
      category: 'Cement',
      unit: 'Bags',
      minStock: 100,
      currentStock: 420,
      unitPrice: 385,
      hsnCode: '252329',
      storageLocation: 'Central Cement Silo / Yard Shed A',
      specification: 'IS 269:2015 High strength Portland cement'
    });

    const mSteel25 = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-STL-01',
      name: 'Fe 550D TMT Rebar 25mm (High Ductility)',
      category: 'Steel',
      unit: 'MT',
      minStock: 5,
      currentStock: 18.5,
      unitPrice: 58000,
      hsnCode: '721420',
      storageLocation: 'Steel Bending Yard Bay 1',
      specification: 'IS 1786:2008 Thermo-mechanically treated rebar'
    });

    const mSteel16 = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-STL-02',
      name: 'Fe 550D TMT Rebar 16mm (High Ductility)',
      category: 'Steel',
      unit: 'MT',
      minStock: 5,
      currentStock: 14.2,
      unitPrice: 59500,
      hsnCode: '721420',
      storageLocation: 'Steel Bending Yard Bay 2',
      specification: 'IS 1786:2008 Thermo-mechanically treated rebar'
    });

    const mSand = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-SND-01',
      name: 'Manufactured Sand (M-Sand Zone II)',
      category: 'Aggregates',
      unit: 'Tonnes',
      minStock: 30,
      currentStock: 85,
      unitPrice: 950,
      hsnCode: '250590',
      storageLocation: 'Aggregate Stockpile Yard B',
      specification: 'IS 383:2016 Zone-II fine aggregate'
    });

    const mAggregate = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-AGG-01',
      name: '20mm Graded Coarse Blue Granite Aggregate',
      category: 'Aggregates',
      unit: 'Tonnes',
      minStock: 40,
      currentStock: 110,
      unitPrice: 1150,
      hsnCode: '251710',
      storageLocation: 'Aggregate Stockpile Yard C',
      specification: 'IS 383:2016 Machine crushed granite'
    });

    const mAdmixture = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-CHM-01',
      name: 'Fosroc Conplast SP430 Superplasticizer',
      category: 'Chemicals',
      unit: 'Liters',
      minStock: 200,
      currentStock: 450,
      unitPrice: 145,
      hsnCode: '382440',
      storageLocation: 'Chemical Storage Container Chem-01',
      specification: 'ASTM C494 Type F High Range Water Reducer'
    });

    const mAACBlock = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-BLK-01',
      name: '200mm Autoclaved Aerated Concrete (AAC) Blocks',
      category: 'Masonry',
      unit: 'Nos',
      minStock: 500,
      currentStock: 2400,
      unitPrice: 62,
      hsnCode: '681011',
      storageLocation: 'Masonry Pallet Yard Block A',
      specification: 'IS 2185 Part 3: Compressive strength 4 N/mm2'
    });

    const mPlywood = await Material.create({
      organizationId: org._id,
      projectId: project._id,
      materialCode: 'MAT-PLY-01',
      name: '12mm Film-Faced Shuttering Plywood 34kg',
      category: 'Formwork',
      unit: 'sqm',
      minStock: 50,
      currentStock: 28, // LOW STOCK TRIGGER
      unitPrice: 480,
      hsnCode: '441233',
      storageLocation: 'Carpentry & Formwork Shed',
      specification: 'IS 4990: Calibrated mirror finish phenolic coated'
    });

    // Seed GRN 1: Cement delivery
    await GoodsReceivedNote.create({
      organizationId: org._id,
      projectId: project._id,
      grnNo: 'GRN-2026-0101',
      receivedDate: new Date(now - 2 * d),
      supplierName: 'UltraTech Cement Corp',
      challanNo: 'CH-88215',
      vehicleNo: 'DL-1L-AA-3041',
      driverName: 'Ramesh Singh',
      poNumber: 'PO-2026-0044',
      gatePassNo: 'GP-8812',
      items: [
        {
          materialId: mCement._id,
          materialName: mCement.name,
          category: 'Cement',
          unit: 'Bags',
          receivedQty: 450,
          acceptedQty: 450,
          rejectedQty: 0,
          unitPrice: 385,
          totalAmount: 173250,
          remarks: 'Bags in sound condition, dry and moisture-free'
        }
      ],
      totalAmount: 173250,
      qualityInspectionDone: true,
      inspectionNotes: 'Batch #OCT-26 test certificate verified. Initial setting time 45 mins.',
      status: 'ACCEPTED',
      receivedBy: user._id,
      approvedBy: user._id
    });

    // Seed GRN 2: Rebar delivery
    await GoodsReceivedNote.create({
      organizationId: org._id,
      projectId: project._id,
      grnNo: 'GRN-2026-0102',
      receivedDate: new Date(now - 2 * d),
      supplierName: 'Kamdhenu Steel Ltd',
      challanNo: 'CH-88210',
      vehicleNo: 'HR-55-AC-9122',
      driverName: 'Satish Yadav',
      poNumber: 'PO-2026-0045',
      gatePassNo: 'GP-8813',
      items: [
        {
          materialId: mSteel25._id,
          materialName: mSteel25.name,
          category: 'Steel',
          unit: 'MT',
          receivedQty: 24.5,
          acceptedQty: 24.5,
          rejectedQty: 0,
          unitPrice: 58000,
          totalAmount: 1421000,
          remarks: 'Mill test certificates for Heat #5544 checked'
        }
      ],
      totalAmount: 1421000,
      qualityInspectionDone: true,
      inspectionNotes: 'Weighbridge slip matches delivery challan exactly within 0.1% tolerance.',
      status: 'ACCEPTED',
      receivedBy: user._id,
      approvedBy: user._id
    });

    // Seed Store Issue 1: Cement issued for foundation blinding
    await StoreIssue.create({
      organizationId: org._id,
      projectId: project._id,
      issueSlipNo: 'ISS-2026-0041',
      issueDate: new Date(now - 1 * d),
      issuedTo: 'Apex Civil Gang A',
      locationGrid: 'Foundation Raft Grid A1 to C4',
      wbsCode: '1.3',
      purpose: 'PCC 1:4:8 Bedding Layer and sump blinding concrete',
      items: [
        {
          materialId: mCement._id,
          materialName: mCement.name,
          unit: 'Bags',
          issuedQty: 180,
          unitPrice: 385,
          totalCost: 69300
        },
        {
          materialId: mSand._id,
          materialName: mSand.name,
          unit: 'Tonnes',
          issuedQty: 24,
          unitPrice: 950,
          totalCost: 22800
        }
      ],
      totalCost: 92100,
      status: 'ISSUED',
      issuedBy: user._id,
      receivedBySign: 'Foreman Ram Lal'
    });

    // Seed Store Issue 2: Rebar issued for Raft mesh
    await StoreIssue.create({
      organizationId: org._id,
      projectId: project._id,
      issueSlipNo: 'ISS-2026-0042',
      issueDate: new Date(now - 1 * d),
      issuedTo: 'Apex Rebar Team',
      locationGrid: 'Foundation Raft Grid D1 to F6',
      wbsCode: '1.4',
      purpose: 'Top and bottom reinforcement mat fabrication',
      items: [
        {
          materialId: mSteel25._id,
          materialName: mSteel25.name,
          unit: 'MT',
          issuedQty: 10.5,
          unitPrice: 58000,
          totalCost: 609000
        }
      ],
      totalCost: 609000,
      status: 'ISSUED',
      issuedBy: user._id,
      receivedBySign: 'Bar Bending Master Raju'
    });

    // Seed Material Indent 1: Cement Indent (Approved)
    await MaterialIndent.create({
      organizationId: org._id,
      projectId: project._id,
      indentNo: 'IND-2026-0012',
      requestDate: new Date(now - 3 * d),
      requiredByDate: new Date(now + 2 * d),
      priority: 'HIGH',
      wbsActivity: '1.5 Raft Concrete Pour M30',
      remarks: 'Required for backup site batching and retaining wall starters',
      items: [
        {
          materialId: mCement._id,
          materialName: mCement.name,
          unit: 'Bags',
          requiredQty: 500,
          estimatedRate: 385,
          currentStock: 420,
          purpose: 'Retaining wall casting & structural masonry'
        }
      ],
      totalEstimatedCost: 192500,
      status: 'APPROVED',
      requestedBy: user._id,
      approvedBy: user._id,
      approvedAt: new Date(now - 2 * d)
    });

    // Seed Material Indent 2: Shuttering Plywood (Urgent - Pending)
    await MaterialIndent.create({
      organizationId: org._id,
      projectId: project._id,
      indentNo: 'IND-2026-0013',
      requestDate: new Date(now),
      requiredByDate: new Date(now + 3 * d),
      priority: 'URGENT',
      wbsActivity: '2.1 Basement 2 Retaining Walls & Columns',
      remarks: 'Current stock is below minimum buffer threshold. Formwork for Basement 2 columns starting next week.',
      items: [
        {
          materialId: mPlywood._id,
          materialName: mPlywood.name,
          unit: 'sqm',
          requiredQty: 150,
          estimatedRate: 480,
          currentStock: 28,
          purpose: 'Column shuttering boxes & retaining wall formwork'
        }
      ],
      totalEstimatedCost: 72000,
      status: 'PENDING_APPROVAL',
      requestedBy: user._id
    });

    // Seed Material Ledger entries
    await MaterialLedger.create([
      {
        organizationId: org._id,
        projectId: project._id,
        materialId: mCement._id,
        type: 'RECEIPT',
        quantity: 450,
        referenceId: 'GRN-2026-0101',
        notes: 'Inward gate entry from UltraTech Cement (Challan #CH-88215)',
        createdBy: user._id
      },
      {
        organizationId: org._id,
        projectId: project._id,
        materialId: mCement._id,
        type: 'CONSUMPTION',
        quantity: -180,
        referenceId: 'ISS-2026-0041',
        notes: 'Issued to Apex Civil Gang A for Raft Grid A1-C4',
        createdBy: user._id
      },
      {
        organizationId: org._id,
        projectId: project._id,
        materialId: mSteel25._id,
        type: 'RECEIPT',
        quantity: 24.5,
        referenceId: 'GRN-2026-0102',
        notes: 'Inward gate entry from Kamdhenu Steel (Challan #CH-88210)',
        createdBy: user._id
      },
      {
        organizationId: org._id,
        projectId: project._id,
        materialId: mSteel25._id,
        type: 'CONSUMPTION',
        quantity: -10.5,
        referenceId: 'ISS-2026-0042',
        notes: 'Issued to Apex Rebar Team for Raft Grid D1-F6',
        createdBy: user._id
      }
    ]);

    // ==================== PHASE 6: LABOUR MUSTER ROLL & GANG WAGES ====================
    await Worker.deleteMany({ projectId: project._id });
    await Attendance.deleteMany({ projectId: project._id });
    await LabourWageSheet.deleteMany({ projectId: project._id });

    // Seed 10 realistic workers across different trades and gangs
    const workersData = [
      {
        workerCode: 'WRK-101',
        name: 'Ram Lal Sharma',
        category: 'Mason',
        skillLevel: 'SKILLED',
        thekedaar: 'Apex Civil Gang',
        dailyRate: 950,
        overtimeHourlyRate: 180,
        phone: '+91 98112 44101',
        aadhaarNo: 'XXXX-XXXX-4812',
        totalPaid: 14250,
        totalAdvance: 1500
      },
      {
        workerCode: 'WRK-102',
        name: 'Dinesh Kumar',
        category: 'Mason',
        skillLevel: 'SKILLED',
        thekedaar: 'Apex Civil Gang',
        dailyRate: 900,
        overtimeHourlyRate: 170,
        phone: '+91 98112 44102',
        aadhaarNo: 'XXXX-XXXX-4815',
        totalPaid: 13500,
        totalAdvance: 1000
      },
      {
        workerCode: 'WRK-103',
        name: 'Suresh Paswan',
        category: 'Helper',
        skillLevel: 'UNSKILLED',
        thekedaar: 'Apex Civil Gang',
        dailyRate: 600,
        overtimeHourlyRate: 110,
        phone: '+91 98112 44103',
        aadhaarNo: 'XXXX-XXXX-4819',
        totalPaid: 9000,
        totalAdvance: 500
      },
      {
        workerCode: 'WRK-104',
        name: 'Raju Mistri (Rebar Master)',
        category: 'Bar Bender',
        skillLevel: 'SKILLED',
        thekedaar: 'Apex Rebar Crew',
        dailyRate: 1050,
        overtimeHourlyRate: 200,
        phone: '+91 98112 44104',
        aadhaarNo: 'XXXX-XXXX-5521',
        totalPaid: 15750,
        totalAdvance: 2000
      },
      {
        workerCode: 'WRK-105',
        name: 'Mukesh Yadav',
        category: 'Bar Bender',
        skillLevel: 'SEMI_SKILLED',
        thekedaar: 'Apex Rebar Crew',
        dailyRate: 850,
        overtimeHourlyRate: 160,
        phone: '+91 98112 44105',
        aadhaarNo: 'XXXX-XXXX-5524',
        totalPaid: 12750,
        totalAdvance: 0
      },
      {
        workerCode: 'WRK-106',
        name: 'Sunil Kumar',
        category: 'Helper',
        skillLevel: 'UNSKILLED',
        thekedaar: 'Apex Rebar Crew',
        dailyRate: 600,
        overtimeHourlyRate: 110,
        phone: '+91 98112 44106',
        aadhaarNo: 'XXXX-XXXX-5529',
        totalPaid: 9000,
        totalAdvance: 600
      },
      {
        workerCode: 'WRK-107',
        name: 'Jagdish Carpenter',
        category: 'Carpenter',
        skillLevel: 'SKILLED',
        thekedaar: 'Precision Formworks',
        dailyRate: 1000,
        overtimeHourlyRate: 190,
        phone: '+91 98112 44107',
        aadhaarNo: 'XXXX-XXXX-7701',
        totalPaid: 15000,
        totalAdvance: 1500
      },
      {
        workerCode: 'WRK-108',
        name: 'Santosh Pal',
        category: 'Carpenter',
        skillLevel: 'SEMI_SKILLED',
        thekedaar: 'Precision Formworks',
        dailyRate: 850,
        overtimeHourlyRate: 160,
        phone: '+91 98112 44108',
        aadhaarNo: 'XXXX-XXXX-7705',
        totalPaid: 12750,
        totalAdvance: 0
      },
      {
        workerCode: 'WRK-109',
        name: 'Govind Mandal',
        category: 'Electrician',
        skillLevel: 'SKILLED',
        thekedaar: 'General MEP Team',
        dailyRate: 1100,
        overtimeHourlyRate: 210,
        phone: '+91 98112 44109',
        aadhaarNo: 'XXXX-XXXX-9912',
        totalPaid: 16500,
        totalAdvance: 1000
      },
      {
        workerCode: 'WRK-110',
        name: 'Vikram Singh',
        category: 'Helper',
        skillLevel: 'UNSKILLED',
        thekedaar: 'Day Labour Guild',
        dailyRate: 600,
        overtimeHourlyRate: 110,
        phone: '+91 98112 44110',
        aadhaarNo: 'XXXX-XXXX-9915',
        totalPaid: 9000,
        totalAdvance: 400
      }
    ];

    const seededWorkers = [];
    for (const wData of workersData) {
      const w = await Worker.create({
        organizationId: org._id,
        projectId: project._id,
        ...wData,
        payments: [
          {
            amount: 5000,
            type: 'WAGE',
            date: new Date(now - 14 * d),
            notes: 'Fortnightly settlement cycle #1',
            paymentMode: 'BANK_TRANSFER'
          }
        ]
      });
      seededWorkers.push(w);
    }

    // Seed 7 days of attendance & overtime for all workers
    for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
      const attDate = new Date(now - dayOffset * d);
      attDate.setHours(0, 0, 0, 0);

      for (let idx = 0; idx < seededWorkers.length; idx++) {
        const worker = seededWorkers[idx];
        // Most present, occasional half-day or OT
        let status = 'Present';
        let hoursWorked = 8;
        let overtimeHours = 0;

        if (dayOffset === 2 && idx === 2) {
          status = 'Absent';
          hoursWorked = 0;
        } else if (dayOffset === 1 && idx === 7) {
          status = 'Half-Day';
          hoursWorked = 4;
        } else if (dayOffset === 0 && (idx === 0 || idx === 3)) {
          // Night pour overtime
          overtimeHours = 3;
        } else if (dayOffset === 1 && (idx === 1 || idx === 4)) {
          overtimeHours = 2;
        }

        await Attendance.create({
          organizationId: org._id,
          projectId: project._id,
          workerId: worker._id,
          date: attDate,
          status,
          hoursWorked,
          overtimeHours,
          taskLocation: 'Raft Foundation & Retaining Wall',
          markedBy: user._id
        });
      }
    }

    // Seed Official CPWD Form 21 Nominal Muster Roll & Wage Sheet
    const sDate = new Date(now - 6 * d);
    sDate.setHours(0, 0, 0, 0);
    const eDate = new Date(now);
    eDate.setHours(23, 59, 59, 999);

    const wageLineItems = seededWorkers.map(w => {
      const daysWorked = 6.5; // effective days
      const baseWages = Math.round(daysWorked * w.dailyRate);
      const otHours = 3;
      const otWages = Math.round(otHours * (w.overtimeHourlyRate || 180));
      const grossWage = baseWages + otWages;
      const advanceDeduction = Math.min(w.totalAdvance, 1000);
      const statutoryDeduction = Math.round(grossWage * 0.01); // 1% Labour Welfare Cess
      const netPayable = grossWage - advanceDeduction - statutoryDeduction;

      return {
        workerId: w._id,
        workerName: w.name,
        workerCode: w.workerCode,
        trade: w.category,
        skillLevel: w.skillLevel,
        thekedaar: w.thekedaar,
        dailyRate: w.dailyRate,
        overtimeHourlyRate: w.overtimeHourlyRate,
        daysPresent: 6,
        halfDays: 1,
        daysWorkedEffective: daysWorked,
        otHours,
        baseWages,
        otWages,
        grossWage,
        advanceDeduction,
        statutoryDeduction,
        netPayable,
        paymentStatus: 'PAID',
        paymentMode: 'CASH',
        paidAt: new Date(now)
      };
    });

    await LabourWageSheet.create({
      organizationId: org._id,
      projectId: project._id,
      sheetNo: 'NMR-2026-W41',
      thekedaar: 'All Site Gangs',
      startDate: sDate,
      endDate: eDate,
      lineItems: wageLineItems,
      status: 'DISBURSED',
      preparedBy: user._id,
      verifiedBy: user._id,
      approvedBy: user._id,
      disbursedAt: new Date(now)
    });

    console.log('Successfully seeded Contractor OS Project, BOQ, MB, Gantt Schedule, DPRs, Store Inventory, and Labour Muster Roll Wage Sheets!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding contractor data:', error);
    process.exit(1);
  }
};

seedContractor();
