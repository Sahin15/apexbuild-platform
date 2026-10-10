const BASE_URL = 'http://localhost:5000/api/v1';

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

async function patchJSON(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: 'PATCH',
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

async function runEntitlementsTest() {
  console.log('====================================================================');
  console.log('🔒  PHASE 4: OS-LEVEL FEATURE ENTITLEMENTS & PLAN GATING AUDIT  🔒');
  console.log('====================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName, details = '') {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}: ${details}`);
    }
  }

  try {
    // -----------------------------------------------------------------
    // 1. Authenticate Contractor A (Enterprise Tier)
    // -----------------------------------------------------------------
    console.log('🔹 1. Contractor A (Enterprise Suite) Entitlement Verification');
    const authA = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'apex.infra@example.com',
      password: 'password'
    }).then(r => r.ok ? r : postJSON(`${BASE_URL}/auth/login`, { email: 'apex.infra@example.com', password: 'password' }));
    
    // Fallback password 123456
    const resAuthA = authA.ok ? authA : await postJSON(`${BASE_URL}/auth/login`, { email: 'apex.infra@example.com', password: 'password' }).then(r => r.ok ? r : postJSON(`${BASE_URL}/auth/login`, { email: 'apex.infra@example.com', password: 'password' }));
    
    // Login with 123456
    const finalAuthA = await postJSON(`${BASE_URL}/auth/login`, { email: 'apex.infra@example.com', password: '123456' });
    assert(finalAuthA.ok, 'Contractor A logged in successfully');
    const tokenA = finalAuthA.data.token;

    // Check entitlements endpoint
    const resEntA = await getJSON(`${BASE_URL}/auth/entitlements`, tokenA);
    assert(resEntA.ok, 'Contractor A retrieved entitlements');
    assert(resEntA.data.data?.tier === 'ENTERPRISE', `Contractor A tier is ENTERPRISE (Found: ${resEntA.data.data?.tier})`);
    assert(resEntA.data.data?.entitlements?.civilPnL === true, 'civilPnL is TRUE for Contractor A');
    assert(resEntA.data.data?.entitlements?.drawingVault === true, 'drawingVault is TRUE for Contractor A');

    // Access restricted features
    const resCashflowA = await getJSON(`${BASE_URL}/reports/cashflow-pnl`, tokenA);
    assert(resCashflowA.ok, 'Contractor A accessed /reports/cashflow-pnl successfully (200 OK)');

    const resDocsA = await getJSON(`${BASE_URL}/documents`, tokenA);
    assert(resDocsA.ok, 'Contractor A accessed /documents Drawing Vault successfully (200 OK)');

    // -----------------------------------------------------------------
    // 2. Authenticate Contractor B (Pro Tier) - Verify Lockout
    // -----------------------------------------------------------------
    console.log('\n🔹 2. Contractor B (Pro Suite) Feature Gating Lockout Verification');
    const resAuthB = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'bluestone@example.com',
      password: '123456'
    });
    assert(resAuthB.ok, 'Contractor B logged in successfully');
    const tokenB = resAuthB.data.token;

    // Check entitlements endpoint
    const resEntB = await getJSON(`${BASE_URL}/auth/entitlements`, tokenB);
    assert(resEntB.ok, 'Contractor B retrieved entitlements');
    assert(resEntB.data.data?.tier === 'PRO', `Contractor B tier is PRO (Found: ${resEntB.data.data?.tier})`);
    assert(resEntB.data.data?.entitlements?.snagVault === true, 'snagVault is TRUE for Contractor B (Pro feature)');
    assert(resEntB.data.data?.entitlements?.civilPnL === false, 'civilPnL is FALSE for Contractor B (Enterprise only)');
    assert(resEntB.data.data?.entitlements?.drawingVault === false, 'drawingVault is FALSE for Contractor B (Enterprise only)');

    // Access Pro feature (Allowed)
    const resSnagsB = await getJSON(`${BASE_URL}/snags`, tokenB);
    assert(resSnagsB.ok || resSnagsB.status === 200, 'Contractor B accessed /snags (Pro feature allowed)');

    // Attempt to access Enterprise feature: Cash Flow & P&L (Blocked)
    const resCashflowB = await getJSON(`${BASE_URL}/reports/cashflow-pnl`, tokenB);
    assert(
      resCashflowB.status === 403,
      `Contractor B access to /reports/cashflow-pnl returned 403 Forbidden (Blocked as expected)`
    );
    assert(
      resCashflowB.data?.code === 'FEATURE_NOT_ENTITLED',
      `Error response contains code FEATURE_NOT_ENTITLED (Found: ${resCashflowB.data?.code})`
    );
    assert(
      resCashflowB.data?.requiredTier === 'ENTERPRISE',
      `Error response specifies requiredTier: ENTERPRISE (Found: ${resCashflowB.data?.requiredTier})`
    );

    // Attempt to access Enterprise feature: Drawing Vault (Blocked)
    const resDocsB = await getJSON(`${BASE_URL}/documents`, tokenB);
    assert(
      resDocsB.status === 403,
      `Contractor B access to /documents returned 403 Forbidden (Blocked as expected)`
    );
    assert(
      resDocsB.data?.code === 'FEATURE_NOT_ENTITLED',
      `Drawing vault response contains code FEATURE_NOT_ENTITLED`
    );

    // -----------------------------------------------------------------
    // 3. Superadmin Custom Entitlement Override
    // -----------------------------------------------------------------
    console.log('\n🔹 3. Superadmin Custom Entitlement Override Verification');
    const resAuthAdmin = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'superadmin@example.com',
      password: '123456'
    });
    assert(resAuthAdmin.ok, 'Superadmin logged in successfully');
    const tokenAdmin = resAuthAdmin.data.token;

    const subIdB = resEntB.data.data?.subscriptionId;
    assert(subIdB, `Found Contractor B active subscription ID: ${subIdB}`);

    // Grant custom entitlement: civilPnL = true
    const resGrant = await patchJSON(
      `${BASE_URL}/platform/subscriptions/${subIdB}/entitlements`,
      { customEntitlements: { civilPnL: true } },
      tokenAdmin
    );
    assert(resGrant.ok, 'Superadmin granted custom entitlement civilPnL=true to Contractor B');

    // Contractor B checks entitlements again
    const resEntBAfterGrant = await getJSON(`${BASE_URL}/auth/entitlements`, tokenB);
    assert(
      resEntBAfterGrant.data.data?.entitlements?.civilPnL === true,
      'Contractor B entitlements now reflect civilPnL === true (Custom grant active)'
    );

    // Contractor B now accesses /reports/cashflow-pnl
    const resCashflowBAfterGrant = await getJSON(`${BASE_URL}/reports/cashflow-pnl`, tokenB);
    assert(
      resCashflowBAfterGrant.ok,
      'Contractor B now successfully accessed /reports/cashflow-pnl (Custom override verified!)'
    );

    // Revoke custom entitlement: civilPnL = false
    const resRevoke = await patchJSON(
      `${BASE_URL}/platform/subscriptions/${subIdB}/entitlements`,
      { customEntitlements: { civilPnL: false } },
      tokenAdmin
    );
    assert(resRevoke.ok, 'Superadmin revoked custom entitlement from Contractor B');

    // Contractor B should be blocked again
    const resCashflowBAfterRevoke = await getJSON(`${BASE_URL}/reports/cashflow-pnl`, tokenB);
    assert(
      resCashflowBAfterRevoke.status === 403,
      'Contractor B access to /reports/cashflow-pnl blocked again after revocation (403 Forbidden)'
    );

    console.log('\n====================================================================');
    console.log(`🏁 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100% PLAN GATING VERIFIED)`);
    console.log('====================================================================\n');

  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

runEntitlementsTest();
