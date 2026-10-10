import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Organization from '../src/models/Organization.js';
import User from '../src/models/User.js';
import SupplierProduct from '../src/models/SupplierProduct.js';
import SupplierCustomer from '../src/models/SupplierCustomer.js';
import SupplierVendor from '../src/models/SupplierVendor.js';
import SupplierOrder from '../src/models/SupplierOrder.js';
import SupplierDelivery from '../src/models/SupplierDelivery.js';
import SupplierInvoice from '../src/models/SupplierInvoice.js';
import SupplierVehicle from '../src/models/SupplierVehicle.js';
import SupplierDriver from '../src/models/SupplierDriver.js';
import SupplierInventoryLedger from '../src/models/SupplierInventoryLedger.js';

async function seed() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/apexbuild';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  const supplierUser = await User.findOne({ email: 'supplier@example.com' });
  if (!supplierUser) {
    console.error('Supplier demo user not found');
    process.exit(1);
  }

  const orgId = supplierUser.organizationId;

  // Clear existing supplier data
  await SupplierProduct.deleteMany({ organizationId: orgId });
  await SupplierCustomer.deleteMany({ organizationId: orgId });
  await SupplierVendor.deleteMany({ organizationId: orgId });
  await SupplierOrder.deleteMany({ organizationId: orgId });
  await SupplierDelivery.deleteMany({ organizationId: orgId });
  await SupplierInvoice.deleteMany({ organizationId: orgId });
  await SupplierVehicle.deleteMany({ organizationId: orgId });
  await SupplierDriver.deleteMany({ organizationId: orgId });
  await SupplierInventoryLedger.deleteMany({ organizationId: orgId });

  console.log('Cleared existing supplier data.');

  // 1. Create Vendors (Mills & Quarries)
  const vendor1 = await SupplierVendor.create({
    organizationId: orgId,
    name: 'Tata Steel Long Products Division',
    contactPerson: 'S. N. Sharma',
    phone: '9830114455',
    email: 'dispatch.kolkata@tatasteel.com',
    gstin: '19AAACT2727Q1ZG',
    address: 'Tata Centre, 43 J.L. Nehru Road, Kolkata 700071',
    paymentTerms: '15 Days Net',
    currentPayable: 1450000
  });

  const vendor2 = await SupplierVendor.create({
    organizationId: orgId,
    name: 'UltraTech Cement Bulk Terminal',
    contactPerson: 'Arun Mukherjee',
    phone: '9830225566',
    email: 'bulk.east@ultratechcement.com',
    gstin: '19AAACU0322R1ZQ',
    address: 'Dankuni Industrial Area, Hooghly 712311',
    paymentTerms: '7 Days Net',
    currentPayable: 680000
  });

  const vendor3 = await SupplierVendor.create({
    organizationId: orgId,
    name: 'Bengal Blue Metal & Stone Quarry',
    contactPerson: 'Bikram Mondal',
    phone: '9830336677',
    address: 'Pakur Mining Zone / Birbhum Border',
    paymentTerms: 'Immediate Cash/RTGS',
    currentPayable: 185000
  });

  console.log('Seeded 3 raw material vendors.');

  // 2. Create Products (Construction Materials)
  const prodTMT12 = await SupplierProduct.create({
    organizationId: orgId,
    name: 'Tata Tiscon 12mm TMT Rebar (Fe 550D)',
    sku: 'STEEL-TMT-12MM',
    category: 'Steel & Rebar',
    brand: 'Tata Tiscon',
    unit: 'Ton',
    purchasePrice: 57500,
    sellingPrice: 62500,
    minSellingPrice: 61000,
    currentStock: 48.5,
    minStockLevel: 15,
    gstRate: 18,
    hsnSac: '72142090',
    preferredVendorId: vendor1._id,
    description: 'High ductile corrosion resistant TMT bars for columns & beams'
  });

  const prodTMT16 = await SupplierProduct.create({
    organizationId: orgId,
    name: 'Tata Tiscon 16mm TMT Rebar (Fe 550D)',
    sku: 'STEEL-TMT-16MM',
    category: 'Steel & Rebar',
    brand: 'Tata Tiscon',
    unit: 'Ton',
    purchasePrice: 56800,
    sellingPrice: 61800,
    minSellingPrice: 60500,
    currentStock: 62.0,
    minStockLevel: 20,
    gstRate: 18,
    hsnSac: '72142090',
    preferredVendorId: vendor1._id,
    description: 'Heavy structural rebar for foundation rafts and heavy columns'
  });

  const prodRMC25 = await SupplierProduct.create({
    organizationId: orgId,
    name: 'Ready-Mix Concrete (RMC) M25 Grade',
    sku: 'RMC-CONC-M25',
    category: 'Ready-Mix Concrete',
    brand: 'ApexMix Plant-1',
    unit: 'Other', // m3
    purchasePrice: 3950,
    sellingPrice: 4850,
    minSellingPrice: 4600,
    currentStock: 250,
    minStockLevel: 50,
    gstRate: 18,
    hsnSac: '38245010',
    description: 'Design mix concrete with 120mm slump suitable for slabs & beams'
  });

  const prodRMC30 = await SupplierProduct.create({
    organizationId: orgId,
    name: 'Ready-Mix Concrete (RMC) M30 Grade',
    sku: 'RMC-CONC-M30',
    category: 'Ready-Mix Concrete',
    brand: 'ApexMix Plant-1',
    unit: 'Other',
    purchasePrice: 4300,
    sellingPrice: 5300,
    minSellingPrice: 5100,
    currentStock: 180,
    minStockLevel: 40,
    gstRate: 18,
    hsnSac: '38245010',
    description: 'High strength commercial grade concrete for high-rise columns'
  });

  const prodSand = await SupplierProduct.create({
    organizationId: orgId,
    name: 'Coarse River Sand (Zone II Silt Free)',
    sku: 'AGG-SAND-Z2',
    category: 'Sand & Aggregates',
    brand: 'Riverbed Damodar',
    unit: 'Ton',
    purchasePrice: 1100,
    sellingPrice: 1550,
    minSellingPrice: 1450,
    currentStock: 420,
    minStockLevel: 100,
    gstRate: 5,
    hsnSac: '25051000',
    description: 'Washed concrete sand for RCC structural works'
  });

  const prodMetal20 = await SupplierProduct.create({
    organizationId: orgId,
    name: '20mm Blue Metal Crushed Stone Aggregate',
    sku: 'AGG-STONE-20MM',
    category: 'Sand & Aggregates',
    brand: 'Black Stone Quarry',
    unit: 'Ton',
    purchasePrice: 850,
    sellingPrice: 1250,
    minSellingPrice: 1150,
    currentStock: 650,
    minStockLevel: 150,
    gstRate: 5,
    hsnSac: '25171010',
    preferredVendorId: vendor3._id,
    description: 'Cubical machine crushed aggregate for RCC works'
  });

  const prodCement = await SupplierProduct.create({
    organizationId: orgId,
    name: 'UltraTech OPC 53 Grade Cement (50kg Bag)',
    sku: 'CEM-ULTRA-53',
    category: 'Cement',
    brand: 'UltraTech',
    unit: 'Bag',
    purchasePrice: 345,
    sellingPrice: 395,
    minSellingPrice: 385,
    currentStock: 85, // Low stock! minStockLevel is 200
    minStockLevel: 200,
    gstRate: 28,
    hsnSac: '25232910',
    preferredVendorId: vendor2._id,
    description: 'High early strength cement for structural castings'
  });

  console.log('Seeded 7 construction material products.');

  // 3. Create Customers (Civil Contractors)
  const cust1 = await SupplierCustomer.create({
    organizationId: orgId,
    name: 'Skyline Infra Projects LLP',
    businessName: 'Skyline Civil Engineering',
    phone: '9822011223',
    whatsappNumber: '9822011223',
    email: 'procurement@skylineinfra.com',
    gstin: '19AAECS1284B1ZM',
    billingAddress: 'Tower A Site Office, New Town Action Area II, Kolkata',
    deliveryAddress: 'Skyline Heights Tower A Site, Rajarhat Main Road',
    contactPerson: 'Kishore Site Engineer',
    creditLimit: 2500000,
    paymentTerms: '30 Days Net',
    currentDue: 845000
  });

  const cust2 = await SupplierCustomer.create({
    organizationId: orgId,
    name: 'Apex Civil Buildcon Pvt Ltd',
    businessName: 'Apex Buildcon',
    phone: '9833055667',
    email: 'billing@apexbuildcon.in',
    gstin: '19AAKCA4812K1ZL',
    billingAddress: '48 Park Circus Connector, Kolkata 700046',
    deliveryAddress: 'Bridge Construction Site #4, EM Bypass Extension',
    contactPerson: 'Subhashish Sen',
    creditLimit: 1500000,
    paymentTerms: '15 Days Net',
    currentDue: 462000
  });

  const cust3 = await SupplierCustomer.create({
    organizationId: orgId,
    name: 'Metro Highway Developers',
    businessName: 'Metro Roads & Infra',
    phone: '9811099887',
    email: 'materials@metrohighway.org',
    gstin: '19AAAFM8819J1ZQ',
    billingAddress: 'Highway Camp #2, NH-34 Four Laning',
    deliveryAddress: 'Culvert & Subgrade Km 42 to 48',
    contactPerson: 'Devendra Patel',
    creditLimit: 3000000,
    paymentTerms: '30 Days Net',
    currentDue: 1120000
  });

  console.log('Seeded 3 contractor customers.');

  // 4. Create Logistics Fleet (Dumpers, Transit Mixers, Drivers)
  const veh1 = await SupplierVehicle.create({
    organizationId: orgId,
    vehicleNumber: 'WB-19-J-4821',
    transportCompany: 'Apex Dedicated Logistics Fleet',
    capacity: 16 // Tons
  });

  const veh2 = await SupplierVehicle.create({
    organizationId: orgId,
    vehicleNumber: 'WB-25-C-8910',
    transportCompany: 'Apex RMC Transit Mixer Fleet',
    capacity: 7 // m3
  });

  const veh3 = await SupplierVehicle.create({
    organizationId: orgId,
    vehicleNumber: 'WB-19-K-7712',
    transportCompany: 'Apex Dedicated Logistics Fleet',
    capacity: 20 // Tons
  });

  const driver1 = await SupplierDriver.create({
    organizationId: orgId,
    name: 'Ramesh Yadav',
    phone: '9831099881',
    licenseNumber: 'WB-2018-00481'
  });

  const driver2 = await SupplierDriver.create({
    organizationId: orgId,
    name: 'Gurpreet Singh',
    phone: '9831122334',
    licenseNumber: 'WB-2016-00912'
  });

  console.log('Seeded 3 fleet vehicles and 2 heavy drivers.');

  // 5. Create Orders
  const today = new Date();
  const order1 = await SupplierOrder.create({
    organizationId: orgId,
    orderNumber: 'ORD-2026-081',
    customer: cust1._id,
    orderDate: today,
    expectedDeliveryDate: today,
    items: [
      {
        product: prodRMC25._id,
        quantity: 28, // 28 m3 RMC for 3rd floor slab
        rate: 4850,
        taxAmount: 24444, // 18% GST
        discountAmount: 0,
        total: 160244
      }
    ],
    subTotal: 135800,
    taxTotal: 24444,
    discountTotal: 0,
    transportCost: 4000,
    otherCost: 0,
    grandTotal: 164244,
    status: 'DELIVERED',
    paymentStatus: 'PARTIAL',
    paidAmount: 80000,
    dueAmount: 84244,
    deliveryAddress: 'Skyline Heights Tower A Site, Rajarhat Main Road',
    notes: 'Transit mixer required with 120mm slump for concrete pump line.'
  });

  const order2 = await SupplierOrder.create({
    organizationId: orgId,
    orderNumber: 'ORD-2026-082',
    customer: cust2._id,
    orderDate: today,
    expectedDeliveryDate: today,
    items: [
      {
        product: prodTMT12._id,
        quantity: 12, // 12 Tons
        rate: 62500,
        taxAmount: 135000,
        discountAmount: 0,
        total: 885000
      },
      {
        product: prodTMT16._id,
        quantity: 15, // 15 Tons
        rate: 61800,
        taxAmount: 166860,
        discountAmount: 0,
        total: 1093860
      }
    ],
    subTotal: 1677000,
    taxTotal: 301860,
    discountTotal: 0,
    transportCost: 8500,
    otherCost: 0,
    grandTotal: 1987360,
    status: 'PROCESSING',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    dueAmount: 1987360,
    deliveryAddress: 'Bridge Construction Site #4, EM Bypass Extension',
    notes: 'Mill test certificates (MTC Fe550D) must accompany each truck.'
  });

  const order3 = await SupplierOrder.create({
    organizationId: orgId,
    orderNumber: 'ORD-2026-083',
    customer: cust3._id,
    orderDate: today,
    expectedDeliveryDate: new Date(Date.now() + 86400000),
    items: [
      {
        product: prodSand._id,
        quantity: 60,
        rate: 1550,
        taxAmount: 4650,
        discountAmount: 0,
        total: 97650
      },
      {
        product: prodMetal20._id,
        quantity: 80,
        rate: 1250,
        taxAmount: 5000,
        discountAmount: 0,
        total: 105000
      }
    ],
    subTotal: 193000,
    taxTotal: 9650,
    discountTotal: 0,
    transportCost: 12000,
    otherCost: 0,
    grandTotal: 214650,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paidAmount: 0,
    dueAmount: 214650,
    deliveryAddress: 'Highway Camp #2, NH-34 Four Laning',
    notes: 'Weighbridge slip compulsory with each dumper load.'
  });

  console.log('Seeded 3 active customer orders.');

  // 6. Create Delivery Challans (Gate Passes)
  await SupplierDelivery.create({
    organizationId: orgId,
    challanNumber: 'DC-2026-081',
    order: order1._id,
    customer: cust1._id,
    dispatchDate: today,
    vehicle: veh2._id,
    driver: driver2._id,
    vehicleNumber: 'WB-25-C-8910',
    driverName: 'Gurpreet Singh',
    driverPhone: '9831122334',
    transportCompany: 'Apex Transit Mixer Fleet',
    status: 'DELIVERED',
    deliveryNotes: 'Dispatched 7m3 load #1 of 4. Site Engineer verified slump test (115mm).',
    recordedBy: supplierUser._id
  });

  await SupplierDelivery.create({
    organizationId: orgId,
    challanNumber: 'DC-2026-082',
    order: order2._id,
    customer: cust2._id,
    dispatchDate: today,
    vehicle: veh1._id,
    driver: driver1._id,
    vehicleNumber: 'WB-19-J-4821',
    driverName: 'Ramesh Yadav',
    driverPhone: '9831099881',
    transportCompany: 'Apex Dedicated Logistics',
    status: 'DISPATCHED',
    deliveryNotes: 'Loaded 12 MT 12mm TMT. Tare wt: 11,240 kg, Gross wt: 23,240 kg.',
    recordedBy: supplierUser._id
  });

  console.log('Seeded 2 delivery challans.');

  // 7. Create GST Tax Invoices
  await SupplierInvoice.create({
    organizationId: orgId,
    invoiceNumber: 'INV-2026-081',
    order: order1._id,
    customer: cust1._id,
    invoiceDate: today,
    dueDate: new Date(Date.now() + 30 * 86400000),
    items: [
      {
        product: prodRMC25._id,
        quantity: 28,
        rate: 4850,
        taxAmount: 24444,
        discountAmount: 0,
        total: 160244
      }
    ],
    subTotal: 135800,
    taxTotal: 24444,
    discountTotal: 0,
    transportCost: 4000,
    otherCost: 0,
    grandTotal: 164244,
    paidAmount: 80000,
    dueAmount: 84244,
    status: 'PARTIAL',
    notes: 'Tax Invoice under GST Rule 48. RMC supply with calibrated batch printout.'
  });

  console.log('Seeded GST Tax Invoice.');
  console.log('\n=== MATERIAL SUPPLIER OS SEEDING COMPLETED SUCCESSFULLY ===');
  await mongoose.disconnect();
}

seed().catch(console.error);
