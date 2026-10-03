# PRD 02 — Money

Input to OpenSpec. Do not implement from this file. Depends on the student system of record.

Invoices, receipts, and payments for a Québec Class 5 school. Stripe has no monthly fee; card fees apply only when a card is used. Interac e-Transfer, cash, and cheque stay in the same ledger so the books are complete.

## Invoicing

- Numbered invoices (`NDS-YYYY-####`), line items, GST and QST lines, status draft → sent → paid → void.
- The school’s GST and QST registration numbers on any document that is a real tax invoice. Until those numbers are provided, invoices stay specimens (the preview already says so).
- Server-side PDF, stored and emailed (email delivery is PRD 03).

## Receipts

- Issued when a payment succeeds. Same PDF pipeline. Bilingual EN/FR.

## Payments

- **Stripe Checkout** or Payment Element for cards. Webhooks mark the invoice paid, send the receipt, and update the balance.
- **Manual methods:** Interac e-Transfer, cash, and cheque, recorded by staff. Do not pretend they were card charges.
- Partial payments and packages (PESR, brush-up, evaluation) match the catalog.
- Refunds and credits with an audit trail.

## Hard rules

- Do not store card numbers, CVC, or full PAN. Stripe holds card data.
- The preview card form is not production. Remove it when this PRD’s change lands.
- Important money-record changes are audited.

## Fees

Stripe is not $0, but there is no monthly fee. Interac avoids card fees when students pay that way.

## Exit

The office can take a card or mark Interac, cash, or cheque. The student gets an email and a PDF. The books reconcile.
