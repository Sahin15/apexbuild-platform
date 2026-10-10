import mongoose from 'mongoose';

async function check() {
  await mongoose.connect('mongodb://127.0.0.1:27017/apexbuild');
  const orgNames = ['Contractor Demo', 'Supplier Demo', 'Distributor Demo', 'Diagnostic Demo', 'Apex Diagnostics Demo'];
  const orgs = await mongoose.connection.collection('organizations').find({
    name: { $in: orgNames }
  }).toArray();

  for (const org of orgs) {
    console.log(`=== ${org.name} (${org.businessType}) [${org._id}] ===`);
    const cols = [
      'projects', 'clients', 'boqs', 'boqitems', 'rabills', 'goodsreceivednotes', 'labourwagesheets', 'expenses',
      'equipments', 'equipmentlogs', 'snags', 'pettycashaccounts', 'pettycashtransactions', 'documents',
      'suppliercustomers', 'supplierproducts', 'supplierorders', 'supplierinvoices', 'supplierdeliveries', 'suppliervehicles', 'supplierdrivers', 'suppliervendors',
      'distributorcustomers', 'distributorsales', 'distributorstocks', 'distributorvehicles', 'distributorsuppliers', 'distributorexpenses', 'distributorpayments', 'distributorpurchases',
      'patients', 'orders', 'samples', 'results', 'labpaymentreceipts', 'qualitycontrols', 'doctors'
    ];
    let total = 0;
    for (const c of cols) {
      try {
        const count = await mongoose.connection.collection(c).countDocuments({ organizationId: org._id });
        if (count > 0) {
          console.log(`  ${c}: ${count}`);
          total += count;
        }
      } catch (e) {}
    }
    console.log(`  TOTAL RECORDS: ${total}`);
  }
  process.exit(0);
}
check();
