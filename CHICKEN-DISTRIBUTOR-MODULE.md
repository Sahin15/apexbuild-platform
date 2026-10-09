# CHICKEN DISTRIBUTOR MODULE
**Target Audience**: Poultry/Chicken distributors who purchase poultry from suppliers and distribute it shop-to-shop. 
**Current Workflow Context**: Target users currently manage their business using notebooks, paper, calculators, and WhatsApp. The system must be incredibly simple, fast, and optimized for minimal typing.

## 1. Business Workflow Overview
1. **Purchase**: Distributor buys poultry/chicken from a Supplier (Company) at a specific rate and weight. This generates a Purchase record, a Supplier Payable, and updates Weight-based Stock.
2. **Stock Handling**: The purchased chicken is added to the inventory. Stock is measured primarily in `KG`. All stock adjustments/variations (loading, wastage, return) are tracked in a Stock Ledger.
3. **Daily Delivery / Sales**: The distributor loads the vehicle and visits multiple shops (Customers). At each stop, they deliver a specific quantity/weight. Each shop may have a customized default selling rate, which can be overridden manually. 
4. **Payment Collection**: Distributor collects cash/UPI from Customers. This updates Customer Due / Ledger.
5. **Supplier Payment**: Distributor pays the Supplier. This updates Supplier Due / Ledger.
6. **Expenses**: Distributor incurs daily operational expenses (fuel, driver, loading, ice).
7. **Profitability**: System estimates daily operating profit by taking `Sales Revenue - Cost of Chicken Sold - Operating Expenses`.

## 2. Architecture & Data Isolation
- **Organization Boundary**: Each distributor registers as a distinct `Organization` with `businessType: "CHICKEN_DISTRIBUTOR"`. 
- **Strict Multi-Tenancy**: Every backend query and model must enforce `organizationId`. A distributor must never see data belonging to another distributor, nor should they see Material Supplier / Contractor modules.
- **Routing Namespace**: 
  - Frontend routes prefixed with `/distributor/*`
  - Backend API prefixed with `/api/v1/distributor/*`
- **UI/UX Strategy**: Large numbers, quick actions (modals), autocomplete search for customers/suppliers, minimal typing. A specific "Quick Delivery Entry" screen is prioritized for high-speed operation.

## 3. Data Models
Prefix: `Distributor`
1. **DistributorSupplier**: Information about the poultry supplier/company. Contains opening balance, ledger.
2. **DistributorCustomer**: Shop/Retailer details. Contains default selling rate, credit limit, route, opening balance, ledger.
3. **DistributorPurchase**: Records purchases from suppliers (weight, rate, amount, transport cost, payment).
4. **DistributorStockMovement**: Immutable log of every change to stock (Purchase, Delivery, Adjustment, Variance).
5. **DistributorSale** / **DistributorDelivery**: Generated when delivering to a shop. Records weight delivered, rate used, payment collected, outstanding due.
6. **DistributorCustomerPayment**: Customer payment record.
7. **DistributorSupplierPayment**: Supplier payment record.
8. **DistributorExpense**: Daily operational expenses.
9. **DistributorWeightVariance**: Records weight differences (Purchased vs Loaded vs Delivered) with reasons (handling loss, processing loss).

## 4. Permissions (RBAC)
Roles: `OWNER`, `ADMIN`, `ACCOUNTANT`, `SALES`, `DELIVERY_STAFF`, `DRIVER`, `VIEWER`
- **OWNER/ADMIN**: Full access to all modules, financial reporting, and settings.
- **ACCOUNTANT**: Access to payments, dues, ledgers, expenses, reports.
- **DRIVER/DELIVERY_STAFF**: Access limited to assigned deliveries and recording payment collections. Cannot view profit, supplier payments, or modify historical financial records.

## 5. Profit Calculation
**Strategy**: Weighted-average cost for stock.
`Estimated Profit = Total Sales Amount - (Quantity Sold * Weighted Average Purchase Cost) - Daily Expenses`
This avoids false profit numbers when purchase rates and sales rates vary on the same day.

## 6. Implementation Plan
Phase 1: Backend Architecture & Models (Namespaces, Data Isolation)
Phase 2: Master Data Management (Suppliers & Customers with rate management)
Phase 3: Core Operations (Purchases, Quick Delivery/Sales, Stock Ledger, Weight Variance)
Phase 4: Financials (Expenses, Customer/Supplier Payments, Ledgers)
Phase 5: Frontend Experience (Dashboard, UI Routes, Quick Entry Forms)
Phase 6: Reporting & Daily Summary (Profitability, Printables)
