# ApexBuild API Contract Report

| Frontend Endpoint Needed | Expected Method | Actual Backend Endpoint | Status | Fix Required |
|---|---|---|---|---|
| `/auth/login` | POST | `/api/v1/auth/login` | Mismatch (FE doesn't call API) | Create Axios client interceptor, hook up Login form |
| `/auth/me` | GET | `/api/v1/auth/me` | Mismatch (FE missing) | Create `AuthContext` to fetch user on load |
| `/dashboard` | GET | `/api/v1/dashboard/overview` | Mismatch (FE uses `mockData.js`) | Fetch and replace hardcoded cards |
| `/projects` | GET | `/api/v1/projects` | Mismatch (FE uses `mockData.js`) | Fetch and replace `mockProjects` |
| `/projects` | POST | `/api/v1/projects` | Mismatch (FE form doesn't submit) | Connect Add Project modal |
| `/projects/:id` | GET | `/api/v1/projects/:id` | Mismatch (FE uses `mockData.js`) | Fetch in `ProjectDetails.jsx` |
| `/projects/:id/boq` | GET | `/api/v1/projects/:projectId/boq` | Mismatch (FE uses `mockBoq`) | Fetch in `BOQ.jsx` |
| `/site-reports` | GET | `/api/v1/site-reports` | Mismatch (FE uses mock) | Fetch in `SiteReports.jsx` |
| `/labour` | GET | MISSING | Backend Missing | Implement `labourRoutes` |
| `/materials` | GET | MISSING | Backend Missing | Implement `materialRoutes` |
| `/expenses` | GET | MISSING | Backend Missing | Implement `expenseRoutes` |
| `/measurements` | GET | MISSING | Backend Missing | Implement `measurementRoutes` |
| `/billing` | GET | MISSING | Backend Missing | Implement `billingRoutes` |
