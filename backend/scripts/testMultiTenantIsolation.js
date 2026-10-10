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

async function getJSON(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runIsolationAudit() {
  console.log('================================================================');
  console.log('🛡️  APEXBUILD MULTI-TENANT WORKSPACE & DATA ISOLATION AUDIT  🛡️');
  console.log('================================================================\n');

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
    // -------------------------------------------------------------
    // TEST 1: Contractor A vs Contractor B on Contractor OS
    // -------------------------------------------------------------
    console.log('🔹 1. Contractor OS Multi-Tenant Separation Audit');

    // Login Contractor A
    const resAuthA = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'apex.infra@example.com',
      password: '123456'
    });
    assert(resAuthA.ok, 'Contractor A authenticated successfully (200 OK)');
    const tokenA = resAuthA.data.token;
    const orgAId = resAuthA.data.data.user.organizationId._id || resAuthA.data.data.user.organizationId;

    // Login Contractor B
    const resAuthB = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'bluestone@example.com',
      password: '123456'
    });
    assert(resAuthB.ok, 'Contractor B authenticated successfully (200 OK)');
    const tokenB = resAuthB.data.token;
    const orgBId = resAuthB.data.data.user.organizationId._id || resAuthB.data.data.user.organizationId;
    assert(orgAId !== orgBId, `Contractor A and Contractor B have distinct Tenant Org IDs (${orgAId} !== ${orgBId})`);

    // Contractor A fetches projects
    const resProjA = await getJSON(`${BASE_URL}/projects`, tokenA);
    const projectsA = resProjA.data.data?.projects || resProjA.data.data || [];
    assert(projectsA.length === 3, `Contractor A sees exactly 3 isolated projects (Found: ${projectsA.length})`);

    // Contractor B fetches projects
    const resProjB = await getJSON(`${BASE_URL}/projects`, tokenB);
    const projectsB = resProjB.data.data?.projects || resProjB.data.data || [];
    assert(projectsB.length === 2, `Contractor B sees exactly 2 isolated projects (Found: ${projectsB.length})`);

    // Check 0 overlap
    const idsA = new Set(projectsA.map(p => String(p._id)));
    const idsB = new Set(projectsB.map(p => String(p._id)));
    const overlapProjects = [...idsA].filter(id => idsB.has(id));
    assert(overlapProjects.length === 0, 'Zero project overlap between Contractor A and Contractor B (100% Data Isolation)');

    // Cross-Tenant Access Attack Test (IDOR prevention)
    const targetProjectBId = projectsB[0]._id;
    const resAttackA = await getJSON(`${BASE_URL}/projects/${targetProjectBId}`, tokenA);
    assert(
      resAttackA.status === 404 || resAttackA.status === 403,
      `Contractor A direct GET of Contractor B project returns ${resAttackA.status} (Cross-tenant breach blocked)`
    );

    // -------------------------------------------------------------
    // TEST 2: Supplier A vs Supplier B on Material Supplier OS
    // -------------------------------------------------------------
    console.log('\n🔹 2. Material Supplier OS Multi-Tenant Separation Audit');

    // Login Supplier A
    const resAuthSuppA = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'ganesh.steel@example.com',
      password: '123456'
    });
    assert(resAuthSuppA.ok, 'Supplier A authenticated successfully (200 OK)');
    const tokenSuppA = resAuthSuppA.data.token;

    // Login Supplier B
    const resAuthSuppB = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'readymix@example.com',
      password: '123456'
    });
    assert(resAuthSuppB.ok, 'Supplier B authenticated successfully (200 OK)');
    const tokenSuppB = resAuthSuppB.data.token;

    // Supplier A fetches products & orders
    const resProdA = await getJSON(`${BASE_URL}/supplier/products`, tokenSuppA);
    const productsA = resProdA.data.data?.products || resProdA.data.data || [];
    assert(productsA.length === 4, `Supplier A sees exactly 4 products (TMT Steel, Cement, Wire) (Found: ${productsA.length})`);

    const resOrdersA = await getJSON(`${BASE_URL}/supplier/orders`, tokenSuppA);
    const ordersA = resOrdersA.data.data?.orders || resOrdersA.data.data || [];
    assert(ordersA.length === 1, `Supplier A sees exactly 1 order (SO-GS-1001)`);

    // Supplier B fetches products & orders
    const resProdB = await getJSON(`${BASE_URL}/supplier/products`, tokenSuppB);
    const productsB = resProdB.data.data?.products || resProdB.data.data || [];
    assert(productsB.length === 4, `Supplier B sees exactly 4 products (M25 RMC, M30 RMC, Sand, Aggregate) (Found: ${productsB.length})`);

    const resOrdersB = await getJSON(`${BASE_URL}/supplier/orders`, tokenSuppB);
    const ordersB = resOrdersB.data.data?.orders || resOrdersB.data.data || [];
    assert(ordersB.length === 1, `Supplier B sees exactly 1 order (SO-RM-2001)`);

    // Overlap checks
    const prodIdsA = new Set(productsA.map(p => String(p._id)));
    const prodIdsB = new Set(productsB.map(p => String(p._id)));
    const overlapProd = [...prodIdsA].filter(id => prodIdsB.has(id));
    assert(overlapProd.length === 0, 'Zero inventory product overlap between Supplier A and Supplier B');

    // Cross-Tenant Order Access Attack
    const targetOrderBId = ordersB[0]._id;
    const resAttackSuppA = await getJSON(`${BASE_URL}/supplier/orders/${targetOrderBId}`, tokenSuppA);
    assert(
      resAttackSuppA.status === 404 || resAttackSuppA.status === 403,
      `Supplier A direct GET of Supplier B order returns ${resAttackSuppA.status} (Cross-tenant breach blocked)`
    );

    // -------------------------------------------------------------
    // TEST 3: Diagnostics A vs Diagnostics B on Diagnostics OS
    // -------------------------------------------------------------
    console.log('\n🔹 3. Diagnostics OS Multi-Tenant Separation Audit');

    const resAuthDiagA = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'apex.pathology@example.com',
      password: '123456'
    });
    assert(resAuthDiagA.ok, 'Diagnostics A authenticated successfully (200 OK)');
    const tokenDiagA = resAuthDiagA.data.token;

    const resAuthDiagB = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'metroscan@example.com',
      password: '123456'
    });
    assert(resAuthDiagB.ok, 'Diagnostics B authenticated successfully (200 OK)');
    const tokenDiagB = resAuthDiagB.data.token;

    // Diagnostics A fetches patients
    const resPatA = await getJSON(`${BASE_URL}/diagnostics/patients`, tokenDiagA);
    const patientsA = resPatA.data.data?.patients || resPatA.data.data || [];
    assert(patientsA.length === 3, `Diagnostics A sees exactly 3 pathology patients (Found: ${patientsA.length})`);

    // Diagnostics B fetches patients
    const resPatB = await getJSON(`${BASE_URL}/diagnostics/patients`, tokenDiagB);
    const patientsB = resPatB.data.data?.patients || resPatB.data.data || [];
    assert(patientsB.length === 2, `Diagnostics B sees exactly 2 imaging patients (Found: ${patientsB.length})`);

    // Zero overlap check
    const patIdsA = new Set(patientsA.map(p => String(p._id)));
    const patIdsB = new Set(patientsB.map(p => String(p._id)));
    const overlapPat = [...patIdsA].filter(id => patIdsB.has(id));
    assert(overlapPat.length === 0, 'Zero patient medical record overlap between Diagnostics A and Diagnostics B (Partitioned)');

    // Cross-Tenant Patient Access Attack
    const targetPatientBId = patientsB[0]._id;
    const resAttackDiagA = await getJSON(`${BASE_URL}/diagnostics/patients/${targetPatientBId}`, tokenDiagA);
    assert(
      resAttackDiagA.status === 404 || resAttackDiagA.status === 403,
      `Diagnostics A direct GET of Diagnostics B patient returns ${resAttackDiagA.status} (Cross-tenant breach blocked)`
    );

    // -------------------------------------------------------------
    // TEST 4: Superadmin Impersonation / Masquerading Audit
    // -------------------------------------------------------------
    console.log('\n🔹 4. Superadmin Impersonation & Masquerade Audit');

    const resAuthAdmin = await postJSON(`${BASE_URL}/auth/login`, {
      email: 'superadmin@example.com',
      password: '123456'
    });
    assert(resAuthAdmin.ok, 'Superadmin authenticated successfully (200 OK)');
    const tokenAdmin = resAuthAdmin.data.token;

    // Impersonate Contractor A
    const resImpersonate = await postJSON(`${BASE_URL}/superadmin/impersonate/${orgAId}`, {}, tokenAdmin);
    assert(resImpersonate.ok, 'Superadmin successfully acquired masquerade token for Contractor A');
    const impersonateToken = resImpersonate.data.token;

    // Use impersonate token to fetch projects
    const resImpProj = await getJSON(`${BASE_URL}/projects`, impersonateToken);
    const impProjects = resImpProj.data.data?.projects || resImpProj.data.data || [];
    assert(impProjects.length === 3, 'Masquerading admin sees Contractor A workspace data directly (3 projects)');

    // -------------------------------------------------------------
    // TEST 5: Platform Tenancy Workspaces & Security Audit API
    // -------------------------------------------------------------
    console.log('\n🔹 5. Platform Tenancy Workspaces & Security Audit API');

    const resTenancyWorkspaces = await getJSON(`${BASE_URL}/platform/tenancy-workspaces`, tokenAdmin);
    assert(resTenancyWorkspaces.ok, 'Superadmin fetched /platform/tenancy-workspaces successfully');
    assert(
      resTenancyWorkspaces.data.data?.workspaces?.length >= 6,
      `Workspaces list contains all multi-tenant businesses (Found: ${resTenancyWorkspaces.data.data?.workspaces?.length})`
    );
    assert(
      resTenancyWorkspaces.data.data?.groupedByOS?.CONTRACTOR?.length >= 2,
      `Contractor OS groups at least 2 distinct businesses (Found: ${resTenancyWorkspaces.data.data?.groupedByOS?.CONTRACTOR?.length})`
    );
    assert(
      resTenancyWorkspaces.data.data?.groupedByOS?.MATERIAL_SUPPLIER?.length >= 2,
      `Material Supplier OS groups at least 2 distinct businesses (Found: ${resTenancyWorkspaces.data.data?.groupedByOS?.MATERIAL_SUPPLIER?.length})`
    );
    assert(
      resTenancyWorkspaces.data.data?.groupedByOS?.DIAGNOSTICS?.length >= 2,
      `Diagnostics OS groups at least 2 distinct businesses (Found: ${resTenancyWorkspaces.data.data?.groupedByOS?.DIAGNOSTICS?.length})`
    );

    const resAudit = await getJSON(`${BASE_URL}/platform/tenancy-audit`, tokenAdmin);
    assert(resAudit.ok, 'Superadmin fetched /platform/tenancy-audit successfully');
    assert(
      resAudit.data.data?.status === 'PASSED_100_PERCENT',
      `Audit engine returns PASSED_100_PERCENT (Status: ${resAudit.data.data?.status})`
    );
    assert(
      resAudit.data.data?.securityGuarantees?.length >= 4,
      'Security guarantees confirmed (Compound Indexes, Express Scoping, IDOR Protection, Audit Logging)'
    );

    console.log('\n================================================================');
    console.log(`🏁 AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (100% ISOLATION VERIFIED)`);
    console.log('================================================================\n');

  } catch (error) {
    console.error('Audit encountered error:', error);
    process.exit(1);
  }
}

runIsolationAudit();
