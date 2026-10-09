# Payment Business Logic

## 1. Manual Payment System (No Gateway)
Because there is no automated gateway, the system relies on manual verification.

### Workflow:
1. Invoice is generated (`DRAFT` -> `ISSUED`).
2. Customer views invoice and makes payment via external method (UPI, Bank Transfer).
3. Customer submits payment details (Reference ID, Amount, Proof) via their Billing page.
4. Payment record is created with status `SUBMITTED`.
5. Super Admin sees the payment under "Payment Verifications Pending".
6. Super Admin verifies the payment.
7. Payment status becomes `VERIFIED`.
8. Invoice `paidAmount` increases. If `dueAmount` becomes 0, Invoice becomes `PAID`.
9. Corresponding Subscription is activated if it was pending or restricted.

## 2. Invoices & Receipts
- **Immutable Invoices**: Once `PAID` or partially paid, invoices should not be modified. Corrections require new adjustment invoices.
- **Receipts**: Generated upon payment verification, linking the Payment ID to the Invoice ID.

## 3. Reminders
- Reminders are sent based on `dueDate`.
- Stages: 3 Days Before, On Due Date, 3 Days Overdue, End of Grace Period.
