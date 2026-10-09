# APEXBUILD DIAGNOSTICS OS

## Product Overview
ApexBuild Diagnostics OS is a complete operating system for diagnostic centres, pathology labs, and small diagnostic facilities, built as part of the ApexBuild Business OS platform.

## Architecture
- **Frontend:** React, Vite, TailwindCSS (Mobile-first, PWA ready)
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Architecture:** Multi-tenant using the existing `Organization` model (`businessType: 'DIAGNOSTICS'`)

## Modules & Implementation Phases
1. **Phase 1-3:** Audit & Base Setup (RBAC, Auth, Dashboard, Navigation)
2. **Phase 4:** Patients, Doctors, Tests & Parameters
3. **Phase 5:** Orders, Billing, Payments
4. **Phase 6:** Sample Management (Collection, Processing, Results)
5. **Phase 7:** Verification & Report Generation (PDF)
6. **Phase 8:** Home Collection
7. **Phase 9-10:** Inventory, Suppliers, Purchases, Expenses, Analytics
8. **Phase 11-14:** Mobile UX refinement, PWA setup, Testing, Final QA

## Roles
- `OWNER`, `ADMIN` (Full Access)
- `RECEPTIONIST` (Patient, Orders, Billing, Payments)
- `TECHNICIAN` (Samples, Processing, Results)
- `PHLEBOTOMIST` (Home collection, Sample collection)
- `PATHOLOGIST` / `RADIOLOGIST` / `REPORT_VERIFIER` (Results, Verification, Reports)
- `ACCOUNTANT` (Payments, Expenses, Financial Reports)
- `VIEWER`

## Mobile-first & PWA
- Bottom navigation layout, touch-friendly interfaces, responsive design targeted at 360px+ widths.
- Fully installable PWA via Google Chrome with manifest and offline support for specific read-only states.

## Security & Data Integrity
- Tenant-isolated MongoDB documents.
- Backend-enforced calculations (pricing, taxes) and state changes (report verification).
