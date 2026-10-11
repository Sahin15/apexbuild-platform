# ApexBuild Restaurant OS — Implementation Roadmap

> **Document Version:** 1.0.0  
> **Status:** Execution Roadmap  
> **Target System:** ApexBuild Restaurant OS (Vertical 5)  
> **Phased Approach:** Incremental Delivery Strategy  

---

## 1. Roadmap Overview & Phasing Principles

To prevent feature bloat, breaking changes, and architectural drift, Restaurant OS is partitioned into disciplined, sequential phases. Each phase requires clear deliverables, automated build/test verification, and sign-off before proceeding.

```mermaid
gantt
    title ApexBuild Restaurant OS Roadmap
    dateFormat  YYYY-MM-DD
    section Foundation
    Phase 1 & 2: Audit & Business Process Docs       :done, p1, 2026-10-11, 1d
    Phase 3: Frontend Foundation & Shell Integration  :active, p2, 2026-10-11, 1d
    section Core Operations
    Phase 4: Backend Data Models & Base APIs         :p3, after p2, 3d
    Phase 5: Menu & Modifier Management              :p4, after p3, 2d
    Phase 6: Table Management & Reservations         :p5, after p4, 2d
    section Transaction Engine
    Phase 7: End-to-End POS & KOT Generation         :p6, after p5, 3d
    Phase 8: Interactive Kitchen Display System (KDS):p7, after p6, 2d
    Phase 9: Billing, Split Payments & Receipt Engine:p8, after p7, 2d
    section Supply & Compliance
    Phase 10: Ingredient Inventory & Recipe Costing  :p9, after p8, 3d
    Phase 11: Purchasing, Suppliers & GRN            :p10, after p9, 2d
    Phase 12: Shifts, Drawer Cash & Variance         :p11, after p10, 2d
    Phase 13: Financial P&L, Tax Reports & SuperAdmin:p12, after p11, 2d
```

---

## 2. Phase-by-Phase Execution Details

### Phase 1 — Platform Audit & Discovery (Completed)
- **Scope:** In-depth audit of Contractor, Supplier, Distributor, Diagnostics OS, and Super Admin control plane. Identification of reusable layout components, theme tokens, and authentication rules.
- **Verification:** Verification of working tree, production builds, and baseline dependencies.

### Phase 2 — Business Process & Architecture Documentation (Completed)
- **Scope:** Authored `RESTAURANT-OS-BUSINESS-PROCESS.md` and `RESTAURANT-OS-ARCHITECTURE.md`.
- **Deliverables:** State diagrams, operational workflows from opening to closing, role boundaries, costing formulas.

### Phase 3 — Frontend Foundation & Shell Integration (Current Phase)
- **Scope:**
  1. Add `RESTAURANT` theme configuration in `frontend/src/config/osThemes.js` with culinary amber/orange palette.
  2. Implement `RestaurantLayout.jsx` with responsive desktop sidebar, mobile bottom navigation bar, and profile modal integration.
  3. Implement `RestaurantDashboard.jsx` frontend with operational KPIs, floor overview, live order volume charts, and clearly labeled visual preview demo data.
  4. Implement `RestaurantPOS.jsx` visual preview interface optimized for touch tablets and desktops (category filters, item cards, modifiers, order basket summary).
  5. Implement `RestaurantKDS.jsx` visual preview interface for kitchen screens (station tabs, ticket cards, preparation timers, bump buttons).
  6. Register `/restaurant` routes and redirection logic in `App.jsx`, `Login.jsx`, `Register.jsx`, and Super Admin workspace links.
- **Dependencies:** None.
- **Acceptance Criteria:**
  - `npm run build` succeeds with zero errors.
  - No existing OS functionality is broken or altered.
  - All mock data is explicitly labeled as demo preview data.

### Phase 4 — Backend Data Models & Tenant Authorization
- **Scope:**
  - Create Mongoose models: `RestaurantArea`, `RestaurantTable`, `RestaurantMenuCategory`, `RestaurantMenuItem`, `RestaurantOrder`, `RestaurantBill`, `RestaurantShift`.
  - Add API router `/api/v1/restaurant/` with `protect`, `requireOrganization`, and `checkSubscriptionAccess('restaurant')`.
  - Seed baseline restaurant demo data in `backend/src/scripts/seedAllOSDemoData.js`.
- **Acceptance Criteria:**
  - All queries enforce `organizationId`.
  - Role-based permissions validate API requests.

### Phase 5 — Menu, Pricing & Modifiers Management
- **Scope:**
  - Full CRUD operations for menu categories, items, sizes, and modifier groups.
  - Image upload support for menu items.
  - Live availability toggle (`isAvailable`, `is86ed`).
- **Acceptance Criteria:**
  - Items display accurately in POS category views.
  - Price changes retain historical billing integrity.

### Phase 6 — Table Layout & Reservation Engine
- **Scope:**
  - Interactive floor plan editor by area (Indoor, Patio, Bar).
  - Real-time table status tracking (Available, Occupied, Billed, Cleaning, Reserved).
  - Table transfer and order merging capabilities.
- **Acceptance Criteria:**
  - Conflicting table seatings and overlapping reservations are strictly prevented.

### Phase 7 — POS Transaction Engine & KOT Dispatch
- **Scope:**
  - Real-time cart calculations with discounts, taxes, and service charges.
  - Multi-round KOT dispatch to kitchen stations.
  - Reason-coded cancellations for active KOT tickets.
- **Acceptance Criteria:**
  - Idempotent order submission prevents accidental double-billing.

### Phase 8 — Kitchen Display System (KDS) & Expediting
- **Scope:**
  - Real-time WebSocket or polling ticket updates.
  - Station-specific ticket routing (Tandoor, Range, Pantry, Bar).
  - Preparation timers and visual delayed ticket alerts.
- **Acceptance Criteria:**
  - Station cooks can mark items preparing or ready with immediate floor visibility.

### Phase 9 — Billing, Multi-Split Payments & Tax Invoicing
- **Scope:**
  - Sequential tax invoice generation compliant with GST requirements.
  - Split payment recording (Cash, UPI, Card, Corporate Credit).
  - Receipt printing templates using browser print stylesheets.
- **Acceptance Criteria:**
  - Auditable payment ledgers; no silent rewrites of paid invoices.

### Phase 10 — Ingredient Inventory & Recipe Food Costing
- **Scope:**
  - Ingredient directory with purchase-to-consumption unit conversions.
  - Recipe Bill of Materials (BOM) linked to menu items.
  - Automated stock deduction upon order confirmation.
  - Food cost percentage and contribution margin calculation.
- **Acceptance Criteria:**
  - Inventory movements log accurately; negative stock prevented unless permitted.

### Phase 11 — Purchasing & Supplier Management
- **Scope:**
  - Supplier directory, Purchase Orders (PO), and Goods Received Notes (GRN).
  - Inward goods acceptance with shortage and damage logging.
- **Acceptance Criteria:**
  - Stock increases only upon verified physical receipt.

### Phase 12 — Cash Drawer & Shift Handover
- **Scope:**
  - Cashier shift open/close with opening float recording.
  - Blind closing cash count and discrepancy reporting.
  - Shift summary printout for safe drops.
- **Acceptance Criteria:**
  - Discrepancies logged to manager audit trail.

### Phase 13 — Financial Reporting, Tax Compliance & Super Admin Provisioning
- **Scope:**
  - Comprehensive sales reports by channel, item, category, and hour.
  - Daily P&L report separating gross sales, food cost, and operating overheads.
  - Super Admin Restaurant OS product configuration, plan tier pricing, and feature entitlement registration.
- **Acceptance Criteria:**
  - Financial statements calculate with verified audit reconciliation.
