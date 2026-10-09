# Subscription Business Logic

## 1. Subscription States
- **PENDING_APPROVAL**: New registration, waiting for Super Admin to approve.
- **PENDING_PAYMENT**: Approved, invoice generated, waiting for manual payment submission.
- **ACTIVE**: Paid and active.
- **PAYMENT_DUE**: Billing cycle ended, payment is expected.
- **GRACE_PERIOD**: Payment is overdue but within the allowed grace period (e.g., 7 days). Functionality remains normal.
- **RESTRICTED**: Grace period ended without payment. Only essential read-only access and billing page are accessible.
- **SUSPENDED**: Severely overdue or manually suspended. No business operations allowed.
- **CANCELLED**: Subscription permanently ended.
- **EXPIRED**: Fixed-term subscription ended.

## 2. Plan Changes & Upgrades
- Plans are OS-specific. A change in plan creates an audit log and modifies the Subscription's `osPlanId`.
- The new price takes effect immediately for the next invoice. Historical invoices are untouched.
- Custom pricing can be applied to a subscription via the `customPrice` field.

## 3. Account-Level vs OS-Level Suspension
- **OS-Level**: Default behavior. If Contractor OS is overdue, only Contractor OS becomes `RESTRICTED`.
- **Account-Level**: Super Admin manually places the entire Business Account `ON_HOLD` or `SUSPENDED`, which halts all subscriptions.
