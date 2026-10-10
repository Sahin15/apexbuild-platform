import mongoose from 'mongoose';
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import DistributorCustomer from '../models/DistributorCustomer.js';
import DistributorSupplier from '../models/DistributorSupplier.js';
import DistributorStock from '../models/DistributorStock.js';
import DistributorSale from '../models/DistributorSale.js';
import DistributorPurchase from '../models/DistributorPurchase.js';
import DistributorPayment from '../models/DistributorPayment.js';
import DistributorExpense from '../models/DistributorExpense.js';
import DistributorVehicle from '../models/DistributorVehicle.js';

async function seedDistributorDemoData() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/apexbuild');
    console.log('Connected to MongoDB...');

    // Find Distributor Demo org
    const org = await Organization.findOne({ name: 'Distributor Demo' });
    if (!org) {
      console.error('Distributor Demo organization not found!');
      process.exit(1);
    }
    const orgId = org._id;
    const user = await User.findOne({ organizationId: orgId });

    // Clean existing data for this org
    await DistributorCustomer.deleteMany({ organizationId: orgId });
    await DistributorSupplier.deleteMany({ organizationId: orgId });
    await DistributorStock.deleteMany({ organizationId: orgId });
    await DistributorSale.deleteMany({ organizationId: orgId });
    await DistributorPurchase.deleteMany({ organizationId: orgId });
    await DistributorPayment.deleteMany({ organizationId: orgId });
    await DistributorExpense.deleteMany({ organizationId: orgId });
    await DistributorVehicle.deleteMany({ organizationId: orgId });

    // 1. Vehicles
    const vehicle1 = await DistributorVehicle.create({
      organizationId: orgId,
      registrationNumber: 'WB-19-4821',
      vehicleType: 'Tata Ace Gold (Crate Carrier)',
      capacity: 1200,
      status: 'ACTIVE',
      currentOdometer: 34200
    });

    const vehicle2 = await DistributorVehicle.create({
      organizationId: orgId,
      registrationNumber: 'WB-24-9102',
      vehicleType: 'Mahindra Bolero Maxi Truck',
      capacity: 2000,
      status: 'ACTIVE',
      currentOdometer: 58100
    });

    // 2. Customers
    const c1 = await DistributorCustomer.create({
      organizationId: orgId,
      shopName: 'Royal Chicken Corner',
      ownerName: 'Rashid Ali',
      phone: '9830123456',
      whatsapp: '9830123456',
      address: 'Shop 4, Park Circus Market',
      area: 'Central Kolkata',
      route: 'Route A - City Center',
      openingDue: 5000,
      currentDue: 18500,
      creditLimit: 35000,
      defaultSellingRate: 135,
      status: 'ACTIVE'
    });

    const c2 = await DistributorCustomer.create({
      organizationId: orgId,
      shopName: 'Al-Baik Shawarma & Grill',
      ownerName: 'Mohammad Farooq',
      phone: '9830654321',
      whatsapp: '9830654321',
      address: '12 Ripon Street',
      area: 'Central Kolkata',
      route: 'Route A - City Center',
      openingDue: 10000,
      currentDue: 24200,
      creditLimit: 50000,
      defaultSellingRate: 132,
      status: 'ACTIVE'
    });

    const c3 = await DistributorCustomer.create({
      organizationId: orgId,
      shopName: 'Metro Fresh Chicken Shop',
      ownerName: 'Sunil Mondal',
      phone: '9831112233',
      whatsapp: '9831112233',
      address: 'Near Salt Lake Gate 2',
      area: 'Salt Lake',
      route: 'Route B - Sector 5 Corridor',
      openingDue: 2000,
      currentDue: 12400,
      creditLimit: 25000,
      defaultSellingRate: 130,
      status: 'ACTIVE'
    });

    const c4 = await DistributorCustomer.create({
      organizationId: orgId,
      shopName: 'Kolkata Biryani House',
      ownerName: 'Arshad Khan',
      phone: '9832223344',
      whatsapp: '9832223344',
      address: '45 Lenin Sarani',
      area: 'Dharmatala',
      route: 'Route A - City Center',
      openingDue: 15000,
      currentDue: 35000,
      creditLimit: 60000,
      defaultSellingRate: 128,
      status: 'ACTIVE'
    });

    const c5 = await DistributorCustomer.create({
      organizationId: orgId,
      shopName: 'Star Chicken Retail Depot',
      ownerName: 'Dipankar Das',
      phone: '9833334455',
      whatsapp: '9833334455',
      address: 'Behala Chowrasta Market',
      area: 'Behala',
      route: 'Route C - South Suburban',
      openingDue: 0,
      currentDue: 9800,
      creditLimit: 20000,
      defaultSellingRate: 134,
      status: 'ACTIVE'
    });

    // 3. Suppliers
    const s1 = await DistributorSupplier.create({
      organizationId: orgId,
      name: 'Suguna Poultry Breeders Depot',
      companyName: 'Suguna Foods Pvt Ltd',
      contactPerson: 'Mr. Ramesh Pillai',
      phone: '9900112233',
      address: 'NH-6 Highway Hub, Howrah',
      currentPayable: 45000,
      status: 'ACTIVE'
    });

    const s2 = await DistributorSupplier.create({
      organizationId: orgId,
      name: "Venky's Broiler Farm Bengal",
      companyName: 'Venkateshwara Hatcheries',
      contactPerson: 'Debasish Roy',
      phone: '9900223344',
      address: 'Barasat Poultry Cluster',
      currentPayable: 62000,
      status: 'ACTIVE'
    });

    const s3 = await DistributorSupplier.create({
      organizationId: orgId,
      name: 'Baramati Agro Hatcheries',
      companyName: 'Baramati Agro Ltd',
      contactPerson: 'Sanjay Deshmukh',
      phone: '9900334455',
      address: 'Dankuni Logistics Park',
      currentPayable: 38000,
      status: 'ACTIVE'
    });

    // 4. Stock
    await DistributorStock.create({
      organizationId: orgId,
      currentStock: 2450, // 2,450 KG live broiler stock
      lastUpdated: new Date()
    });

    // 5. Purchases today
    await DistributorPurchase.create({
      organizationId: orgId,
      purchaseNumber: 'PUR-20261010-01',
      purchaseDate: new Date(),
      supplier: s1._id,
      birdType: 'BROILER',
      quantity: 850,
      weight: 1500,
      purchaseRate: 98,
      grossAmount: 147000,
      totalAmount: 147000,
      paidAmount: 100000,
      dueAmount: 47000,
      vehicleId: vehicle2._id,
      paymentStatus: 'PARTIAL',
      notes: 'Morning broiler crate delivery from Suguna depot'
    });

    // 6. Sales / Deliveries Today
    const today = new Date();
    await DistributorSale.create({
      organizationId: orgId,
      saleNumber: 'INV-20261010-01',
      saleDate: today,
      customer: c1._id,
      weight: 220,
      sellingRate: 135,
      grossAmount: 29700,
      netAmount: 29700,
      paidAmount: 15000,
      dueAmount: 14700,
      paymentStatus: 'PARTIAL',
      notes: 'Delivered in 10 crates'
    });

    await DistributorSale.create({
      organizationId: orgId,
      saleNumber: 'INV-20261010-02',
      saleDate: today,
      customer: c2._id,
      weight: 180,
      sellingRate: 132,
      grossAmount: 23760,
      netAmount: 23760,
      paidAmount: 23760,
      dueAmount: 0,
      paymentStatus: 'PAID',
      notes: 'Direct UPI payment on delivery'
    });

    await DistributorSale.create({
      organizationId: orgId,
      saleNumber: 'INV-20261010-03',
      saleDate: today,
      customer: c3._id,
      weight: 140,
      sellingRate: 130,
      grossAmount: 18200,
      netAmount: 18200,
      paidAmount: 10000,
      dueAmount: 8200,
      paymentStatus: 'PARTIAL',
      notes: 'Morning restaurant delivery'
    });

    // 7. Today's Collections
    await DistributorPayment.create({
      organizationId: orgId,
      date: today,
      type: 'CUSTOMER_COLLECTION',
      customer: c1._id,
      amount: 15000,
      paymentMethod: 'CASH',
      reference: 'CASH-REC-01',
      notes: 'Collection on morning route'
    });

    await DistributorPayment.create({
      organizationId: orgId,
      date: today,
      type: 'CUSTOMER_COLLECTION',
      customer: c2._id,
      amount: 23760,
      paymentMethod: 'UPI',
      reference: 'UPI-TXN-884920',
      notes: 'Full bill clearance'
    });

    await DistributorPayment.create({
      organizationId: orgId,
      date: today,
      type: 'CUSTOMER_COLLECTION',
      customer: c3._id,
      amount: 10000,
      paymentMethod: 'UPI',
      reference: 'UPI-TXN-110294',
      notes: 'Partial invoice clearance'
    });

    // 8. Today's Expenses
    await DistributorExpense.create({
      organizationId: orgId,
      date: today,
      category: 'Fuel / Diesel',
      amount: 1800,
      description: 'Diesel for Tata Ace (WB-19-4821) morning trip',
      paymentMethod: 'UPI',
      status: 'CLEARED',
      vehicleId: vehicle1._id,
      loggedBy: user?._id
    });

    await DistributorExpense.create({
      organizationId: orgId,
      date: today,
      category: 'Labor / Crate Loading',
      amount: 1400,
      description: 'Daily loading & crate unloading daily wages',
      paymentMethod: 'CASH',
      status: 'CLEARED',
      loggedBy: user?._id
    });

    console.log('Distributor Demo Data Seeded Successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seedDistributorDemoData();
