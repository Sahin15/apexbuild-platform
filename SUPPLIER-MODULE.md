# ApexBuild Material Supplier Module Architecture

## Overview
ApexBuild is a multi-vertical platform. The Material Supplier vertical is a completely isolated product experience designed for building material suppliers, hardware stores, and construction material traders. It is separated from the Contractor vertical at the application and data levels using Organization-based multi-tenancy.

## Architecture

### 1. Data Isolation (Multi-Tenancy)
- All records belong to a specific `organizationId`.
- The `Organization` model has a `businessType` field (`CONTRACTOR`, `MATERIAL_SUPPLIER`).
- Users are assigned to an Organization and inherit its `businessType`.
- APIs enforce `organizationId` in every query.

### 2. Roles & Permissions
Supplier-specific roles added to the global User model:
- `OWNER`, `ADMIN` (Full access)
- `SALES` (Manage quotations, orders, customers, invoices)
- `PURCHASE` (Manage suppliers, purchases)
- `STORE_MANAGER` (Manage inventory, deliveries)
- `DELIVERY` (Manage deliveries)
- `ACCOUNTANT` (Manage payments, expenses, reports)
- `VIEWER` (Read-only access)

### 3. Backend Routes
Namespace: `/api/v1/supplier/...`
- `/dashboard`
- `/customers`
- `/suppliers`
- `/products`
- `/inventory`
- `/purchases`
- `/quotations`
- `/orders`
- `/deliveries`
- `/invoices`
- `/payments`
- `/expenses`
- `/reports`

### 4. Frontend Architecture
Namespace: `/supplier/*`
- A separate Layout wrapper (`SupplierLayout`) with a supplier-specific sidebar.
- Routes are protected and accessible only if `organization.businessType === 'MATERIAL_SUPPLIER'`.
- All pages are stored in `src/pages/supplier/`.

## Workflows

### Inventory Flow
1. **Purchase**: Creating a confirmed Purchase automatically increments stock in Inventory.
2. **Delivery**: Fulfilling an Order via Delivery automatically decrements stock.
3. **Manual Adjustment**: Directly editing inventory creates a logged adjustment movement.

### Financial Ledger Flow
1. **Customer Due**: When an Invoice is created, customer due increases. When a Customer Payment is received, the due decreases.
2. **Supplier Payable**: When a Purchase is confirmed, supplier payable increases. When a Supplier Payment is made, payable decreases.
3. **Profitability**: Profit = (Paid Invoices) - (Paid Purchases + Expenses) (or calculated via COGS depending on accounting method).

## Database Models

- `SupplierCustomer`
- `SupplierVendor` (Supplier's supplier)
- `SupplierProduct`
- `SupplierInventory`
- `SupplierInventoryLedger`
- `SupplierPurchase`
- `SupplierQuotation`
- `SupplierOrder`
- `SupplierDelivery`
- `SupplierInvoice`
- `SupplierPayment`
- `SupplierExpense`

All prefix `Supplier` is used internally in MongoDB to prevent clashes with Contractor models (like Expense, Invoice) if they exist, or they are placed in a `supplier/` directory.
