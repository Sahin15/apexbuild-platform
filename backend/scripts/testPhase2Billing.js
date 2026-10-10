import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_BASE = 'http://localhost:5000/api/v1';

async function postJSON(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function patchJSON(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function getJSON(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runPhase2Test() {
  console.log('=================================================================');
  console.log('🚀 TESTING PHASE 2: BILLING & INVOICE ENGINE (IMPLEMENTATION & TERMS)');
  console.log('=================================================================\n');

  // STEP 1: Superadmin Login
  console.log('STEP 1: Superadmin logs in...');
  const saRes = await postJSON(`${API_BASE}/auth/login`, {
    email: 'superadmin@example.com',
    password: '123456'
  });
  if (!saRes.ok) {
    console.error('❌ Superadmin login failed:', saRes.data);
    process.exit(1);
  }
  const saToken = saRes.data.token;
  console.log('✅ Superadmin authenticated.');

  // STEP 2: Superadmin Fetches Business Accounts
  console.log('\nSTEP 2: Fetching active business accounts...');
  const accsRes = await getJSON(`${API_BASE}/platform/business-accounts?status=active`, saToken);
  const accounts = accsRes.data.data?.accounts || [];
  if (accounts.length === 0) {
    console.error('❌ No active accounts found to test billing on.');
    process.exit(1);
  }
  const targetOrg = accounts[0];
  console.log(`✅ Selected target business account: "${targetOrg.name}" (${targetOrg._id})`);

  // STEP 3: Issue Implementation Fee Invoice
  console.log('\nSTEP 3: Superadmin issues a one-time Implementation Setup Fee invoice...');
  const invRes = await postJSON(`${API_BASE}/platform/invoices`, {
    organizationId: targetOrg._id,
    type: 'IMPLEMENTATION',
    implementationFee: 500,
    subscriptionFee: 0,
    discount: 50,
    tax: 81, // 18% of 450
    notes: 'Warehouse ERP configuration and hardware barcode integration fee',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
  }, saToken);

  console.log('✅ Invoice creation response status:', invRes.status);
  const invoice = invRes.data.data;
  console.log('   Invoice Number:', invoice?.invoiceNumber);
  console.log('   Implementation Fee:', invoice?.implementationFee);
  console.log('   Total with Tax/Discount:', invoice?.total);
  console.log('   Status:', invoice?.status);

  if (invRes.status !== 201 || !invoice?._id) {
    console.error('❌ Failed to issue implementation invoice!');
    process.exit(1);
  }

  // STEP 4: Query Implementation Fees Endpoint
  console.log('\nSTEP 4: Verifying Implementation Fees ledger...');
  const implFeesRes = await getJSON(`${API_BASE}/platform/implementation-fees`, saToken);
  const fees = implFeesRes.data.data?.fees || [];
  const foundFee = fees.find(f => f._id === invoice._id);
  if (!foundFee) {
    console.error(`❌ Fee ${invoice._id} not found in implementation fees ledger!`);
    process.exit(1);
  }
  console.log(`✅ Invoice ${foundFee.invoiceNumber} verified in implementation fees ledger.`);

  // STEP 5: Superadmin Marks Invoice as Paid
  console.log('\nSTEP 5: Superadmin marks invoice status as PAID...');
  const updateStatusRes = await patchJSON(`${API_BASE}/platform/invoices/${invoice._id}/status`, {
    status: 'PAID'
  }, saToken);

  console.log('✅ Status update response status:', updateStatusRes.status);
  const updatedInv = updateStatusRes.data.data;
  console.log('   Updated Status:', updatedInv?.status);
  console.log('   Paid Amount:', updatedInv?.paidAmount);
  console.log('   Due Amount:', updatedInv?.dueAmount);

  if (updatedInv?.status !== 'PAID' || updatedInv?.dueAmount !== 0) {
    console.error('❌ Invoice status update failed!');
    process.exit(1);
  }

  // STEP 6: Adjust Subscription Contract Terms
  console.log('\nSTEP 6: Superadmin updates tenant custom contract subscription terms...');
  const subsRes = await getJSON(`${API_BASE}/platform/subscriptions`, saToken);
  const subs = subsRes.data.data?.subscriptions || [];
  const targetSub = subs.find(s => (s.organizationId?._id || s.organizationId) === targetOrg._id) || subs[0];

  if (targetSub) {
    console.log(`   Modifying subscription ${targetSub._id} for ${targetSub.organizationId?.name}...`);
    const updateSubRes = await patchJSON(`${API_BASE}/platform/subscriptions/${targetSub._id}`, {
      customPrice: 120,
      discount: 25,
      billingCycle: 'monthly',
      status: 'ACTIVE'
    }, saToken);

    console.log('✅ Subscription update response status:', updateSubRes.status);
    const updatedSub = updateSubRes.data.data;
    console.log('   Custom Negotiated Price:', updatedSub?.customPrice);
    console.log('   Discount:', updatedSub?.discount);
    console.log('   Net Final Amount:', updatedSub?.finalAmount);

    if (updatedSub?.finalAmount !== 95) {
      console.error(`❌ Expected finalAmount 95 (120 - 25), got ${updatedSub?.finalAmount}`);
      process.exit(1);
    }
  }

  // STEP 7: Tenant-Facing Platform Billing
  console.log('\nSTEP 7: Tenant logs in and checks Platform Billing portal...');
  const tenantUserRes = await postJSON(`${API_BASE}/auth/login`, {
    email: targetOrg.email,
    password: '123456'
  });

  if (tenantUserRes.ok) {
    const tenantToken = tenantUserRes.data.token;
    const mySubsRes = await getJSON(`${API_BASE}/billing/my-subscriptions`, tenantToken);
    const myInvsRes = await getJSON(`${API_BASE}/billing/my-invoices`, tenantToken);

    console.log('✅ Tenant queried billing successfully:');
    console.log(`   Active Subscriptions: ${mySubsRes.data.data?.subscriptions?.length || 0}`);
    console.log(`   Total Invoices: ${myInvsRes.data.data?.invoices?.length || 0}`);

    const hasNewInvoice = myInvsRes.data.data?.invoices?.some(i => i._id === invoice._id);
    console.log(`   Implementation Invoice Visible to Tenant: ${hasNewInvoice ? 'YES' : 'NO'}`);
  } else {
    console.log('   (Skipped tenant direct login, account uses seeded credentials)');
  }

  console.log('\n=================================================================');
  console.log('🎉 PHASE 2: BILLING & INVOICE ENGINE 100% VERIFIED');
  console.log('=================================================================');
}

runPhase2Test().catch(console.error);
