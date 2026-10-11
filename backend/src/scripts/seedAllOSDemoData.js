import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import OSProduct from '../models/OSProduct.js';
import OSPlan from '../models/OSPlan.js';
import Subscription from '../models/Subscription.js';

// Contractor Models
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import BOQ from '../models/BOQ.js';
import BOQItem from '../models/BOQItem.js';
import RABill from '../models/RABill.js';
import GoodsReceivedNote from '../models/GoodsReceivedNote.js';
import LabourWageSheet from '../models/LabourWageSheet.js';
import Expense from '../models/Expense.js';
import Equipment from '../models/Equipment.js';
import EquipmentLog from '../models/EquipmentLog.js';
import Snag from '../models/Snag.js';
import PettyCashAccount from '../models/PettyCashAccount.js';
import PettyCashTransaction from '../models/PettyCashTransaction.js';
import Document from '../models/Document.js';

// Supplier Models
import SupplierProduct from '../models/SupplierProduct.js';
import SupplierCustomer from '../models/SupplierCustomer.js';
import SupplierVendor from '../models/SupplierVendor.js';
import SupplierOrder from '../models/SupplierOrder.js';
import SupplierDelivery from '../models/SupplierDelivery.js';
import SupplierInvoice from '../models/SupplierInvoice.js';
import SupplierVehicle from '../models/SupplierVehicle.js';
import SupplierDriver from '../models/SupplierDriver.js';
import SupplierInventoryLedger from '../models/SupplierInventoryLedger.js';

// Distributor Models
import DistributorCustomer from '../models/DistributorCustomer.js';
import DistributorSupplier from '../models/DistributorSupplier.js';
import DistributorStock from '../models/DistributorStock.js';
import DistributorSale from '../models/DistributorSale.js';
import DistributorPurchase from '../models/DistributorPurchase.js';
import DistributorPayment from '../models/DistributorPayment.js';
import DistributorExpense from '../models/DistributorExpense.js';
import DistributorVehicle from '../models/DistributorVehicle.js';

// Diagnostics Models
import Test from '../models/Test.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Order from '../models/Order.js';
import Sample from '../models/Sample.js';
import Result from '../models/Result.js';
import LabPaymentReceipt from '../models/LabPaymentReceipt.js';
import QualityControl from '../models/QualityControl.js';

// Restaurant Models
import RestaurantArea from '../models/RestaurantArea.js';
import RestaurantTable from '../models/RestaurantTable.js';
import RestaurantMenuCategory from '../models/RestaurantMenuCategory.js';
import RestaurantMenuItem from '../models/RestaurantMenuItem.js';
import RestaurantOrder from '../models/RestaurantOrder.js';
import RestaurantBill from '../models/RestaurantBill.js';
import RestaurantShift from '../models/RestaurantShift.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';

async function ensureEnterpriseSubscription(org, businessType) {
  try {
    let product = await OSProduct.findOne({ businessType });
    if (!product) {
      product = await OSProduct.findOne({ slug: businessType.toLowerCase().replace('_', '-') });
    }
    if (!product) {
      product = await OSProduct.create({
        name: `${businessType.replace('_', ' ')} OS`,
        slug: businessType.toLowerCase().replace('_', '-'),
        businessType: businessType,
        status: 'production'
      });
    }

    let entPlan = await OSPlan.findOne({ osProductId: product._id, tier: 'ENTERPRISE' });
    if (!entPlan) {
      entPlan = await OSPlan.create({
        name: `${product.name} Enterprise`,
        tier: 'ENTERPRISE',
        osProductId: product._id,
        monthlyPrice: 9999,
        yearlyPrice: 99999,
        isActive: true,
        featureEntitlements: {
          coreProjects: true,
          boqEngine: true,
          dailyProgressReports: true,
          snagVault: true,
          pettyCashLedger: true,
          machineryDiesel: true,
          civilPnL: true,
          drawingVault: true,
          productCatalog: true,
          salesOrders: true,
          vehicleFleet: true,
          directCustomerLedger: true,
          inventoryLedger: true,
          automatedChallans: true,
          patientRegistration: true,
          testCatalog: true,
          orderManagement: true,
          phlebotomyQueue: true,
          analyzerInterfacing: true,
          verifiedReporting: true,
          qualityControlLJ: true,
          doctorIncentives: true,
          posBasic: true,
          dineInTables: true,
          kitchenDisplay: true,
          recipeCosting: true,
          inventoryLedger: true,
          cashierShifts: true,
          multiStationKDS: true,
          whiteLabelReceipts: true
        }
      });
    }

    let sub = await Subscription.findOne({ organizationId: org._id });
    if (!sub) {
      sub = await Subscription.create({
        organizationId: org._id,
        osProductId: product._id,
        osPlanId: entPlan._id,
        status: 'ACTIVE',
        billingCycle: 'yearly',
        basePrice: 99999,
        finalAmount: 99999,
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      });
    } else {
      sub.osProductId = product._id;
      sub.osPlanId = entPlan._id;
      sub.status = 'ACTIVE';
      await sub.save();
    }
    console.log(`⭐ [Plan & Subscription] Ensured TOP-TIER ENTERPRISE plan for ${org.name}`);
  } catch (err) {
    console.warn(`Could not ensure subscription for ${org.name}:`, err.message);
  }
}

async function seedAll() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB for Universal OS Demo Data Seeding...');

    // =========================================================================
    // 1. CONTRACTOR OS (Contractor Demo)
    // =========================================================================
    console.log('\n--- 1. Seeding Contractor OS (Contractor Demo) ---');
    const contractorOrg = await Organization.findOne({ name: 'Contractor Demo' });
    const contractorUser = await User.findOne({ email: 'contractor@example.com' });

    if (contractorOrg && contractorUser) {
      const orgId = contractorOrg._id;
      const userId = contractorUser._id;

      await ensureEnterpriseSubscription(contractorOrg, 'CONTRACTOR');

      // Client
      let client = await Client.findOne({ organizationId: orgId });
      if (!client) {
        client = await Client.create({
          organizationId: orgId,
          name: 'Prestige Urban Infra Pvt Ltd',
          email: 'projects@prestigeurban.com',
          phone: '+91 98201 44552',
          address: 'Tower 4, Horizon Business Bay, Whitefield, Bengaluru'
        });
      }

      // Projects
      let project = await Project.findOne({ organizationId: orgId, projectCode: 'PRJ-SKY-01' });
      if (!project) {
        project = await Project.create({
          organizationId: orgId,
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
          startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          projectManagerId: userId,
          createdBy: userId,
          contractType: 'ITEM_RATE',
          totalBuiltUpArea: '145,000 sq.ft',
          numberOfFloors: 27
        });
      }

      // 2nd project for multi-project dropdown
      let project2 = await Project.findOne({ organizationId: orgId, projectCode: 'PRJ-GRN-02' });
      if (!project2) {
        project2 = await Project.create({
          organizationId: orgId,
          clientId: client._id,
          projectCode: 'PRJ-GRN-02',
          name: 'Greenwood Commercial Business Park',
          description: 'Commercial IT tech park, 3 basements, 12 corporate levels, LEED Platinum certified.',
          projectType: 'COMMERCIAL',
          location: 'Outer Ring Road, Marathahalli',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560103',
          contractValue: 62000000,
          estimatedCost: 51000000,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          expectedEndDate: new Date(Date.now() + 400 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
          projectManagerId: userId,
          createdBy: userId,
          contractType: 'ITEM_RATE',
          totalBuiltUpArea: '220,000 sq.ft',
          numberOfFloors: 15
        });
      }

      // Master BOQ & Items
      let boq = await BOQ.findOne({ projectId: project._id });
      if (!boq) {
        boq = await BOQ.create({
          organizationId: orgId,
          projectId: project._id,
          name: 'Skyline Heights Master Bill of Quantities (Civil & Finishes)',
          version: 'v1.0',
          totalAmount: 18450000,
          status: 'APPROVED',
          createdBy: userId
        });
      }

      let boqItem = await BOQItem.findOne({ projectId: project._id });
      if (!boqItem) {
        boqItem = await BOQItem.create({
          organizationId: orgId,
          projectId: project._id,
          boqId: boq._id,
          sectionId: 'SUB-STRUCTURE',
          itemCode: 'BOQ-01.10',
          description: 'Earthwork excavation in foundation trenches and raft pits in all kinds of soil.',
          unit: 'cum',
          quantity: 1250,
          rate: 285,
          totalAmount: 356250,
          executedQty: 1250,
          billedQty: 1250,
          status: 'COMPLETED'
        });
      }

      // Clear & Seed Multi-Month RA Bills
      await RABill.deleteMany({ organizationId: orgId });
      const now = new Date();

      const monthlyBills = [
        {
          monthOffset: 0,
          billNo: 'RA Bill #04',
          period: '01 Oct 2026 - 31 Oct 2026',
          grossCurrentAmount: 1450000,
          grossUptoDateAmount: 4850000,
          netPayable: 1410000,
          paidAmount: 1410000,
          status: 'PAID'
        },
        {
          monthOffset: 1,
          billNo: 'RA Bill #03',
          period: '01 Sep 2026 - 30 Sep 2026',
          grossCurrentAmount: 1240000,
          grossUptoDateAmount: 3400000,
          netPayable: 1195000,
          paidAmount: 1195000,
          status: 'PAID'
        },
        {
          monthOffset: 2,
          billNo: 'RA Bill #02',
          period: '01 Aug 2026 - 31 Aug 2026',
          grossCurrentAmount: 1160000,
          grossUptoDateAmount: 2160000,
          netPayable: 1120000,
          paidAmount: 1120000,
          status: 'PAID'
        },
        {
          monthOffset: 3,
          billNo: 'RA Bill #01',
          period: '01 Jul 2026 - 31 Jul 2026',
          grossCurrentAmount: 1000000,
          grossUptoDateAmount: 1000000,
          netPayable: 965000,
          paidAmount: 965000,
          status: 'PAID'
        }
      ];

      for (const b of monthlyBills) {
        const d = new Date(now.getFullYear(), now.getMonth() - b.monthOffset, 15);
        await RABill.create({
          organizationId: orgId,
          projectId: project._id,
          clientId: client._id,
          billNo: b.billNo,
          billSequence: 4 - b.monthOffset,
          billDate: d,
          period: b.period,
          periodFrom: new Date(d.getFullYear(), d.getMonth(), 1),
          periodTo: new Date(d.getFullYear(), d.getMonth() + 1, 0),
          items: [{
            boqItemId: boqItem._id,
            itemCode: 'BOQ-01.10',
            description: 'RCC Substructure and raft works certified',
            unit: 'cum',
            rate: 285,
            tenderQty: 1250,
            currentQty: 250,
            uptoDateQty: 1000,
            currentAmount: b.grossCurrentAmount,
            uptoDateAmount: b.grossUptoDateAmount
          }],
          grossCurrentAmount: b.grossCurrentAmount,
          grossAmount: b.grossCurrentAmount,
          grossUptoDateAmount: b.grossUptoDateAmount,
          retentionPercent: 5,
          retentionAmount: Math.round(b.grossCurrentAmount * 0.05),
          labourCessPercent: 1,
          labourCessAmount: Math.round(b.grossCurrentAmount * 0.01),
          tdsPercent: 2,
          tdsAmount: Math.round(b.grossCurrentAmount * 0.02),
          totalDeductions: Math.round(b.grossCurrentAmount * 0.08),
          gstPercent: 18,
          gstAmount: Math.round(b.grossCurrentAmount * 0.18),
          netPayable: b.netPayable,
          paidAmount: b.paidAmount,
          balanceDue: 0,
          paymentStatus: 'PAID',
          status: 'PAID',
          createdBy: userId
        });
      }

      // Material GRNs across months
      await GoodsReceivedNote.deleteMany({ organizationId: orgId });
      for (let i = 0; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 10);
        await GoodsReceivedNote.create({
          organizationId: orgId,
          projectId: project._id,
          grnNo: `GRN-2026-M${4 - i}`,
          receivedDate: d,
          supplierName: 'UltraTech ReadyMix Concrete Terminal',
          challanNo: `CH-RMC-09${i}`,
          vehicleNo: `DL-1M-489${i}`,
          driverName: 'Suresh Yadav',
          totalAmount: 480000 - (i * 20000),
          status: 'ACCEPTED',
          items: [{
            materialName: 'Design Mix Concrete M25',
            category: 'Concrete',
            unit: 'cum',
            receivedQty: 95,
            acceptedQty: 95,
            unitPrice: 4800,
            totalAmount: 456000
          }],
          receivedBy: userId,
          approvedBy: userId
        });
      }

      // Labour Wage Sheets across months
      await LabourWageSheet.deleteMany({ organizationId: orgId });
      for (let i = 0; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 20);
        await LabourWageSheet.create({
          organizationId: orgId,
          projectId: project._id,
          sheetNo: `LWS-2026-0${4 - i}`,
          startDate: new Date(d.getFullYear(), d.getMonth(), 1),
          endDate: new Date(d.getFullYear(), d.getMonth(), 15),
          totalWorkers: 28,
          totalGrossWage: 260000 - (i * 15000),
          totalNetPayable: 245000 - (i * 15000),
          status: 'DISBURSED',
          disbursedAt: d,
          preparedBy: userId
        });
      }

      // Site Expenses
      await Expense.deleteMany({ organizationId: orgId });
      for (let i = 0; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 5);
        await Expense.create({
          organizationId: orgId,
          projectId: project._id,
          description: `Site Equipment Diesel & Power Grid Tariff - Month ${4 - i}`,
          category: 'Equipment',
          amount: 45000 + (i * 3000),
          date: d,
          status: 'Approved',
          paidBy: userId
        });
      }

      // Heavy Machinery & Equipment
      await Equipment.deleteMany({ organizationId: orgId });
      await EquipmentLog.deleteMany({ organizationId: orgId });

      const eq1 = await Equipment.create({
        organizationId: orgId,
        projectId: project._id,
        name: 'JCB 3DX Super Backhoe Loader',
        equipmentCode: 'EQ-JCB-01',
        category: 'EARTHMOVING',
        ownership: 'RENTED',
        supplierOrOwner: 'Kailash Heavy Earthmovers',
        registrationNo: 'MH-14-EA-4821',
        operatorName: 'Ramesh Yadav',
        rentalRate: 1150,
        fuelType: 'DIESEL',
        currentMeterReading: 1276.5,
        status: 'ACTIVE'
      });

      const eq2 = await Equipment.create({
        organizationId: orgId,
        projectId: project._id,
        name: 'Liebherr 71K Tower Crane (50m Jib)',
        equipmentCode: 'EQ-TCR-01',
        category: 'LIFTING',
        ownership: 'OWNED',
        supplierOrOwner: 'Apex Plant & Machinery Fleet',
        registrationNo: 'TC-LIEB-8902',
        operatorName: 'Sanjay Kumar (Certified Rigger)',
        rentalRate: 3500,
        fuelType: 'ELECTRIC',
        currentMeterReading: 2450,
        status: 'ACTIVE'
      });

      // Equipment Day Logs
      for (let i = 0; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 12);
        await EquipmentLog.create({
          organizationId: orgId,
          equipmentId: eq1._id,
          projectId: project._id,
          logDate: d,
          slipNo: `EQ-LOG-2026-M${4 - i}`,
          startMeter: 1200 + (i * 20),
          endMeter: 1208 + (i * 20),
          operatingHours: 8,
          fuelIssuedLiters: 44,
          fuelRatePerLiter: 95,
          fuelTotalCost: 4180,
          equipmentRentalCost: 9200,
          totalDayCost: 13380,
          operatorName: 'Ramesh Yadav',
          recordedBy: userId,
          status: 'VERIFIED'
        });
      }

      // Site Snags
      await Snag.deleteMany({ organizationId: orgId });
      await Snag.create([
        {
          organizationId: orgId,
          projectId: project._id,
          snagNumber: 'SNG-2026-001',
          title: 'Structural Honeycombing on Column C3 after formwork stripping',
          description: 'Coarse aggregate exposed with voids near beam-column junction. Pressure grouting with non-shrink micro-concrete required.',
          category: 'CONCRETE',
          severity: 'CRITICAL',
          location: 'Basement 1, Grid Line B-4',
          status: 'IN_PROGRESS',
          costImpact: 18500,
          identifiedBy: userId,
          photos: [
            {
              url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?w=600&auto=format&fit=crop',
              caption: 'Visible honeycomb defect at base of column C3',
              type: 'BEFORE'
            }
          ]
        },
        {
          organizationId: orgId,
          projectId: project._id,
          snagNumber: 'SNG-2026-002',
          title: 'Cover block displacement leading to exposed stirrups on Shear Wall SW2',
          description: 'Cover block displaced during pouring. Epoxy mortar patch needed.',
          category: 'REBAR_FORMWORK',
          severity: 'MAJOR',
          location: 'Floor 3, Lift Core Wall',
          status: 'OPEN',
          costImpact: 12000,
          identifiedBy: userId
        },
        {
          organizationId: orgId,
          projectId: project._id,
          snagNumber: 'SNG-2026-003',
          title: 'Misaligned electrical conduit drops in Kitchen shaft unit 402',
          description: 'PVC conduit routed through structural beam flange instead of designated sleeve.',
          category: 'ELECTRICAL_MEP',
          severity: 'MINOR',
          location: 'Tower A, Flat 402',
          status: 'RESOLVED',
          costImpact: 4500,
          identifiedBy: userId
        }
      ]);

      // Petty Cash Accounts & Transactions
      await PettyCashAccount.deleteMany({ organizationId: orgId });
      await PettyCashTransaction.deleteMany({ organizationId: orgId });

      const floatAcc = await PettyCashAccount.create({
        organizationId: orgId,
        projectId: project._id,
        supervisorName: 'Kishore Site Supervisor',
        supervisorPhone: '9822011223',
        upiId: 'kishore.site@okhdfcbank',
        allocatedFloat: 25000,
        currentBalance: 14850,
        totalReceived: 35000,
        totalSpent: 20150,
        status: 'ACTIVE'
      });

      await PettyCashTransaction.create([
        {
          organizationId: orgId,
          projectId: project._id,
          accountId: floatAcc._id,
          voucherNo: 'TOP-2026-001',
          type: 'TOP_UP',
          amount: 25000,
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          description: 'Initial site imprest float issued via bank transfer',
          paymentMode: 'BANK_TRANSFER',
          status: 'APPROVED',
          approvedBy: userId
        },
        {
          organizationId: orgId,
          projectId: project._id,
          accountId: floatAcc._id,
          voucherNo: 'VCH-2026-001',
          type: 'EXPENSE',
          amount: 3200,
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          category: 'SAFETY_PPE',
          description: 'Purchase of 15 pairs ISI safety helmets & neon reflective vests for reinforcement crew',
          vendorName: 'M/s Industrial Safety Mart',
          paymentMode: 'UPI',
          status: 'APPROVED',
          approvedBy: userId
        },
        {
          organizationId: orgId,
          projectId: project._id,
          accountId: floatAcc._id,
          voucherNo: 'VCH-2026-002',
          type: 'EXPENSE',
          amount: 6950,
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          category: 'SITE_HARDWARE',
          description: 'Hilti anchor bolts, masonry drill bits & binding wire coils',
          vendorName: 'Om Hardware & Tools Depot',
          paymentMode: 'CASH',
          status: 'APPROVED',
          approvedBy: userId
        }
      ]);

      // GFC Drawings & Documents
      await Document.deleteMany({ organizationId: orgId });
      await Document.create([
        {
          organizationId: orgId,
          projectId: project._id,
          docType: 'DRAWING_GFC',
          title: 'Foundation Raft & Pile Cap Layout & Reinforcement Details',
          description: 'Good-For-Construction stamped structural drawing release for basement 2 raft pouring.',
          category: 'Drawings & Blueprints',
          drawingNumber: 'STR-FDN-001',
          discipline: 'STRUCTURAL',
          revision: 'R1',
          revisionNotes: 'Approved by Chief Consultant for site casting',
          status: 'GFC_ACTIVE',
          uploadedBy: userId,
          releaseDate: new Date()
        },
        {
          organizationId: orgId,
          projectId: project._id,
          docType: 'DRAWING_GFC',
          title: 'Tower A Typical Floor Architectural Layout (Fl 2 to 18)',
          description: '3BHK & 4BHK architectural blueprint with room clearances and door-window schedules.',
          category: 'Drawings & Blueprints',
          drawingNumber: 'ARC-TYP-004',
          discipline: 'ARCHITECTURAL',
          revision: 'R2',
          revisionNotes: 'Kitchen utility balcony dimensions revised as per RERA compliance',
          status: 'GFC_ACTIVE',
          uploadedBy: userId,
          releaseDate: new Date()
        },
        {
          organizationId: orgId,
          projectId: project._id,
          docType: 'DRAWING_GFC',
          title: 'Basement 1 Firefighting Hydrant & Wet Riser Network',
          description: 'MEP routing for fire sprinklers, smoke extract ductwork, and booster pumps.',
          category: 'Drawings & Blueprints',
          drawingNumber: 'MEP-FF-002',
          discipline: 'MEP_PLUMBING',
          revision: 'R1',
          revisionNotes: 'Coordinated with HVAC chiller duct clearances',
          status: 'GFC_ACTIVE',
          uploadedBy: userId,
          releaseDate: new Date()
        }
      ]);

      console.log('✅ Contractor OS: Seeded Projects, BOQs, RA Bills, Multi-Month Cash Flow, Heavy Machinery, Snags, Petty Cash & Drawings!');
    }

    // =========================================================================
    // 2. MATERIAL SUPPLIER OS (Supplier Demo)
    // =========================================================================
    console.log('\n--- 2. Seeding Material Supplier OS (Supplier Demo) ---');
    const supplierOrg = await Organization.findOne({ name: 'Supplier Demo' });
    const supplierUser = await User.findOne({ email: 'supplier@example.com' });

    if (supplierOrg && supplierUser) {
      const orgId = supplierOrg._id;
      const userId = supplierUser._id;

      await ensureEnterpriseSubscription(supplierOrg, 'MATERIAL_SUPPLIER');

      await SupplierProduct.deleteMany({ organizationId: orgId });
      await SupplierCustomer.deleteMany({ organizationId: orgId });
      await SupplierVendor.deleteMany({ organizationId: orgId });
      await SupplierOrder.deleteMany({ organizationId: orgId });
      await SupplierDelivery.deleteMany({ organizationId: orgId });
      await SupplierInvoice.deleteMany({ organizationId: orgId });
      await SupplierVehicle.deleteMany({ organizationId: orgId });
      await SupplierDriver.deleteMany({ organizationId: orgId });
      await SupplierInventoryLedger.deleteMany({ organizationId: orgId });

      // Vendors
      const v1 = await SupplierVendor.create({
        organizationId: orgId,
        name: 'Tata Steel Long Products Division',
        companyName: 'Tata Steel Ltd',
        phone: '9830114455',
        email: 'dispatch.kolkata@tatasteel.com',
        currentPayable: 1450000,
        status: 'ACTIVE'
      });

      const v2 = await SupplierVendor.create({
        organizationId: orgId,
        name: 'UltraTech Cement Bulk Terminal',
        companyName: 'UltraTech Cement Ltd',
        phone: '9830225566',
        email: 'bulk.east@ultratechcement.com',
        currentPayable: 820000,
        status: 'ACTIVE'
      });

      // Products
      const prod1 = await SupplierProduct.create({
        organizationId: orgId,
        name: 'UltraTech Super 53 Grade OPC Cement (50kg Bag)',
        sku: 'CEM-UT-53-BAG',
        category: 'CEMENT',
        unit: 'Bag',
        sellingPrice: 410,
        purchasePrice: 345,
        currentStock: 2800,
        minStockLevel: 500,
        status: 'ACTIVE'
      });

      const prod2 = await SupplierProduct.create({
        organizationId: orgId,
        name: 'Tata Tiscon 550D TMT High-Yield Rebar (16mm)',
        sku: 'STEEL-TT-16MM-MT',
        category: 'STEEL',
        unit: 'Ton',
        sellingPrice: 68500,
        purchasePrice: 61200,
        currentStock: 145,
        minStockLevel: 25,
        status: 'ACTIVE'
      });

      const prod3 = await SupplierProduct.create({
        organizationId: orgId,
        name: 'Washed River Sand (Coarse Grade Zone-II)',
        sku: 'AGG-SAND-Z2-CFT',
        category: 'AGGREGATES',
        unit: 'Piece',
        sellingPrice: 62,
        purchasePrice: 44,
        currentStock: 18500,
        minStockLevel: 2500,
        status: 'ACTIVE'
      });

      // Customers
      const cust1 = await SupplierCustomer.create({
        organizationId: orgId,
        name: 'Simplex Infrastructure Projects Ltd',
        contactPerson: 'Mr. Amitav Sengupta',
        phone: '9830337788',
        email: 'procurement@simplexinfra.in',
        creditLimit: 2500000,
        currentDue: 865000,
        paymentTerms: '30 Days Net',
        status: 'ACTIVE'
      });

      const cust2 = await SupplierCustomer.create({
        organizationId: orgId,
        name: 'L&T Construction - Metro Rail Site 4',
        contactPerson: 'K. Balaji (Purchase Manager)',
        phone: '9830448899',
        email: 'metro.purchases@lntecc.com',
        creditLimit: 5000000,
        currentDue: 1240000,
        paymentTerms: '45 Days Net',
        status: 'ACTIVE'
      });

      // Vehicles & Drivers
      const veh1 = await SupplierVehicle.create({
        organizationId: orgId,
        vehicleNumber: 'WB-19-J-4821',
        transportCompany: 'Apex Dedicated Logistics Fleet',
        capacity: '32 Ton Heavy Tipper',
        status: 'ACTIVE'
      });

      const veh2 = await SupplierVehicle.create({
        organizationId: orgId,
        vehicleNumber: 'WB-24-K-8902',
        transportCompany: 'Apex Dedicated Logistics Fleet',
        capacity: '18 Ton Transit Mixer',
        status: 'ACTIVE'
      });

      const driver1 = await SupplierDriver.create({
        organizationId: orgId,
        name: 'Ram Dayal Singh',
        phone: '9822445566',
        licenseNumber: 'WB-DL-2018-94102',
        status: 'ACTIVE'
      });

      // Active Orders, Deliveries & Invoices
      const order1 = await SupplierOrder.create({
        organizationId: orgId,
        orderNumber: 'SO-2026-0042',
        customer: cust1._id,
        orderDate: new Date(),
        status: 'PROCESSING',
        paymentStatus: 'PARTIAL',
        subTotal: 328000,
        grandTotal: 328000,
        paidAmount: 150000,
        dueAmount: 178000,
        items: [{
          product: prod1._id,
          quantity: 800,
          rate: 410,
          total: 328000
        }]
      });

      await SupplierDelivery.create({
        organizationId: orgId,
        order: order1._id,
        customer: cust1._id,
        challanNumber: 'DC-2026-0891',
        dispatchDate: new Date(),
        vehicleNumber: veh1.vehicleNumber,
        driverName: driver1.name,
        driverPhone: driver1.phone,
        status: 'DISPATCHED',
        deliveryNotes: 'Bridge Pier 14, Newtown Expressway - Delivery to Site In-charge Dinesh',
        recordedBy: userId
      });

      await SupplierInvoice.create({
        organizationId: orgId,
        invoiceNumber: 'INV-2026-0142',
        order: order1._id,
        customer: cust1._id,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subTotal: 328000,
        taxTotal: 59040,
        grandTotal: 387040,
        paidAmount: 150000,
        dueAmount: 237040,
        status: 'PARTIAL',
        items: [{
          product: prod1._id,
          quantity: 800,
          rate: 410,
          taxAmount: 59040,
          total: 387040
        }]
      });

      console.log('✅ Supplier OS: Seeded Products, Customers, Orders, Invoices, Deliveries, Vehicles & Drivers!');
    }

    // =========================================================================
    // 3. CHICKEN DISTRIBUTOR OS (Distributor Demo)
    // =========================================================================
    console.log('\n--- 3. Seeding Chicken Distributor OS (Distributor Demo) ---');
    const distOrg = await Organization.findOne({ name: 'Distributor Demo' });
    const distUser = await User.findOne({ email: 'distributor@example.com' });

    if (distOrg) {
      const orgId = distOrg._id;
      const userId = distUser ? distUser._id : null;

      await ensureEnterpriseSubscription(distOrg, 'CHICKEN_DISTRIBUTOR');

      await DistributorCustomer.deleteMany({ organizationId: orgId });
      await DistributorSupplier.deleteMany({ organizationId: orgId });
      await DistributorStock.deleteMany({ organizationId: orgId });
      await DistributorSale.deleteMany({ organizationId: orgId });
      await DistributorPurchase.deleteMany({ organizationId: orgId });
      await DistributorPayment.deleteMany({ organizationId: orgId });
      await DistributorExpense.deleteMany({ organizationId: orgId });
      await DistributorVehicle.deleteMany({ organizationId: orgId });

      const dveh1 = await DistributorVehicle.create({
        organizationId: orgId,
        registrationNumber: 'WB-19-4821',
        vehicleType: 'Tata Ace Gold (Crate Carrier)',
        capacity: 1200,
        status: 'ACTIVE',
        currentOdometer: 34200
      });

      const dcust1 = await DistributorCustomer.create({
        organizationId: orgId,
        shopName: 'Royal Chicken Corner',
        ownerName: 'Rashid Ali',
        phone: '9830123456',
        currentDue: 18500,
        defaultSellingRate: 135,
        status: 'ACTIVE'
      });

      const dcust2 = await DistributorCustomer.create({
        organizationId: orgId,
        shopName: 'Al-Baik Shawarma & Grill',
        ownerName: 'Mohammad Farooq',
        phone: '9830654321',
        currentDue: 24200,
        defaultSellingRate: 132,
        status: 'ACTIVE'
      });

      const dcust3 = await DistributorCustomer.create({
        organizationId: orgId,
        shopName: 'Metro Fresh Chicken Shop',
        ownerName: 'Sunil Mondal',
        phone: '9831112233',
        currentDue: 12400,
        defaultSellingRate: 130,
        status: 'ACTIVE'
      });

      const dsup1 = await DistributorSupplier.create({
        organizationId: orgId,
        name: 'Suguna Poultry Breeders Depot',
        phone: '9900112233',
        currentPayable: 45000,
        status: 'ACTIVE'
      });

      await DistributorStock.create({
        organizationId: orgId,
        currentStock: 2450,
        lastUpdated: new Date()
      });

      await DistributorPurchase.create({
        organizationId: orgId,
        purchaseNumber: 'PUR-20261010-01',
        purchaseDate: new Date(),
        supplier: dsup1._id,
        birdType: 'BROILER',
        quantity: 850,
        weight: 1500,
        purchaseRate: 98,
        grossAmount: 147000,
        totalAmount: 147000,
        paidAmount: 100000,
        dueAmount: 47000,
        paymentStatus: 'PARTIAL'
      });

      const today = new Date();
      await DistributorSale.create([
        {
          organizationId: orgId,
          saleNumber: 'INV-20261010-01',
          saleDate: today,
          customer: dcust1._id,
          weight: 220,
          sellingRate: 135,
          grossAmount: 29700,
          netAmount: 29700,
          paidAmount: 15000,
          dueAmount: 14700,
          paymentStatus: 'PARTIAL'
        },
        {
          organizationId: orgId,
          saleNumber: 'INV-20261010-02',
          saleDate: today,
          customer: dcust2._id,
          weight: 180,
          sellingRate: 132,
          grossAmount: 23760,
          netAmount: 23760,
          paidAmount: 23760,
          dueAmount: 0,
          paymentStatus: 'PAID'
        },
        {
          organizationId: orgId,
          saleNumber: 'INV-20261010-03',
          saleDate: today,
          customer: dcust3._id,
          weight: 140,
          sellingRate: 130,
          grossAmount: 18200,
          netAmount: 18200,
          paidAmount: 10000,
          dueAmount: 8200,
          paymentStatus: 'PARTIAL'
        }
      ]);

      await DistributorPayment.create([
        {
          organizationId: orgId,
          date: today,
          type: 'CUSTOMER_COLLECTION',
          customer: dcust1._id,
          amount: 15000,
          paymentMethod: 'CASH',
          reference: 'Cash Received Counter 1'
        },
        {
          organizationId: orgId,
          date: today,
          type: 'CUSTOMER_COLLECTION',
          customer: dcust2._id,
          amount: 23760,
          paymentMethod: 'UPI',
          reference: 'UPI/HDFC/6281093821'
        }
      ]);

      await DistributorExpense.create({
        organizationId: orgId,
        date: today,
        category: 'Diesel & Vehicle Operations',
        amount: 3200,
        description: 'Diesel for Tata Ace + site crate unloading',
        paymentMethod: 'UPI',
        status: 'CLEARED'
      });

      console.log('✅ Chicken Distributor OS: Seeded Customers, Suppliers, Live Stock, Sales, Collections & Fleet!');
    }

    // =========================================================================
    // 4. DIAGNOSTICS OS (Diagnostic Demo)
    // =========================================================================
    console.log('\n--- 4. Seeding Diagnostics OS (Diagnostic Demo) ---');
    const diagOrg = await Organization.findOne({ name: 'Diagnostic Demo' });
    const diagUser = await User.findOne({ email: 'diagnostic@example.com' });

    if (diagOrg && diagUser) {
      const orgId = diagOrg._id;
      const userId = diagUser._id;

      await ensureEnterpriseSubscription(diagOrg, 'DIAGNOSTICS');

      await Patient.deleteMany({ organizationId: orgId });
      await Doctor.deleteMany({ organizationId: orgId });
      await Order.deleteMany({ organizationId: orgId });
      await Sample.deleteMany({ organizationId: orgId });
      await Result.deleteMany({ organizationId: orgId });
      await LabPaymentReceipt.deleteMany({ organizationId: orgId });
      await QualityControl.deleteMany({ organizationId: orgId });

      // Doctors
      const doc1 = await Doctor.create({
        organizationId: orgId,
        name: 'Dr. A. K. Banerjee (Consultant Cardiologist)',
        specialization: 'Cardiology',
        clinicName: 'Calcutta Heart & Care Clinic',
        phone: '9830556677',
        commissionRate: 15,
        status: 'active'
      });

      const doc2 = await Doctor.create({
        organizationId: orgId,
        name: 'Dr. S. Mukherjee (MD General Medicine)',
        specialization: 'Internal Medicine',
        clinicName: 'Apollo PolyClinic',
        phone: '9830667788',
        commissionRate: 12,
        status: 'active'
      });

      // Patients
      const p1 = await Patient.create({
        organizationId: orgId,
        patientId: 'PID-2026-0001',
        firstName: 'Subhash',
        lastName: 'Chatterjee',
        age: 58,
        ageUnit: 'Years',
        gender: 'Male',
        phone: '9830119988',
        email: 's.chatterjee@gmail.com',
        bloodGroup: 'B+'
      });

      const p2 = await Patient.create({
        organizationId: orgId,
        patientId: 'PID-2026-0002',
        firstName: 'Priyanka',
        lastName: 'Roy',
        age: 34,
        ageUnit: 'Years',
        gender: 'Female',
        phone: '9830229977',
        email: 'priyanka.roy@yahoo.in',
        bloodGroup: 'O+'
      });

      // Tests
      let test1 = await Test.findOne({ organizationId: orgId, name: /Complete Blood Count/i });
      if (!test1) {
        test1 = await Test.create({
          organizationId: orgId,
          testId: 'TST-0001',
          name: 'Complete Blood Count (CBC with Automated 5-Part Diff)',
          department: 'HEMATOLOGY',
          category: 'Hematology',
          price: 450,
          sampleType: 'Blood',
          containerType: 'EDTA',
          parameters: [
            { name: 'Hemoglobin', unit: 'g/dL', referenceRange: '13.0 - 17.0' },
            { name: 'Total WBC Count', unit: '/cumm', referenceRange: '4,000 - 11,000' },
            { name: 'Platelet Count', unit: 'Lakh/cumm', referenceRange: '1.5 - 4.5' }
          ]
        });
      }

      let test2 = await Test.findOne({ organizationId: orgId, name: /Lipid Profile/i });
      if (!test2) {
        test2 = await Test.create({
          organizationId: orgId,
          testId: 'TST-0002',
          name: 'Lipid Profile Comprehensive',
          department: 'BIOCHEMISTRY',
          category: 'Biochemistry',
          price: 750,
          sampleType: 'Blood',
          containerType: 'SST',
          parameters: [
            { name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '125 - 200' },
            { name: 'Triglycerides', unit: 'mg/dL', referenceRange: '< 150' },
            { name: 'HDL Cholesterol', unit: 'mg/dL', referenceRange: '> 40' }
          ]
        });
      }

      // Orders & Samples
      const o1 = await Order.create({
        organizationId: orgId,
        orderId: 'ORD-2026-00001',
        patient: p1._id,
        referringDoctor: doc1._id,
        tests: [
          { test: test1._id, price: 450, discount: 0, finalPrice: 450 },
          { test: test2._id, price: 750, discount: 0, finalPrice: 750 }
        ],
        subtotal: 1200,
        totalAmount: 1200,
        paidAmount: 1200,
        dueAmount: 0,
        orderStatus: 'Completed',
        paymentStatus: 'Paid',
        paymentMethod: 'UPI'
      });

      const samp1 = await Sample.create({
        organizationId: orgId,
        sampleId: 'SMP-2026-00001',
        order: o1._id,
        patient: p1._id,
        tests: [test1._id],
        barcode: 'SMP-2026-00001',
        sampleType: 'Blood',
        containerType: 'EDTA',
        status: 'Tested'
      });

      // Verified Results
      await Result.create({
        organizationId: orgId,
        order: o1._id,
        test: test1._id,
        patient: p1._id,
        status: 'Verified',
        verifiedBy: userId,
        parameters: [
          { name: 'Hemoglobin', value: '14.2', unit: 'g/dL', referenceRange: '13.0 - 17.0', isAbnormal: false },
          { name: 'Total WBC Count', value: '7,400', unit: '/cumm', referenceRange: '4,000 - 11,000', isAbnormal: false },
          { name: 'Platelet Count', value: '2.4', unit: 'Lakh/cumm', referenceRange: '1.5 - 4.5', isAbnormal: false }
        ]
      });

      // Receipts
      await LabPaymentReceipt.create({
        organizationId: orgId,
        receiptNumber: 'REC-2026-00001',
        order: o1._id,
        patient: p1._id,
        amount: 1200,
        paymentMethod: 'UPI',
        cashierName: 'Frontdesk Cashier'
      });

      // Quality Control Levey-Jennings Logs
      await QualityControl.create([
        {
          organizationId: orgId,
          controlName: 'Bio-Rad Liquichek Whole Blood Level 1',
          analyzerName: 'Sysmex XN-550 Automated Hematology Analyzer',
          department: 'Hematology',
          parameterName: 'Hemoglobin',
          level: 'Level 1 (Normal)',
          lotNumber: 'LOT-XN-8421',
          targetMean: 14.0,
          targetSD: 0.25,
          runs: [
            {
              date: new Date(),
              runNumber: 1,
              observedValue: 14.1,
              zScore: 0.4,
              status: 'IN_CONTROL'
            }
          ]
        },
        {
          organizationId: orgId,
          controlName: 'Roche Precibil Chemistry Normal Control',
          analyzerName: 'Roche Cobas c311 Chemistry Analyzer',
          department: 'Biochemistry',
          parameterName: 'Total Cholesterol',
          level: 'Level 1 (Normal)',
          lotNumber: 'LOT-RC-3110',
          targetMean: 200.0,
          targetSD: 4.2,
          runs: [
            {
              date: new Date(),
              runNumber: 1,
              observedValue: 198.4,
              zScore: -0.38,
              status: 'IN_CONTROL'
            }
          ]
        }
      ]);

      console.log('✅ Diagnostics OS: Seeded Patients, Doctors, Orders, Barcoded Samples, Verified Lab Results & QC Logs!');
    }

    // =========================================================================
    // 5. RESTAURANT OS (Restaurant Demo)
    // =========================================================================
    console.log('\n--- 5. Seeding Restaurant OS (Restaurant Demo) ---');
    let restOrg = await Organization.findOne({ email: 'restaurant@example.com' });
    let restUser = await User.findOne({ email: 'restaurant@example.com' });

    if (!restOrg) {
      restOrg = await Organization.create({
        name: 'Restaurant Demo',
        email: 'restaurant@example.com',
        businessType: 'RESTAURANT',
        status: 'active',
        ownerName: 'Chef & Owner',
        address: '14 Park Street, Kolkata, West Bengal'
      });
    }

    if (!restUser) {
      restUser = await User.create({
        organizationId: restOrg._id,
        name: 'Restaurant Manager',
        email: 'restaurant@example.com',
        passwordHash: '123456',
        role: 'ADMIN',
        status: 'active'
      });
    }

    if (restOrg && restUser) {
      const orgId = restOrg._id;
      const userId = restUser._id;

      await ensureEnterpriseSubscription(restOrg, 'RESTAURANT');

      await RestaurantArea.deleteMany({ organizationId: orgId });
      await RestaurantTable.deleteMany({ organizationId: orgId });
      await RestaurantMenuCategory.deleteMany({ organizationId: orgId });
      await RestaurantMenuItem.deleteMany({ organizationId: orgId });
      await RestaurantOrder.deleteMany({ organizationId: orgId });
      await RestaurantBill.deleteMany({ organizationId: orgId });
      await RestaurantShift.deleteMany({ organizationId: orgId });

      // Areas
      const a1 = await RestaurantArea.create({ organizationId: orgId, name: 'Main Dining Hall', displayOrder: 1 });
      const a2 = await RestaurantArea.create({ organizationId: orgId, name: 'Outdoor Patio', displayOrder: 2 });
      const a3 = await RestaurantArea.create({ organizationId: orgId, name: 'AC Family Lounge', displayOrder: 3 });

      // Categories
      const cStarters = await RestaurantMenuCategory.create({ organizationId: orgId, name: 'Starters & Tandoor', defaultStation: 'Tandoor', displayOrder: 1 });
      const cMains = await RestaurantMenuCategory.create({ organizationId: orgId, name: 'Main Course', defaultStation: 'Curry Range', displayOrder: 2 });
      const cBreads = await RestaurantMenuCategory.create({ organizationId: orgId, name: 'Breads & Rice', defaultStation: 'Tandoor', displayOrder: 3 });
      const cBeverages = await RestaurantMenuCategory.create({ organizationId: orgId, name: 'Beverages', defaultStation: 'Beverage Bar', displayOrder: 4 });
      const cDesserts = await RestaurantMenuCategory.create({ organizationId: orgId, name: 'Desserts', defaultStation: 'Dessert', displayOrder: 5 });

      // Menu Items
      await RestaurantMenuItem.create([
        { organizationId: orgId, categoryId: cStarters._id, name: 'Paneer Tikka Angara', code: 'APP-01', price: 280, veg: true, dietaryType: 'VEG', station: 'Tandoor' },
        { organizationId: orgId, categoryId: cStarters._id, name: 'Chicken Malai Tikka', code: 'APP-02', price: 340, veg: false, dietaryType: 'NON_VEG', station: 'Tandoor' },
        { organizationId: orgId, categoryId: cStarters._id, name: 'Crispy Corn Salt & Pepper', code: 'APP-03', price: 220, veg: true, dietaryType: 'VEG', station: 'Pantry' },
        { organizationId: orgId, categoryId: cMains._id, name: 'Butter Chicken Masala', code: 'MAIN-01', price: 380, veg: false, dietaryType: 'NON_VEG', station: 'Curry Range' },
        { organizationId: orgId, categoryId: cMains._id, name: 'Dal Makhani Royal', code: 'MAIN-02', price: 290, veg: true, dietaryType: 'VEG', station: 'Curry Range' },
        { organizationId: orgId, categoryId: cMains._id, name: 'Paneer Butter Masala', code: 'MAIN-03', price: 320, veg: true, dietaryType: 'VEG', station: 'Curry Range' },
        { organizationId: orgId, categoryId: cMains._id, name: 'Mutton Rogan Josh', code: 'MAIN-04', price: 460, veg: false, dietaryType: 'NON_VEG', station: 'Curry Range' },
        { organizationId: orgId, categoryId: cBreads._id, name: 'Butter Garlic Naan', code: 'BRD-01', price: 65, veg: true, dietaryType: 'VEG', station: 'Tandoor' },
        { organizationId: orgId, categoryId: cBreads._id, name: 'Tandoori Roti Butter', code: 'BRD-02', price: 35, veg: true, dietaryType: 'VEG', station: 'Tandoor' },
        { organizationId: orgId, categoryId: cBreads._id, name: 'Chicken Dum Biryani (Pot)', code: 'BRD-03', price: 360, veg: false, dietaryType: 'NON_VEG', station: 'Curry Range' },
        { organizationId: orgId, categoryId: cBreads._id, name: 'Steamed Basmati Rice', code: 'BRD-04', price: 160, veg: true, dietaryType: 'VEG', station: 'Curry Range' },
        { organizationId: orgId, categoryId: cBeverages._id, name: 'Virgin Mint Mojito', code: 'BEV-01', price: 140, veg: true, dietaryType: 'VEG', station: 'Beverage Bar' },
        { organizationId: orgId, categoryId: cBeverages._id, name: 'Cold Coffee with Ice Cream', code: 'BEV-02', price: 160, veg: true, dietaryType: 'VEG', station: 'Beverage Bar' },
        { organizationId: orgId, categoryId: cBeverages._id, name: 'Sweet Punjabi Lassi', code: 'BEV-03', price: 110, veg: true, dietaryType: 'VEG', station: 'Beverage Bar' },
        { organizationId: orgId, categoryId: cDesserts._id, name: 'Gulab Jamun with Rabri', code: 'DES-01', price: 130, veg: true, dietaryType: 'VEG', station: 'Dessert' },
        { organizationId: orgId, categoryId: cDesserts._id, name: 'Sizzling Brownie with Ice Cream', code: 'DES-02', price: 190, veg: true, dietaryType: 'VEG', station: 'Dessert' },
        { organizationId: orgId, categoryId: cStarters._id, name: 'Fish Amritsari Fry', code: 'APP-04', price: 390, veg: false, dietaryType: 'NON_VEG', station: 'Hot Fryer', is86ed: true }
      ]);

      // Tables
      await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-01', capacity: 2, status: 'AVAILABLE', displayOrder: 1 });
      await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-02', capacity: 4, status: 'AVAILABLE', displayOrder: 2 });
      await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-03', capacity: 4, status: 'AVAILABLE', displayOrder: 3 });
      const t4 = await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-04', capacity: 4, status: 'OCCUPIED', displayOrder: 4, currentGuests: 3, assignedSteward: 'Rahul S.' });
      await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-05', capacity: 6, status: 'AVAILABLE', displayOrder: 5 });
      await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-06', capacity: 6, status: 'AVAILABLE', displayOrder: 6 });
      await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-07', capacity: 2, status: 'AVAILABLE', displayOrder: 7 });
      const t8 = await RestaurantTable.create({ organizationId: orgId, areaId: a1._id, tableNumber: 'T-08', capacity: 4, status: 'BILLED', displayOrder: 8, currentGuests: 2, assignedSteward: 'Deepak V.' });
      await RestaurantTable.create({ organizationId: orgId, areaId: a2._id, tableNumber: 'T-09 (Patio)', capacity: 4, status: 'AVAILABLE', displayOrder: 9 });
      await RestaurantTable.create({ organizationId: orgId, areaId: a2._id, tableNumber: 'T-10 (Patio)', capacity: 4, status: 'AVAILABLE', displayOrder: 10 });
      const t11 = await RestaurantTable.create({ organizationId: orgId, areaId: a2._id, tableNumber: 'T-11 (Patio)', capacity: 6, status: 'OCCUPIED', displayOrder: 11, currentGuests: 4, assignedSteward: 'Amit K.' });
      await RestaurantTable.create({ organizationId: orgId, areaId: a3._id, tableNumber: 'T-12 (Lounge)', capacity: 8, status: 'AVAILABLE', displayOrder: 12 });

      // Orders
      const ord1 = await RestaurantOrder.create({
        organizationId: orgId,
        orderNumber: 'ORD-9042',
        orderType: 'DINE_IN',
        tableId: t4._id,
        tableName: 'Table 04',
        guestCount: 3,
        stewardId: userId,
        stewardName: 'Rahul S.',
        status: 'PREPARING',
        paymentStatus: 'PAID',
        subTotal: 655,
        serviceCharge: 33,
        taxTotal: 33,
        grandTotal: 721,
        items: [
          { name: 'Butter Chicken Masala', price: 380, quantity: 1, station: 'Curry Range', notes: 'Medium spicy, extra butter', veg: false, status: 'PREPARING', ready: false },
          { name: 'Butter Garlic Naan', price: 65, quantity: 3, station: 'Tandoor', notes: 'Crispy well-done', veg: true, status: 'PREPARING', ready: false },
          { name: 'Sweet Punjabi Lassi', price: 110, quantity: 2, station: 'Beverage Bar', notes: 'Chilled', veg: true, status: 'READY', ready: true }
        ],
        createdBy: userId
      });
      t4.activeOrderId = ord1._id;
      await t4.save();

      await RestaurantOrder.create({
        organizationId: orgId,
        orderNumber: 'ORD-9041',
        orderType: 'TAKEAWAY',
        tokenNumber: 'Token #28',
        guestCount: 1,
        stewardName: 'Counter 1',
        status: 'PREPARING',
        paymentStatus: 'PAID',
        subTotal: 380,
        serviceCharge: 0,
        taxTotal: 19,
        grandTotal: 399,
        items: [
          { name: 'Paneer Tikka Angara', price: 280, quantity: 1, station: 'Tandoor', notes: 'Mint chutney extra', veg: true, status: 'PREPARING', ready: false },
          { name: 'Cold Coffee with Ice Cream', price: 160, quantity: 1, station: 'Beverage Bar', notes: '', veg: true, status: 'READY', ready: true }
        ],
        createdBy: userId
      });

      const ord3 = await RestaurantOrder.create({
        organizationId: orgId,
        orderNumber: 'ORD-9040',
        orderType: 'DINE_IN',
        tableId: t11._id,
        tableName: 'T-11 (Patio)',
        guestCount: 4,
        stewardId: userId,
        stewardName: 'Amit K.',
        status: 'PREPARING',
        paymentStatus: 'PENDING',
        subTotal: 760,
        serviceCharge: 38,
        taxTotal: 38,
        grandTotal: 836,
        items: [
          { name: 'Mutton Rogan Josh', price: 460, quantity: 1, station: 'Curry Range', notes: 'Boneless cuts', veg: false, status: 'PREPARING', ready: false },
          { name: 'Steamed Basmati Rice', price: 160, quantity: 2, station: 'Curry Range', notes: '', veg: true, status: 'READY', ready: true }
        ],
        createdBy: userId
      });
      t11.activeOrderId = ord3._id;
      await t11.save();

      await RestaurantOrder.create({
        organizationId: orgId,
        orderNumber: 'ORD-9039',
        orderType: 'DELIVERY',
        customerName: 'Sanjay Verma',
        customerPhone: '9830129988',
        deliveryAddress: 'Flat 4B, Silver Heights, Park Street',
        stewardName: 'Dispatch',
        status: 'READY',
        paymentStatus: 'PAID',
        subTotal: 490,
        serviceCharge: 0,
        taxTotal: 25,
        grandTotal: 515,
        items: [
          { name: 'Chicken Dum Biryani (Pot)', price: 360, quantity: 1, station: 'Curry Range', notes: 'Extra salan pouch', veg: false, status: 'READY', ready: true },
          { name: 'Gulab Jamun with Rabri', price: 130, quantity: 1, station: 'Dessert', notes: 'Warm', veg: true, status: 'READY', ready: true }
        ],
        createdBy: userId
      });

      const ord5 = await RestaurantOrder.create({
        organizationId: orgId,
        orderNumber: 'ORD-9038',
        orderType: 'DINE_IN',
        tableId: t8._id,
        tableName: 'T-08',
        guestCount: 2,
        stewardId: userId,
        stewardName: 'Deepak V.',
        status: 'SERVED',
        paymentStatus: 'PAID',
        subTotal: 540,
        serviceCharge: 27,
        taxTotal: 27,
        grandTotal: 594,
        items: [
          { name: 'Paneer Butter Masala', price: 320, quantity: 1, station: 'Curry Range', notes: '', veg: true, status: 'SERVED', ready: true },
          { name: 'Crispy Corn Salt & Pepper', price: 220, quantity: 1, station: 'Pantry', notes: 'Extra spicy', veg: true, status: 'SERVED', ready: true }
        ],
        createdBy: userId
      });
      t8.activeOrderId = ord5._id;
      await t8.save();

      // Register shift
      await RestaurantShift.create({
        organizationId: orgId,
        cashierId: userId,
        cashierName: restUser.name,
        registerNumber: 'Register #1',
        openedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        openingFloat: 5000,
        cashSales: 9200,
        expectedCash: 14200,
        status: 'OPEN'
      });

      console.log('✅ Restaurant OS: Seeded Areas, Tables, Categories, Menu Items, Active Orders, KDS Tickets & Register Shift!');
    }

    console.log('\n🎉 ALL 5 OS VERTICALS FULLY SEEDED WITH ENTERPRISE OPERATIONAL DEMO DATA!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during master seeding:', error);
    process.exit(1);
  }
}

seedAll();
