# ApexBuild Master Defect Register

| ID | Module | Issue | Severity | Frontend | Backend | API | Database | Reproduction | Recommended Fix | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| AB-001 | Auth | Login form uses mock validation | P0 | Yes | Yes | No | No | Click Login -> logs in automatically | Connect form to `POST /api/v1/auth/login`, store JWT in context | Open |
| AB-002 | Auth | No protected route wrapper | P0 | No | Yes | No | No | Access `/dashboard` without token | Implement `AuthContext` and `<ProtectedRoute>` in `App.jsx` | Open |
| AB-003 | Projects | Add Project form does not persist | P1 | Yes | Yes | No | Yes | Open Add Modal -> Submit -> No API call | Connect modal submit to `POST /api/v1/projects` | Open |
| AB-004 | Projects | Dashboard metrics are hardcoded mock data | P1 | Yes | Yes | No | Yes | View Dashboard | Fetch from `GET /api/v1/dashboard/overview` | Open |
| AB-005 | BOQ | Add BOQ Item form does not persist | P1 | Yes | Yes | No | Yes | Project -> BOQ -> Add Item -> Submit | Connect to `POST /api/v1/projects/:id/boq` | Open |
| AB-006 | Site Reports | Daily report submission is mock | P1 | Yes | Yes | No | Yes | Fill Site Report -> Submit | Connect to `POST /api/v1/site-reports` | Open |
| AB-007 | Materials | Material inventory is mock data | P1 | Yes | No | No | No | View Materials tab | Build backend models & controllers, connect API | Open |
| AB-008 | Labour | Labour attendance is mock data | P1 | Yes | No | No | No | View Labour tab | Build backend models & controllers, connect API | Open |
| AB-009 | Expenses | Expenses are mock data | P1 | Yes | No | No | No | View Expenses tab | Build backend models & controllers, connect API | Open |
| AB-010 | Measurements| Measurements module is mock data | P1 | Yes | No | No | No | View Measurements tab | Build backend models & controllers, connect API | Open |
| AB-011 | RA Billing | RA Bill generation is completely missing | P1 | Yes | No | No | No | View Billing tab | Build billing engine, connect to measurements | Open |
| AB-012 | Documents | File upload is visual only | P2 | Yes | No | No | No | Click upload on Documents tab | Implement Multer on backend, connect frontend | Open |
| AB-013 | Settings | Settings page is visual only | P3 | Yes | No | No | No | View Settings | Implement Organization settings API | Open |
| AB-014 | General | Search bars do not trigger API queries | P2 | Yes | Partial| No | No | Type in any search bar | Implement debounce and query params | Open |
