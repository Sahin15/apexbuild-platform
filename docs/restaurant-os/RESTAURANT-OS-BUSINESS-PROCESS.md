# ApexBuild Restaurant OS — Complete Business Process Documentation

> **Document Version:** 1.0.0  
> **Status:** Architecture & Process Specification  
> **Target System:** ApexBuild Restaurant OS (Vertical 5)  
> **Ecosystem:** ApexBuild Multi-Tenant Control Plane  

---

## 1. Executive Summary & Industry Context

ApexBuild Restaurant OS is an enterprise-grade Food and Beverage (F&B) Operating System designed for multi-format dining establishments. Unlike generic point-of-sale tools or fragmented third-party aggregators, Restaurant OS provides a unified, tenant-isolated operational control plane spanning front-of-house (FOH), kitchen production (BOH), inventory logistics, food costing, billing, and financial compliance.

### Supported Restaurant Formats
1. **Full-Service Dine-In:** Table reservations, section management, split bills, multi-course Kitchen Order Tickets (KOT), steward handoffs.
2. **Quick Service Restaurant (QSR):** High-speed counter ordering, token/buzzer queues, rapid item modifiers, drive-thru/counter pickups.
3. **Cloud & Dark Kitchens:** Channel-centric production (takeaway, direct delivery, multi-brand prep), centralized recipe assembly.
4. **Cafes & Bakeries:** Barista/station routing, batch pastry tracking, item variants with customization add-ons.
5. **Hybrid Establishments:** Operations supporting concurrent dine-in tables, curbside takeaway, and direct home delivery.

---

## 2. End-to-End Restaurant Lifecycle & Operating Workflows

```mermaid
flowchart TD
    A[Daily Opening & Float Setup] --> B[Station & Table Readiness]
    B --> C[Menu & Inventory Availability Check]
    C --> D[Active Shift Operations]
    
    subgraph Shift Operations
        D1[Order Placement: POS / Steward] --> D2[KOT Generation & Kitchen Routing]
        D2 --> D3[Kitchen Preparation & KDS Bump]
        D3 --> D4[Food Service & Expediting]
        D4 --> D5[Bill Generation & Split/Discount]
        D5 --> D6[Payment Recording & Tax Invoice]
        D6 --> D7[Automatic Ingredient Deduction]
    end
    
    D --> Shift Operations
    Shift Operations --> E[Daily Closing & Cash Count]
    E --> F[Variance Reporting & Manager Sign-off]
    F --> G[Daily P&L & Inventory Reorder Analysis]
```

---

## 3. Detailed Operational Modules

### A. Restaurant Onboarding & Tenant Configuration

1. **Business Account Registration & Approval:**
   - Restaurants register via the ApexBuild onboarding portal specifying legal entity details, trade name, FSSAI licence number, GSTIN, registered address, and primary contact.
   - Registrations land in Super Admin's `VERIFICATION_QUEUE`.
   - Upon verification and invoice payment, the tenant organization is provisioned with `businessType: 'RESTAURANT'`.

2. **Tenant Isolation Guarantees:**
   - Every dining area, table, menu category, recipe, purchase order, customer record, and cash transaction strictly carries `organizationId`.
   - Cross-tenant data leaks are physically blocked at the MongoDB query level via JWT-authenticated middleware.

3. **Restaurant Configuration Settings:**
   - **Operational Profile:** Restaurant format (Dine-in, QSR, Cloud Kitchen, Hybrid), active currency (`INR`), timezone, operating hours per weekday.
   - **Tax & Compliance Profile:** CGST (2.5%), SGST (2.5%), IGST (5%), Liquor VAT configuration, mandatory FSSAI licence printing on guest receipts.
   - **Service Charges & Packaging:** Optional discretionary service charge percentage (with guest opt-out toggle), fixed/item packaging charges for takeaway/delivery.
   - **Bill & Receipt Customization:** Custom restaurant header, logo, footer compliance notes, Wi-Fi password, UPI dynamic QR display.

---

### B. Daily Opening & Operations Dashboard

1. **Shift Initialization:**
   - Cashier or Restaurant Manager logs in and initiates the daily register shift.
   - Opens drawer with mandatory **Cash Opening Balance (Float)** entry.
   - System records drawer opening timestamp, cashier ID, and opening denomination breakdown.

2. **Operational Dashboard KPIs (Real-Time Control Center):**
   - **Sales & Volume:** Today's gross sales, net collections, paid orders, pending bills.
   - **Live Kitchen Operations:** Orders currently in `Preparing` state, overdue tickets exceeding preparation threshold (>20 mins).
   - **Floor Status:** Active occupied tables, reserved tables, dirty/cleaning tables, average table turnover duration.
   - **Inventory Watch:** Low-stock ingredients triggering minimum threshold, recipes disabled due to stockout.
   - **Cash & Settlement:** Cash collected vs UPI vs Card vs Corporate ledger balance.

---

### C. Menu, Pricing & Item Modifiers

1. **Hierarchy & Structure:**
   - **Menu Category:** Beverages, Appetizers, Mains, Breads, Desserts, Combos.
   - **Menu Item:** Name, short code, kitchen station mapping, base price, tax group, dietary indicator (`VEG`, `NON_VEG`, `EGG`, `VEGAN`).
   - **Item Variants:** Size-based pricing (e.g., *Regular*, *Medium*, *Large*).
   - **Modifier Groups:** Single-choice (e.g., Spice Level: Mild, Medium, Hot) and multi-choice add-ons (e.g., Extra Cheese, Toppings).
   
2. **Dynamic Availability:**
   - Immediate toggle: `Available`, `Unavailable`, `Temporarily 86'd` (out of stock).
   - Recipe-driven auto-lock: When a critical ingredient hits 0 in the ingredient inventory ledger, linked menu items are visually flagged.

---

### D. Table & Reservation Management

1. **Floor & Area Layout:**
   - Multi-area support: *Main Dining Hall*, *Outdoor Patio*, *Rooftop Bar*, *AC Family Room*, *Private Dining Rooms (PDR)*.
   - Table attributes: Table number, capacity (seats), area ID, active steward assignment.

2. **Table States & Lifecycle:**
   - `AVAILABLE` (Green): Clean and ready for seating.
   - `OCCUPIED` (Red/Amber): Seated with an active draft or confirmed order.
   - `BILLED` (Blue): Bill printed; awaiting cash/UPI settlement.
   - `CLEANING` (Yellow): Guests vacated; awaiting busser sanitation.
   - `RESERVED` (Purple): Booked for upcoming guest party.

3. **Table Operations:**
   - Table Transfer: Shift active order from Table 4 to Table 9 (with audit log).
   - Table Merge: Combine Table 12 and 13 for large parties, consolidating orders.
   - Split Table Seating: Seat two independent parties on large shared communal tables.

---

### E. Point of Sale (POS) & Order Workflows

1. **Channels:**
   - `DINE_IN`: Table bound, steward assigned, iterative courses/rounds.
   - `TAKEAWAY`: Customer name/phone bound, token generation, packaging fees.
   - `DELIVERY`: Address, delivery partner/driver assignment, dispatch tracking.

2. **Order State Machine:**
   ```
   [DRAFT] ──> [CONFIRMED] ──> [PREPARING] ──> [READY] ──> [SERVED/DISPATCHED] ──> [COMPLETED]
        │              │                 │              │
        └──[CANCELLED] ┴────[CANCELLED]──┴──[CANCELLED]─┘
   ```

3. **KOT (Kitchen Order Ticket) Rules:**
   - Sending an order fires KOT items to designated kitchen stations (e.g., Tandoor, Curry, Bar).
   - Running orders allow multiple KOT rounds (Round 1: Drinks & Starters, Round 2: Mains).
   - Item cancellations after KOT confirmation require mandatory manager reason code (e.g., "Guest changed mind", "Accidental punch", "Kitchen unavailable").

---

### F. Kitchen Display System (KDS) & Expediting

1. **Station Routing:**
   - Kitchen tickets filter automatically by station tag (e.g., Pantry Station only sees salads and mocktails; Main Range only sees sizzlers and curries).
2. **Color-Coded Aging:**
   - 0 – 10 minutes: Normal (Green border).
   - 10 – 20 minutes: Warning (Yellow/Amber border).
   - > 20 minutes: Delayed / Critical (Flashing Red alert).
3. **Interactive Station Actions:**
   - Click item to mark `Preparing`.
   - Click order to mark `Ready` (notifies floor captain/steward).
   - Bump bar / touch-to-dismiss when collected.

---

### G. Billing, Payments & Tax Invoicing

1. **Calculations:**
   $$\text{Subtotal} = \sum (\text{Item Price} \times \text{Quantity}) + \text{Add-ons}$$
   $$\text{Discounted Subtotal} = \text{Subtotal} - \text{Discount Amount}$$
   $$\text{CGST} = \text{Discounted Subtotal} \times 2.5\%$$
   $$\text{SGST} = \text{Discounted Subtotal} \times 2.5\%$$
   $$\text{Grand Total} = \text{Discounted Subtotal} + \text{CGST} + \text{SGST} + \text{Packaging} + \text{Service Charge}$$

2. **Payment Methods:**
   - Cash (with change returned calculation).
   - Dynamic UPI QR (with transaction reference entry).
   - Card / EDC POS.
   - Split Bill (e.g., 50% Cash + 50% UPI, or split evenly by guest count).
   - Complementary / House Account (requires Manager authorization PIN).

3. **Receipt & Audit Rules:**
   - Invoices are sequential per financial year (`INV-RT-2026-0001`).
   - Reprinting guest bill stamps `"DUPLICATE COPY"` on receipt.
   - Post-settlement voids require Manager credentials and generate negative adjustment entries rather than deleting historical invoices.

---

### H. Ingredient Inventory & Food Costing

1. **Inventory Units & Conversions:**
   - Purchase Unit (e.g., 25 kg Bag, 15 L Tin).
   - Consumption Unit (e.g., Grams, Millilitres, Pieces).
   - Automatic unit conversion factor applied on receipt.

2. **Stock Movements:**
   - Inflow: Purchase receipts from suppliers with batch and purchase price.
   - Outflow: Recipe-based order deductions, kitchen spoilage, batch expiry, staff meals.
   - Adjustments: Physical stock reconciliation discrepancies.

3. **Recipe BOM (Bill of Materials) & Costing:**
   - Every menu item has a defined recipe:
     *Example: Butter Chicken (1 Portion)*
     - Chicken Broiler Cut: 280g @ ₹0.18/g = ₹50.40
     - Butter: 30g @ ₹0.55/g = ₹16.50
     - Cream & Spices: 1 Portion @ ₹14.00 = ₹14.00
     - Makhani Gravy: 180ml @ ₹0.08/ml = ₹14.40
     - Total Food Cost = ₹95.30
     - Menu Selling Price = ₹360.00
     - **Food Cost Percentage = 26.47% | Gross Contribution Margin = 73.53%**
   - Stock deduction point: Triggered when order reaches `CONFIRMED` or `PREPARING`.

---

### I. Purchasing & Supplier Management

1. **Supplier Records:** Vendor name, contact, GSTIN, payment terms, supply categories (Meat, Dairy, Produce, Dry Grocery, Packaging).
2. **Purchase Orders & Goods Received Notes (GRN):**
   - PO creation with expected rates.
   - Physical delivery GRN verification (actual weight received vs billed weight).
   - Shortage, damage, and rejection recording at goods inward bay.
   - Stock ledger increases only upon verified GRN acceptance.

---

### J. Cash Management & Shift Handovers

1. **Register Balance Tracking:**
   $$\text{Expected Cash} = \text{Opening Float} + \text{Cash Sales} + \text{Cash Top-ups} - \text{Cash Expenses/Drops}$$
2. **Blind Drop & End-of-Shift Balancing:**
   - Cashier enters physical cash count without seeing system expected cash ("blind close").
   - System computes discrepancy ($\Delta = \text{Counted} - \text{Expected}$).
   - Discrepancy logged for manager investigation if outside acceptable tolerance ($\pm ₹50$).
   - Cash handover report printed for safe deposit.

---

## 4. Roles & Responsibilities Matrix

| Role | POS Punching | Table Assign | Discount/Void | KDS Access | Inventory & Stock | Financial Reports | Shift Close |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Restaurant Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Restaurant Manager** | ✅ | ✅ | ✅ (Authorized) | ✅ | ✅ | ✅ | ✅ |
| **Cashier / POS Operator** | ✅ | ✅ | ❌ (PIN Required) | ❌ | ❌ | Read-Only Shift | ✅ (Own Shift) |
| **Captain / Steward** | ✅ | ✅ | ❌ | Read-Only | ❌ | ❌ | ❌ |
| **Kitchen Chef / KDS** | ❌ | ❌ | ❌ | ✅ | View Kitchen Stock | ❌ | ❌ |
| **Store / Purchase Clerk**| ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Accountant** | ❌ | ❌ | ❌ | ❌ | Read-Only | ✅ | ✅ |

---

## 5. Security, Isolation & Audit Trail

1. **Immutable Financial Records:** No raw deletions of finalized invoices or cash drops. Adjustments occur through explicit credit notes or void journals.
2. **Security Sensitive Actions Requiring Audit Logs:**
   - Menu price alterations.
   - Bill discount applications > 10%.
   - KOT cancellations after kitchen acknowledgement.
   - Post-payment bill cancellations.
   - Manual inventory stock adjustments.
3. **Session & Cross-Device Protection:** Multi-terminal POS sessions bound to authorized terminal tokens, ensuring concurrent order syncing without race conditions.
