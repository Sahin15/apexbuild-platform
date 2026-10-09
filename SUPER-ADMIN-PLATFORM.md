# ApexBuild Super Admin Platform - Architecture & Design

## 1. Overview
The Super Admin Platform is the central control plane for ApexBuild, a multi-product Business Operating System. It manages Business Accounts (Organizations), OS Subscriptions, Plans, Payments, and overall platform administration without mixing its logic with individual OS products (Contractor, Supply, Diagnostics, etc.).

## 2. Core Entities
- **Business Account (Organization)**: The primary tenant. The entity that subscribes to one or more OS products.
- **Business Partner**: Additional details related to the customer's financial and business engagement with ApexBuild.
- **OS Product**: The distinct OS module (e.g., Contractor OS).
- **Plan**: OS-specific subscription plans (e.g., Contractor Starter, Supply Business).
- **Feature (Entitlement)**: Granular features attached to plans.
- **Subscription**: The active link between a Business Account and an OS Product on a specific Plan.
- **Invoice & Payment**: Financial records. Invoices are generated for Subscriptions/Implementation, and Payments are recorded manually (no gateway yet) and verified by admins.

## 3. Subscription & Payment Logic
- Registrations require **Super Admin Approval**.
- Once approved, an **Invoice** is generated.
- A **Payment** is submitted by the user and marked as `Payment Verification Pending`.
- An Admin verifies the payment, which marks the Invoice as `PAID` and Subscription as `ACTIVE`.
- Overdue payments trigger notifications, followed by a **Grace Period**, then **Restricted Mode** (minimum functionality like viewing invoices), and eventually **Suspended Mode**.
- Subscription status is OS-specific (e.g., Contractor OS can be active while Supply OS is restricted).

## 4. RBAC & Security
- **Platform Roles**: Added to the `User` model via `platformRole` or an expanded `role` enum (`SUPER_ADMIN`, `PLATFORM_ADMIN`, `FINANCE_ADMIN`, etc.).
- **Security Boundary**: Normal users can never access `/superadmin` routes or modify their subscriptions. Middleware functions enforce `restrictToSuperAdmin` and `requirePlanFeature`.

## 5. Middleware Enhancements
- `requireFeature(featureKey)`: Enforces feature access based on the active subscription plan.
- `checkSubscriptionAccess(osSlug)`: Verifies if the Business Account has an active/grace-period subscription for the requested OS.

## 6. Implementation Phases
Following the 23 phases, the priority is:
1. Update Models (Organizations, Users, and create Subscription/Payment models).
2. Setup Super Admin RBAC.
3. Build Business Account/Partner Management APIs.
4. Build OS Product & Plan Management APIs.
5. Build Subscription & Payment Workflows.
6. Build Frontend Dashboards (React/Vite).
