import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import Organization from '../models/Organization.js';
import User from '../models/User.js';
import OSProduct from '../models/OSProduct.js';
import OSPlan from '../models/OSPlan.js';
import Subscription from '../models/Subscription.js';
import PharmacyMedicine from '../models/PharmacyMedicine.js';
import PharmacyBatch from '../models/PharmacyBatch.js';
import PharmacySupplier from '../models/PharmacySupplier.js';
import PharmacyPurchaseOrder from '../models/PharmacyPurchaseOrder.js';
import PharmacyGRN from '../models/PharmacyGRN.js';
import PharmacySale from '../models/PharmacySale.js';
import PharmacyReturn from '../models/PharmacyReturn.js';
import PharmacyCustomer from '../models/PharmacyCustomer.js';
import PharmacyDebitNote from '../models/PharmacyDebitNote.js';
import PharmacyDisposalLog from '../models/PharmacyDisposalLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI;

// Helper to calculate expiry date object from MM/YYYY or YYYY-MM
function parseExpiryToDate(expStr) {
  if (!expStr) return new Date();
  if (expStr.includes('/')) {
    const parts = expStr.split('/');
    if (parts.length === 2) {
      const month = parseInt(parts[0], 10);
      const year = parseInt(parts[1], 10);
      return new Date(year, month, 0, 23, 59, 59, 999);
    }
  }
  if (expStr.includes('-')) {
    const parts = expStr.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parts.length === 3 ? parseInt(parts[2], 10) : 0;
      return day > 0 ? new Date(year, month - 1, day, 23, 59, 59) : new Date(year, month, 0, 23, 59, 59);
    }
  }
  const parsed = new Date(expStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function seedPharmacyDemo() {
  console.log('Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 3000 });
    console.log('✓ Connected to MongoDB Atlas');
  } catch (err) {
    console.warn('[WARN] Atlas unreachable. Connecting to local MongoDB on port 27017...');
    await mongoose.connect('mongodb://127.0.0.1:27017/apexbuild_platform?retryWrites=false');
    console.log('✓ Connected to local MongoDB on 127.0.0.1:27017');
  }

  // 1. Create or Find OSProduct for Pharmacy OS
  let product = await OSProduct.findOne({ businessType: 'PHARMACY' });
  if (!product) {
    product = await OSProduct.create({
      name: 'ApexBuild Pharmacy OS',
      slug: 'pharmacy-os',
      businessType: 'PHARMACY',
      tagline: 'FEFO Inventory, Drug Schedule Compliance & High-Speed Retail POS',
      status: 'production',
      description: 'Full-stack retail pharmacy operating system complying with Drugs & Cosmetics Act 1940 and GST statutory rules.'
    });
    console.log('✓ Created OSProduct: ApexBuild Pharmacy OS');
  } else {
    console.log('✓ Found OSProduct: ApexBuild Pharmacy OS');
  }

  // 2. Create or Find Enterprise Plan
  let plan = await OSPlan.findOne({ osProductId: product._id, tier: 'ENTERPRISE' });
  if (!plan) {
    plan = await OSPlan.create({
      name: 'Pharmacy OS Enterprise',
      tier: 'ENTERPRISE',
      osProductId: product._id,
      monthlyPrice: 4999,
      yearlyPrice: 49999,
      isActive: true,
      featureEntitlements: {
        formularyMaster: true,
        batchFEFOInventory: true,
        scheduleRegisters: true,
        counterPOSBilling: true,
        distributorGRN: true,
        expiryTriage: true,
        patientChronicKhata: true,
        coldChainLogger: true,
        gstNarcoticsAudit: true,
        multiCounterPOS: true,
        barcodeScanning: true
      }
    });
    console.log('✓ Created Enterprise Plan for Pharmacy OS');
  } else {
    console.log('✓ Found Enterprise Plan for Pharmacy OS');
  }

  // 3. Create or Find Demo Organization
  const orgEmail = 'pharmacy@apexbuild.com';
  let org = await Organization.findOne({ email: orgEmail });
  if (!org) {
    org = await Organization.create({
      name: 'ApexCare Retail Pharmacy & Chemists',
      legalName: 'ApexCare Pharmaceuticals Pvt Ltd',
      email: orgEmail,
      phone: '+91 98300 12345',
      businessType: 'PHARMACY',
      status: 'active',
      ownerName: 'Rahul Roy',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700001',
      gstNumber: '19AABCA1234F1Z5',
      settings: {
        drugLicenceNumber: 'Form 20B/21B-WB-19284',
        registeredPharmacist: 'Rahul Roy (WB-48291)',
        posPrinterType: 'THERMAL_80MM',
        defaultGstRate: 12
      }
    });
    console.log('✓ Created Demo Organization: ApexCare Retail Pharmacy & Chemists');
  } else {
    org.status = 'active';
    org.businessType = 'PHARMACY';
    await org.save();
    console.log('✓ Found Demo Organization:', org.name);
  }

  // 4. Create or Update Active Subscription
  let sub = await Subscription.findOne({ organizationId: org._id });
  if (!sub) {
    sub = await Subscription.create({
      organizationId: org._id,
      osProductId: product._id,
      osPlanId: plan._id,
      status: 'ACTIVE',
      billingCycle: 'yearly',
      basePrice: 49999,
      finalAmount: 49999,
      startDate: new Date(),
      nextBillingDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    });
    console.log('✓ Created Active Yearly Subscription');
  } else {
    sub.status = 'ACTIVE';
    sub.osProductId = product._id;
    sub.osPlanId = plan._id;
    await sub.save();
    console.log('✓ Activated Enterprise Subscription');
  }

  // 5. Create or Update Pharmacist User
  let user = await User.findOne({ email: orgEmail });
  if (!user) {
    user = new User({
      organizationId: org._id,
      name: 'Rahul Roy (Registered Pharmacist)',
      email: orgEmail,
      phone: '+91 98300 12345',
      role: 'OWNER',
      status: 'active',
      licenseNumber: 'WBMC-48291',
      passwordHash: 'password123'
    });
    await user.save();
    console.log('✓ Created Demo Pharmacist User: pharmacy@apexbuild.com / password123');
  } else {
    user.role = 'OWNER';
    user.status = 'active';
    user.organizationId = org._id;
    user.passwordHash = 'password123';
    await user.save();
    console.log('✓ Updated Demo Pharmacist User: pharmacy@apexbuild.com / password123');
  }

  // 6. Seed Medicines & Batches if empty
  const medCount = await PharmacyMedicine.countDocuments({ organizationId: org._id });
  if (medCount === 0) {
    console.log('Seeding initial medicines catalogue and FEFO batches...');
    
    // Suppliers
    const supplier1 = await PharmacySupplier.create({
      organizationId: org._id,
      name: 'Bengal Drug House (C&F Distributor)',
      dlNumber: 'Form 20B/21B-WB-4819',
      gstin: '19AABCB1234F1Z1',
      contactPerson: 'Amitabh Sen',
      phone: '9830112233',
      email: 'orders@bengaldrug.com',
      paymentTerms: 'NET_21'
    });

    const supplier2 = await PharmacySupplier.create({
      organizationId: org._id,
      name: 'Eastern Pharma Depot',
      dlNumber: 'Form 20B/21B-WB-7712',
      gstin: '19AACCE5678H1Z8',
      contactPerson: 'Priya Dhar',
      phone: '9831998877',
      email: 'priya@easternpharma.in',
      paymentTerms: 'NET_30'
    });

    // Formulations
    const seedFormulations = [
      {
        brandName: 'Augmentin 625 Duo',
        genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
        dosageForm: 'Tablet',
        strength: '625mg',
        packSize: '10 Tablets / Strip',
        manufacturer: 'GlaxoSmithKline',
        scheduleCategory: 'SCHEDULE_H',
        hsnCode: '30041010',
        gstRate: 12,
        reorderLevel: 25,
        rackLocation: 'Rack A-02',
        batches: [
          { batchNumber: 'AUG24018', expiryDate: '11/2026', purchasePrice: 162.00, mrp: 204.50, sellingPrice: 204.50, quantityOnHand: 42 },
          { batchNumber: 'AUG24089', expiryDate: '04/2027', purchasePrice: 162.00, mrp: 204.50, sellingPrice: 204.50, quantityOnHand: 120 }
        ]
      },
      {
        brandName: 'Telma 40 Tablets',
        genericName: 'Telmisartan 40mg',
        dosageForm: 'Tablet',
        strength: '40mg',
        packSize: '15 Tablets / Strip',
        manufacturer: 'Glenmark Pharmaceuticals',
        scheduleCategory: 'SCHEDULE_H',
        isChronic: true,
        hsnCode: '30049099',
        gstRate: 12,
        reorderLevel: 30,
        rackLocation: 'Rack B-04',
        batches: [
          { batchNumber: 'TLM2409', expiryDate: '12/2026', purchasePrice: 110.00, mrp: 142.00, sellingPrice: 142.00, quantityOnHand: 60 }
        ]
      },
      {
        brandName: 'Pan 40 Tablet',
        genericName: 'Pantoprazole 40mg',
        dosageForm: 'Tablet',
        strength: '40mg',
        packSize: '15 Tablets / Strip',
        manufacturer: 'Alkem Laboratories',
        scheduleCategory: 'SCHEDULE_H',
        hsnCode: '30049099',
        gstRate: 12,
        reorderLevel: 40,
        rackLocation: 'Rack B-01',
        batches: [
          { batchNumber: 'PAN2477', expiryDate: '08/2027', purchasePrice: 120.00, mrp: 155.00, sellingPrice: 155.00, quantityOnHand: 180 }
        ]
      },
      {
        brandName: 'Azithral 500 Tablet',
        genericName: 'Azithromycin 500mg',
        dosageForm: 'Tablet',
        strength: '500mg',
        packSize: '5 Tablets / Strip',
        manufacturer: 'Alembic Pharmaceuticals',
        scheduleCategory: 'SCHEDULE_H1',
        hsnCode: '30042099',
        gstRate: 12,
        reorderLevel: 20,
        rackLocation: 'Rack A-05',
        batches: [
          { batchNumber: 'AZI2411', expiryDate: '02/2027', purchasePrice: 92.00, mrp: 121.50, sellingPrice: 121.50, quantityOnHand: 55 }
        ]
      },
      {
        brandName: 'Crocin 650 Advance',
        genericName: 'Paracetamol 650mg Fast Release',
        dosageForm: 'Tablet',
        strength: '650mg',
        packSize: '15 Tablets / Strip',
        manufacturer: 'GlaxoSmithKline',
        scheduleCategory: 'OTC',
        hsnCode: '30049060',
        gstRate: 12,
        reorderLevel: 50,
        rackLocation: 'Rack OTC-01',
        batches: [
          { batchNumber: 'CRO2490', expiryDate: '10/2027', purchasePrice: 24.50, mrp: 32.00, sellingPrice: 32.00, quantityOnHand: 300 }
        ]
      },
      {
        brandName: 'Pantocid DSR Capsule',
        genericName: 'Pantoprazole (40mg) + Domperidone (30mg)',
        dosageForm: 'Capsule',
        strength: '40mg/30mg',
        packSize: '10 Capsules / Strip',
        manufacturer: 'Sun Pharma',
        scheduleCategory: 'SCHEDULE_H',
        hsnCode: '30049099',
        gstRate: 12,
        reorderLevel: 20,
        rackLocation: 'Quarantine Bin Q-1',
        batches: [
          // Near-expiry / Expired demo batch to demonstrate statutory quarantine
          { batchNumber: 'PNT2391', expiryDate: '10/2026', purchasePrice: 152.00, mrp: 195.00, sellingPrice: 195.00, quantityOnHand: 0, quarantineQuantity: 15, status: 'QUARANTINED' }
        ]
      },
      {
        brandName: 'Human Mixtard 30/70 100IU',
        genericName: 'Biphasic Isophane Insulin Injection IP',
        dosageForm: 'Injection',
        strength: '100 IU/ml (10ml)',
        packSize: '10ml Vial',
        manufacturer: 'Novo Nordisk',
        scheduleCategory: 'SCHEDULE_H',
        storageCondition: 'COLD_CHAIN_2_8',
        isColdChain: true,
        isChronic: true,
        hsnCode: '30043110',
        gstRate: 5,
        reorderLevel: 10,
        rackLocation: 'Refrigerator #1 (Shelf B)',
        batches: [
          { batchNumber: 'MIX2489', expiryDate: '09/2027', purchasePrice: 145.00, mrp: 185.00, sellingPrice: 185.00, quantityOnHand: 25 }
        ]
      }
    ];

    for (const f of seedFormulations) {
      const batches = f.batches;
      delete f.batches;

      const med = await PharmacyMedicine.create({
        ...f,
        organizationId: org._id
      });

      for (const b of batches) {
        const expObj = parseExpiryToDate(b.expiryDate);
        await PharmacyBatch.create({
          organizationId: org._id,
          medicineId: med._id,
          supplierId: supplier1._id,
          batchNumber: b.batchNumber,
          expiryDate: b.expiryDate,
          expiryDateObj: expObj,
          purchasePrice: b.purchasePrice,
          mrp: b.mrp,
          sellingPrice: b.sellingPrice,
          quantityOnHand: b.quantityOnHand,
          quarantineQuantity: b.quarantineQuantity || 0,
          status: b.status || (expObj < new Date() ? 'EXPIRED' : 'SALEABLE'),
          rackLocation: med.rackLocation
        });
      }
    }
    console.log(`✓ Seeded ${seedFormulations.length} Master Formulations with active FEFO batches & cold chain items.`);
  } else {
    console.log(`✓ Formulations catalogue already populated (${medCount} medicines present).`);
  }

  // 7. Seed Sample Purchase Order and GRN if empty
  const poCount = await PharmacyPurchaseOrder.countDocuments({ organizationId: org._id });
  if (poCount === 0) {
    const supplier1 = await PharmacySupplier.findOne({ organizationId: org._id, name: /Bengal Drug/i }) || await PharmacySupplier.findOne({ organizationId: org._id });
    const augmentin = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Augmentin/i });
    const crocin = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Crocin/i });
    const telma = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Telma/i });

    if (supplier1 && augmentin && crocin && telma) {
      const po = await PharmacyPurchaseOrder.create({
        organizationId: org._id,
        poNumber: 'PO-2026-0001',
        supplierId: supplier1._id,
        orderDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        expectedDeliveryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        status: 'PARTIALLY_RECEIVED',
        items: [
          {
            medicineId: augmentin._id,
            packSize: augmentin.packSize,
            orderQuantity: 50,
            receivedQuantity: 42,
            estimatedPurchasePrice: 162.00,
            estimatedAmount: 8100.00
          },
          {
            medicineId: crocin._id,
            packSize: crocin.packSize,
            orderQuantity: 100,
            receivedQuantity: 0,
            estimatedPurchasePrice: 24.50,
            estimatedAmount: 2450.00
          },
          {
            medicineId: telma._id,
            packSize: telma.packSize,
            orderQuantity: 40,
            receivedQuantity: 0,
            estimatedPurchasePrice: 110.00,
            estimatedAmount: 4400.00
          }
        ],
        totalEstimatedAmount: 14950.00,
        notes: 'Monthly fast-moving replenishment order via Net 21 terms',
        createdById: user._id
      });

      // Find the Augmentin batch AUG24018
      const augBatch = await PharmacyBatch.findOne({ organizationId: org._id, batchNumber: 'AUG24018' });

      const grn = await PharmacyGRN.create({
        organizationId: org._id,
        grnNumber: 'GRN-2026-0001',
        poId: po._id,
        supplierId: supplier1._id,
        supplierInvoiceNumber: 'INV-BDH-88219',
        supplierInvoiceDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        receivedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        paymentTerms: 'NET_21',
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        status: 'VERIFIED_AND_INWARDED',
        items: [
          {
            medicineId: augmentin._id,
            batchNumber: 'AUG24018',
            mfgDate: '03/2024',
            expiryDate: '11/2026',
            expiryDateObj: parseExpiryToDate('11/2026'),
            quantityReceived: 42,
            freeQuantity: 0,
            purchasePrice: 162.00,
            tradeDiscountPercent: 0,
            gstRate: 12,
            mrp: 204.50,
            sellingPrice: 204.50,
            rackLocation: 'Rack A-02',
            totalCost: 6804.00,
            gstAmount: 816.48,
            netAmount: 7620.48,
            createdBatchId: augBatch ? augBatch._id : undefined
          }
        ],
        subtotal: 6804.00,
        discountTotal: 0,
        taxTotal: 816.48,
        grandTotal: 7620.48,
        paymentStatus: 'PARTIALLY_PAID',
        paidAmount: 4000.00,
        verifiedByPharmacistId: user._id,
        pharmacistNotes: 'Verified physical seal and cold storage intact upon delivery.'
      });

      po.grnIds = [grn._id];
      await po.save();

      if (augBatch) {
        augBatch.grnId = grn._id;
        await augBatch.save();
      }

      console.log('✓ Seeded Demo PO-2026-0001 and GRN-2026-0001 with traceable batch inward.');
    }
  }

  // 8. Seed Sample Sales & Statutory Schedule Register if empty
  const salesCount = await PharmacySale.countDocuments({ organizationId: org._id });
  if (salesCount === 0) {
    const augmentin = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Augmentin/i });
    const crocin = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Crocin/i });
    const azithral = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Azithral/i });

    const augBatch = await PharmacyBatch.findOne({ organizationId: org._id, batchNumber: 'AUG24018' });
    const croBatch = await PharmacyBatch.findOne({ organizationId: org._id, batchNumber: 'CRO2490' });
    const aziBatch = await PharmacyBatch.findOne({ organizationId: org._id, batchNumber: 'AZI2411' });

    if (augmentin && augBatch && crocin && croBatch && azithral && aziBatch) {
      // 1. Schedule H Prescription Sale
      const sale1 = await PharmacySale.create({
        organizationId: org._id,
        billNumber: 'RX-2026-0001',
        saleDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        customer: {
          name: 'Suresh Ganguly',
          phone: '9830012345',
          age: 48,
          gender: 'MALE',
          address: 'Block B, Lake Gardens, Kolkata'
        },
        doctor: {
          name: 'Dr. A. K. Banerjee (MD)',
          registrationNumber: 'WBMC-38291',
          hospitalClinic: 'Apollo Clinic, South Kolkata',
          prescriptionDate: new Date()
        },
        rxVerified: true,
        items: [
          {
            medicineId: augmentin._id,
            batchId: augBatch._id,
            brandName: augmentin.brandName,
            genericName: augmentin.genericName,
            batchNumber: augBatch.batchNumber,
            expiryDate: augBatch.expiryDate,
            quantity: 2,
            unitPrice: 204.50,
            discountPercent: 10,
            discountAmount: 40.90,
            taxableAmount: 368.10,
            gstRate: 12,
            gstAmount: 44.17,
            totalAmount: 412.27,
            scheduleCategory: 'SCHEDULE_H',
            rackLocation: augBatch.rackLocation
          }
        ],
        pricing: {
          subtotal: 409.00,
          discountTotal: 40.90,
          taxTotal: 44.17,
          roundOff: -0.27,
          grandTotal: 412.00
        },
        payment: {
          method: 'UPI',
          status: 'PAID',
          amountReceived: 412.00,
          referenceNumber: 'UPI/294819283011'
        },
        highestSchedule: 'SCHEDULE_H',
        isSchedulePrescription: true,
        pharmacistId: user._id,
        pharmacistName: 'Rahul Roy (WB-48291)',
        status: 'COMPLETED'
      });

      // 2. Schedule H1 Antibiotic Prescription Sale
      const sale2 = await PharmacySale.create({
        organizationId: org._id,
        billNumber: 'RX-2026-0002',
        saleDate: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        customer: {
          name: 'Subir Chakraborty',
          phone: '9831122334',
          age: 52,
          gender: 'MALE',
          address: 'Salt Lake Sector 1, Kolkata'
        },
        doctor: {
          name: 'Dr. R. Sengupta (MBBS, DTM&H)',
          registrationNumber: 'WBMC-49102',
          hospitalClinic: 'AMRI Hospital, Dhakuria',
          prescriptionDate: new Date()
        },
        rxVerified: true,
        items: [
          {
            medicineId: azithral._id,
            batchId: aziBatch._id,
            brandName: azithral.brandName,
            genericName: azithral.genericName,
            batchNumber: aziBatch.batchNumber,
            expiryDate: aziBatch.expiryDate,
            quantity: 2,
            unitPrice: 121.50,
            discountPercent: 5,
            discountAmount: 12.15,
            taxableAmount: 230.85,
            gstRate: 12,
            gstAmount: 27.70,
            totalAmount: 258.55,
            scheduleCategory: 'SCHEDULE_H1',
            rackLocation: aziBatch.rackLocation
          }
        ],
        pricing: {
          subtotal: 243.00,
          discountTotal: 12.15,
          taxTotal: 27.70,
          roundOff: 0.45,
          grandTotal: 259.00
        },
        payment: {
          method: 'CARD',
          status: 'PAID',
          amountReceived: 259.00,
          referenceNumber: 'TXN-HDFC-99120'
        },
        highestSchedule: 'SCHEDULE_H1',
        isSchedulePrescription: true,
        pharmacistId: user._id,
        pharmacistName: 'Rahul Roy (WB-48291)',
        status: 'COMPLETED'
      });

      // 3. OTC Cash Sale
      const sale3 = await PharmacySale.create({
        organizationId: org._id,
        billNumber: 'RX-2026-0003',
        saleDate: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
        customer: {
          name: 'Mita Debnath',
          phone: '9836677889',
          gender: 'FEMALE'
        },
        doctor: {
          name: 'Walk-in OTC'
        },
        rxVerified: true,
        items: [
          {
            medicineId: crocin._id,
            batchId: croBatch._id,
            brandName: crocin.brandName,
            genericName: crocin.genericName,
            batchNumber: croBatch.batchNumber,
            expiryDate: croBatch.expiryDate,
            quantity: 2,
            unitPrice: 32.00,
            discountPercent: 0,
            discountAmount: 0,
            taxableAmount: 57.14,
            gstRate: 12,
            gstAmount: 6.86,
            totalAmount: 64.00,
            scheduleCategory: 'OTC',
            rackLocation: croBatch.rackLocation
          }
        ],
        pricing: {
          subtotal: 64.00,
          discountTotal: 0,
          taxTotal: 6.86,
          roundOff: 0,
          grandTotal: 64.00
        },
        payment: {
          method: 'CASH',
          status: 'PAID',
          amountReceived: 100.00,
          changeReturned: 36.00
        },
        highestSchedule: 'OTC',
        isSchedulePrescription: false,
        pharmacistId: user._id,
        pharmacistName: 'Rahul Roy (WB-48291)',
        status: 'PARTIALLY_RETURNED'
      });

      // 4. Sample Customer Return
      await PharmacyReturn.create({
        organizationId: org._id,
        returnNumber: 'RET-2026-0001',
        originalSaleId: sale3._id,
        originalBillNumber: sale3.billNumber,
        returnDate: new Date(),
        customer: sale3.customer,
        items: [
          {
            medicineId: crocin._id,
            batchId: croBatch._id,
            brandName: crocin.brandName,
            batchNumber: croBatch.batchNumber,
            quantityReturned: 1,
            unitRefundPrice: 32.00,
            refundAmount: 32.00,
            action: 'RETURN_TO_SHELF',
            reason: 'PATIENT_RECOVERY_EXCESS'
          }
        ],
        totalRefundAmount: 32.00,
        refundMode: 'CASH',
        pharmacistId: user._id,
        pharmacistNotes: 'Unopened strip with intact foil seal returned by customer.'
      });

      console.log('✓ Seeded Demo Sales (RX-0001, RX-0002, RX-0003) & Customer Return (RET-0001).');
    }
  }

  // 9. Seed Sample Chronic Patients & Khata accounts if empty
  const patientCount = await PharmacyCustomer.countDocuments({ organizationId: org._id });
  if (patientCount === 0) {
    const augmentin = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Augmentin/i });
    const telma = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Telma/i });
    const azithral = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Azithral/i });

    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const in25Days = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
    const overdue2Days = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    // Customer 1: Suresh Ganguly (Hypertension + Diabetes)
    await PharmacyCustomer.create({
      organizationId: org._id,
      name: 'Suresh Ganguly',
      phone: '9830012345',
      age: 48,
      gender: 'MALE',
      address: 'Block B, Lake Gardens, Kolkata - 700045',
      bloodGroup: 'B+',
      allergies: ['Penicillin'],
      chronicConditions: ['HYPERTENSION', 'DIABETES'],
      preferredDoctor: {
        name: 'Dr. A. K. Banerjee (MD)',
        registrationNumber: 'WBMC-38291',
        hospitalClinic: 'Apollo Clinic, South Kolkata',
        phone: '9830199882'
      },
      chronicMedications: [
        {
          medicineId: augmentin?._id,
          brandName: 'Augmentin 625 Duo',
          dosage: '1 Tablet Twice Daily',
          dailyFrequency: '1-0-1',
          daysSupply: 10,
          lastRefillDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          nextRefillDate: in3Days,
          notes: 'Post-dental extraction course'
        },
        {
          medicineId: telma?._id,
          brandName: 'Telma 40 Tablets',
          dosage: '1 Tablet Daily Morning',
          dailyFrequency: '1-0-0',
          daysSupply: 30,
          lastRefillDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nextRefillDate: in25Days,
          notes: 'Essential hypertension maintenance'
        }
      ],
      khata: {
        isEnabled: true,
        creditLimit: 5000,
        currentBalance: 412.00,
        status: 'ACTIVE'
      },
      ledger: [
        {
          transactionDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
          type: 'DEBIT_SALE',
          amount: 412.00,
          balanceAfter: 412.00,
          billNumber: 'RX-2026-0001',
          paymentMethod: 'KHATA',
          notes: 'Counter POS Dispensing RX-2026-0001',
          recordedById: user._id
        }
      ],
      notes: 'Regular customer since 2021. Always pays Khata on 1st of month.'
    });

    // Customer 2: Anjali Sharma (Cardiac & Hypertension) - DUE FOR REFILL
    await PharmacyCustomer.create({
      organizationId: org._id,
      name: 'Anjali Sharma',
      phone: '9832233445',
      age: 62,
      gender: 'FEMALE',
      address: '54 Gariahat Road, Ballygunge, Kolkata - 700019',
      bloodGroup: 'O+',
      allergies: ['Sulfa drugs'],
      chronicConditions: ['CARDIAC', 'HYPERTENSION'],
      preferredDoctor: {
        name: 'Dr. P. Roy (Cardiologist)',
        registrationNumber: 'WBMC-21049',
        hospitalClinic: 'Rabindranath Tagore International Institute',
        phone: '9831002211'
      },
      chronicMedications: [
        {
          medicineId: telma?._id,
          brandName: 'Telma 40 Tablets',
          dosage: '1 Tablet Daily Morning',
          dailyFrequency: '1-0-0',
          daysSupply: 30,
          lastRefillDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          nextRefillDate: overdue2Days,
          notes: 'Cardiac BP maintenance'
        }
      ],
      khata: {
        isEnabled: true,
        creditLimit: 10000,
        currentBalance: 2380.00,
        status: 'ACTIVE'
      },
      ledger: [
        {
          transactionDate: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          type: 'DEBIT_SALE',
          amount: 2380.00,
          balanceAfter: 2380.00,
          billNumber: 'RX-2026-0839',
          paymentMethod: 'KHATA',
          notes: 'Monthly chronic medicine bundle',
          recordedById: user._id
        }
      ],
      notes: 'Senior citizen. Prefers home delivery with digital Khata invoice.'
    });

    // Customer 3: Subir Chakraborty (Antibiotics / General)
    await PharmacyCustomer.create({
      organizationId: org._id,
      name: 'Subir Chakraborty',
      phone: '9831122334',
      age: 52,
      gender: 'MALE',
      address: 'Salt Lake Sector 1, Kolkata - 700064',
      bloodGroup: 'A+',
      chronicConditions: ['HYPERTENSION'],
      preferredDoctor: {
        name: 'Dr. R. Sengupta (MBBS)',
        registrationNumber: 'WBMC-49102',
        hospitalClinic: 'AMRI Hospital, Dhakuria'
      },
      chronicMedications: [
        {
          medicineId: azithral?._id,
          brandName: 'Azithral 500 Tablet',
          dosage: '1 Tablet Daily After Dinner',
          dailyFrequency: '0-0-1',
          daysSupply: 5,
          lastRefillDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
          nextRefillDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
      ],
      khata: {
        isEnabled: true,
        creditLimit: 5000,
        currentBalance: 0,
        status: 'ACTIVE'
      },
      ledger: [
        {
          transactionDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          type: 'CREDIT_PAYMENT',
          amount: 1500.00,
          balanceAfter: 0,
          paymentMethod: 'UPI',
          referenceNumber: 'UPI/9831122334@okaxis',
          notes: 'Cleared previous balance in full',
          recordedById: user._id
        }
      ]
    });

    // Customer 4: Mita Debnath (OTC Customer)
    await PharmacyCustomer.create({
      organizationId: org._id,
      name: 'Mita Debnath',
      phone: '9836677889',
      age: 34,
      gender: 'FEMALE',
      address: 'College Street, Kolkata - 700073',
      chronicConditions: ['OTHER'],
      khata: {
        isEnabled: false,
        creditLimit: 0,
        currentBalance: 0
      },
      notes: 'Walk-in cash customer.'
    });

    console.log('✓ Seeded Demo Patients (Suresh Ganguly, Anjali Sharma, Subir Chakraborty, Mita Debnath) with Khata ledgers & refill reminders.');
  }

  // 9. PHASE 6: SEED SUPPLIER DEBIT NOTES & STATUTORY DISPOSAL LOGS
  const existingDebitNotes = await PharmacyDebitNote.countDocuments({ organizationId: org._id });
  if (existingDebitNotes === 0) {
    const supplier1 = await PharmacySupplier.findOne({ organizationId: org._id, name: /Bengal/i }) || await PharmacySupplier.findOne({ organizationId: org._id });
    const supplier2 = await PharmacySupplier.findOne({ organizationId: org._id, name: /Eastern/i }) || supplier1;
    const pntBatch = await PharmacyBatch.findOne({ organizationId: org._id, batchNumber: 'PNT2391' });
    const augBatch = await PharmacyBatch.findOne({ organizationId: org._id, batchNumber: 'AUG24018' });
    const pntMed = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Pantocid|Pan/i });
    const augMed = await PharmacyMedicine.findOne({ organizationId: org._id, brandName: /Augmentin/i });
    const sampleGRN = await PharmacyGRN.findOne({ organizationId: org._id });

    // Debit Note 1: To Bengal Drug House for Expired Pantocid DSR
    if (supplier1 && pntBatch && pntMed) {
      await PharmacyDebitNote.create({
        organizationId: org._id,
        debitNoteNumber: 'DN-2026-0001',
        supplierId: supplier1._id,
        supplierName: supplier1.name,
        supplierGstin: supplier1.gstin || '19AABCB1234F1Z1',
        supplierDlNumber: supplier1.dlNumber || 'Form 20B/21B-WB-4819',
        debitNoteDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        returnType: 'EXPIRY_RETURN',
        status: 'SENT_TO_SUPPLIER',
        items: [
          {
            medicineId: pntMed._id,
            brandName: pntMed.brandName,
            genericName: pntMed.genericName,
            batchId: pntBatch._id,
            batchNumber: pntBatch.batchNumber,
            expiryDate: pntBatch.expiryDate,
            expiryDateObj: pntBatch.expiryDateObj,
            quantityReturned: 15,
            unitPurchasePrice: pntBatch.purchasePrice || 142.50,
            gstRate: 12,
            taxableAmount: 2137.50,
            gstAmount: 256.50,
            totalClaimAmount: 2394.00,
            reason: 'EXPIRED_STOCK'
          }
        ],
        totalQuantity: 15,
        subtotal: 2137.50,
        taxTotal: 256.50,
        grandTotal: 2394.00,
        settlement: {
          settlementType: 'PENDING',
          settledAmount: 0
        },
        pharmacistNotes: 'Formal return of expired strips per distributor policy. Awaiting credit note issuance.',
        issuedById: user._id
      });
    }

    // Debit Note 2: To Eastern Pharma for Near-Expiry Augmentin 625 Duo (Settled against GRN)
    if (supplier2 && augBatch && augMed) {
      await PharmacyDebitNote.create({
        organizationId: org._id,
        debitNoteNumber: 'DN-2026-0002',
        supplierId: supplier2._id,
        supplierName: supplier2.name,
        supplierGstin: supplier2.gstin || '19XYZPA9988H1Z8',
        supplierDlNumber: supplier2.dlNumber || 'Form 20B/21B-WB-9012',
        debitNoteDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        returnType: 'NEAR_EXPIRY_RETURN',
        status: 'SETTLED',
        items: [
          {
            medicineId: augMed._id,
            brandName: augMed.brandName,
            genericName: augMed.genericName,
            batchId: augBatch._id,
            batchNumber: augBatch.batchNumber,
            expiryDate: augBatch.expiryDate,
            expiryDateObj: augBatch.expiryDateObj,
            quantityReturned: 10,
            unitPurchasePrice: augBatch.purchasePrice || 153.37,
            gstRate: 12,
            taxableAmount: 1533.70,
            gstAmount: 184.04,
            totalClaimAmount: 1717.74,
            reason: 'NEAR_EXPIRY_THRESHOLD'
          }
        ],
        totalQuantity: 10,
        subtotal: 1533.70,
        taxTotal: 184.04,
        grandTotal: 1717.74,
        settlement: {
          settlementType: 'ADJUSTED_AGAINST_GRN',
          settledAmount: 1717.74,
          creditNoteNumber: 'EPD-CN-2026-8819',
          creditNoteDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          adjustedGrnId: sampleGRN?._id,
          settlementDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          settlementNotes: 'Settled via Eastern Pharma Credit Note against invoice'
        },
        pharmacistNotes: 'Near-expiry return accepted by distributor Eastern Pharma.',
        issuedById: user._id
      });
    }

    // Statutory Disposal Log: Certified destruction of expired/broken stock
    const existingDisposals = await PharmacyDisposalLog.countDocuments({ organizationId: org._id });
    if (existingDisposals === 0 && pntBatch && pntMed) {
      await PharmacyDisposalLog.create({
        organizationId: org._id,
        disposalNumber: 'DISP-2026-0001',
        disposalDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        batchId: pntBatch._id,
        medicineId: pntMed._id,
        brandName: pntMed.brandName,
        genericName: pntMed.genericName,
        batchNumber: pntBatch.batchNumber,
        expiryDate: pntBatch.expiryDate,
        quantityDisposed: 5,
        unitCost: pntBatch.purchasePrice || 142.50,
        totalLoss: 712.50,
        method: 'INCINERATION_BIOMEDICAL_AGENCY',
        agencyName: 'Medicare Bio-Waste Solutions Pvt Ltd',
        agencyCertificateNumber: 'BMW-WB-2026-08129',
        witnessedBy: 'Rahul Roy (WB-48291, Regd. Pharmacist)',
        pharmacistId: user._id,
        remarks: 'Physical damaged foil packaging and crystallization. Safely incinerated per Bio-Medical Waste Management Rules 2016.'
      });
    }

    console.log('✓ Seeded Phase 6: Supplier Debit Notes (DN-2026-0001, DN-2026-0002) & Statutory Destruction Register (DISP-2026-0001).');
  }

  console.log('\n=============================================================');
  console.log('  APEXBUILD PHARMACY OS DEMO CREDENTIALS');
  console.log('=============================================================');
  console.log('  Portal URL:       http://localhost:5173/login');
  console.log('  Email:            pharmacy@apexbuild.com');
  console.log('  Password:         password123');
  console.log('  Organization:     ApexCare Retail Pharmacy & Chemists');
  console.log('  Business Type:    PHARMACY');
  console.log('  Default Route:    /pharmacy/dashboard');
  console.log('=============================================================\n');

  await mongoose.disconnect();
}

seedPharmacyDemo().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
