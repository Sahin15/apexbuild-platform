# ApexBuild System Repair & Implementation Plan

This roadmap governs the systematic implementation of the ApexBuild platform, transitioning it from a mocked frontend prototype to a fully functional SaaS application.

## PHASE 0: Critical Infrastructure (Next Immediate Steps)
- Setup `axios` instance with request/response interceptors on the frontend.
- Implement React Context (`AuthContext`) for global state.
- Create generic API utility services (`src/services/api.js`).

## PHASE 1: Authentication & RBAC Integration
- Connect Login page to `/api/v1/auth/login`.
- Store JWT securely and retrieve user data.
- Wrap application in `<ProtectedRoute>` based on authentication state.
- Implement role-based UI rendering (hide buttons based on user role).

## PHASE 2: Projects & Dashboard (Core Loop 1)
- Fetch and render Projects list from backend.
- Hook up "Add Project" modal to save to backend.
- Update Dashboard to fetch `getDashboardOverview` API.
- Ensure organization isolation is working.

## PHASE 3: BOQ Integration
- Hook up BOQ list to backend.
- Hook up "Add BOQ Item" modal to calculate amounts and save.
- Render dynamic BOQ table based on database response.

## PHASE 4: Site Execution
- Hook up Daily Site Reports list and creation.
- Implement approval workflow buttons for Project Managers.

## PHASE 5: Build Missing Backend Modules (Labour, Materials, Expenses)
- Create Mongoose models for Worker, Attendance, Material, Expense.
- Create Express controllers and routes.
- Hook up frontend tabs to these new APIs.
- Ensure `inventoryService` is correctly adjusting stock based on material receipts/consumptions.

## PHASE 6: Measurements & Billing
- Create Mongoose models for Measurements and RABill.
- Ensure strict backend validation (cannot bill more than remaining BOQ quantity).
- Hook up Measurement and Billing tabs in frontend.

## PHASE 7: File Uploads & Documents
- Implement AWS S3 or Local Multer storage on the backend.
- Hook up Documents tab to upload and display files.

## PHASE 8: Final QA & Polish
- Replace all remaining instances of `mockData.js`.
- Audit loading states and error toasts (e.g. using `react-hot-toast`).
- Run full responsive tests.
