# ApexBuild Functionality Matrix

| Module | Feature | UI Exists | Handler Exists | API Exists | Database Exists | Validation | Authorization | Persistence | Testing | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| Auth | Login | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Needs Integration |
| Auth | Register | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | Needs Frontend UI |
| Dashboard | Overview Metrics | ✅ | ❌ | ✅ | ✅ | N/A | ✅ | ❌ | ❌ | Needs Integration |
| Projects | List Projects | ✅ | ❌ | ✅ | ✅ | N/A | ✅ | ❌ | ❌ | Needs Integration |
| Projects | Create Project | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Needs Integration |
| Projects | Edit Project | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Needs Frontend UI |
| Projects | Delete Project | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Needs Frontend UI |
| BOQ | List BOQ | ✅ | ❌ | ✅ | ✅ | N/A | ✅ | ❌ | ❌ | Needs Integration |
| BOQ | Add BOQ Item | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Needs Integration |
| Site Reports | List Reports | ✅ | ❌ | ✅ | ✅ | N/A | ✅ | ❌ | ❌ | Needs Integration |
| Site Reports | Create Report | ✅ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Needs Integration |
| Site Reports | Approve Report | ❌ | ❌ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | Needs Frontend UI |
| Labour | List Workers | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend |
| Labour | Mark Attendance | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend & UI |
| Materials | List Inventory | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend |
| Materials | Receive Stock | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend & UI |
| Expenses | List Expenses | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend |
| Expenses | Create Expense | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend & UI |
| Measurements | Create MB | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend & UI |
| Billing | Generate RA | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend & UI |
| Documents | Upload File | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | Needs Backend |

**Legend:**
✅ Implemented
❌ Missing / Mocked
N/A Not Applicable
