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
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });
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

async function runPhase1Test() {
  console.log('=================================================================');
  console.log('🚀 TESTING PHASE 1: PUBLIC REGISTRATION ➔ SUPERADMIN VERIFICATION');
  console.log('=================================================================\n');

  const testEmail = `testbiz_${Date.now()}@example.com`;
  const testOrgName = `Metro Sky Infra ${Date.now().toString().slice(-4)}`;

  // STEP 1: Public Registration
  console.log('STEP 1: Prospective Business Submits Public Registration (/register)...');
  const regRes = await postJSON(`${API_BASE}/auth/register`, {
    orgName: testOrgName,
    orgEmail: testEmail,
    userName: 'Vikas Malhotra',
    userEmail: testEmail,
    password: 'SecurePassword123',
    phone: '+91 99887 76655',
    businessType: 'CONTRACTOR',
    city: 'Pune',
    state: 'Maharashtra',
    notes: 'Need Contractor OS for 3 metro station civil contracts'
  });

  console.log('✅ Registration response status:', regRes.status);
  console.log('   Pending Verification flag:', regRes.data.pendingVerification);
  console.log('   Application ID:', regRes.data.data?.applicationId);
  console.log('   Account Status in DB:', regRes.data.data?.status);
  console.log('   Token returned:', regRes.data.token || 'NONE (Correct: No token issued for pending accounts)');

  if (!regRes.data.pendingVerification || regRes.data.token) {
    console.error('❌ Failed: Expected pendingVerification=true and no token.');
    process.exit(1);
  }

  const applicationId = regRes.data.data.applicationId;

  // STEP 2: Attempt Login before Verification
  console.log('\nSTEP 2: Prospective business attempts login before Superadmin verification...');
  const blockedLogin = await postJSON(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: 'SecurePassword123'
  });
  console.log('✅ Login attempt status:', blockedLogin.status);
  console.log('   Message:', blockedLogin.data.message);
  if (blockedLogin.status !== 403) {
    console.error('❌ Error: Expected 403 Forbidden for pending account!');
    process.exit(1);
  }

  // STEP 3: Superadmin Login
  console.log('\nSTEP 3: Superadmin logs in to review the verification queue...');
  const saLoginRes = await postJSON(`${API_BASE}/auth/login`, {
    email: 'superadmin@example.com',
    password: '123456'
  });

  if (!saLoginRes.ok) {
    console.error('❌ Superadmin login failed:', saLoginRes.data);
    process.exit(1);
  }

  const saToken = saLoginRes.data.token;
  console.log('✅ Superadmin authenticated successfully.');

  // STEP 4: Superadmin Inspects Verification Queue
  console.log('\nSTEP 4: Superadmin queries the pending verification queue...');
  const queueRes = await getJSON(`${API_BASE}/platform/business-accounts?status=pending`, saToken);
  const pendingAccounts = queueRes.data.data?.accounts || [];
  console.log(`✅ Pending Queue contains ${pendingAccounts.length} application(s).`);
  const found = pendingAccounts.find(a => a._id === applicationId);
  if (!found) {
    console.error(`❌ Application ${applicationId} not found in pending queue!`);
    process.exit(1);
  }
  console.log(`✅ Application ${applicationId} (${found.name}) confirmed in queue.`);

  // STEP 5: Get OS Plans to provision
  console.log('\nSTEP 5: Fetching OS Plans to assign...');
  const plansRes = await getJSON(`${API_BASE}/platform/os-plans`, saToken);
  const plans = plansRes.data.data?.plans || plansRes.data.data || [];
  const selectedPlan = plans[0] || null;
  console.log(`✅ Selected plan: ${selectedPlan ? selectedPlan.name : 'Standard Growth Plan'}`);

  // STEP 6: 1-Click Verification & Provisioning
  console.log('\nSTEP 6: Superadmin verifies and provisions business with custom plan & setup fee...');
  const verifyRes = await postJSON(
    `${API_BASE}/platform/business-accounts/${applicationId}/verify`,
    {
      osProductId: selectedPlan?.osProductId?._id || selectedPlan?.osProductId,
      osPlanId: selectedPlan?._id,
      billingCycle: 'monthly',
      customPrice: 79,
      discount: 10,
      setupFee: 150,
      internalNotes: 'Verified company registration and assigned custom $79/mo growth tier with $150 setup fee.'
    },
    saToken
  );

  console.log('✅ Verification response status:', verifyRes.status);
  console.log('   Message:', verifyRes.data.message);
  console.log('   Account Status in DB:', verifyRes.data.data?.account?.status);
  console.log('   Approval Date:', verifyRes.data.data?.account?.approvalDate);
  console.log('   Assigned Subscription:', verifyRes.data.data?.subscription?._id);
  console.log('   Final Recurring Amount:', verifyRes.data.data?.subscription?.finalAmount);

  if (verifyRes.status !== 200 || verifyRes.data.data?.account?.status !== 'active') {
    console.error('❌ Verification failed or account not marked active!');
    process.exit(1);
  }

  // STEP 7: Business Owner Logs In Successfully
  console.log('\nSTEP 7: Verified Business Owner logs into their newly activated OS...');
  const ownerLoginRes = await postJSON(`${API_BASE}/auth/login`, {
    email: testEmail,
    password: 'SecurePassword123'
  });

  console.log('✅ Owner Login SUCCESSFUL! Status:', ownerLoginRes.status);
  console.log('   Issued JWT Token:', ownerLoginRes.data.token?.slice(0, 25) + '...');
  console.log('   User Name:', ownerLoginRes.data.data?.user?.name);
  console.log('   User Status:', ownerLoginRes.data.data?.user?.status);
  console.log('   Organization Status:', ownerLoginRes.data.data?.user?.organizationId?.status);

  if (ownerLoginRes.status !== 200 || !ownerLoginRes.data.token) {
    console.error('❌ Owner login failed after verification!');
    process.exit(1);
  }

  console.log('\n=================================================================');
  console.log('🎉 PHASE 1: PUBLIC REGISTRATION ➔ VERIFICATION QUEUE 100% VERIFIED');
  console.log('=================================================================');
}

runPhase1Test().catch(console.error);
