# PRD 01 — Student system of record

Input to OpenSpec. Do not implement from this file. Depends on PRD 00. Real identity columns wait until backup/export and access control are in the same change (or an earlier one).

Replace the Zustand + `localStorage` demo as the source of truth. Keep the current desk and office screens, pointed at the server.

## Data model (minimum)

- `students` — identity, language, contact, SAAQ-related IDs if the school needs them, consent timestamps
- `enrolments` — program or course, start date, status
- `phases` / `milestones` — 28/28/56/56-day Class 5 structure; attestation and learner-licence date
- `lessons` — theory vs in-car, instructor, vehicle, duration, location, notes, signatures
- `attendance` / progress against 24h theory + 15h road
- `staff` / `instructors` — explicit roles
- `audit_log` — who changed what (Law 25 and disputes)

Invoices, payments, and receipts are PRD 02. The ledger tables may be sketched here only if a later money change owns their behaviour. Do not store card numbers.

## Product surfaces

- **Student portal** (today’s Desk): upcoming lessons, balance, invoices and receipts, phase progress. A student sees only their own rows.
- **Front office** (today’s Office): enrol, take payment, assign lessons, print or email a receipt.
- **Instructor view (light):** today’s lessons, mark complete, notes. Phone-friendly.

## Auth

Magic-link email for students. Password or magic-link for staff. Not Supabase Auth. Staff roles are explicit (office, instructor, student). No service-role key in the browser.

## Privacy

Consent before the record is used for a new purpose. Purpose limitation. Access and deletion requests from the privacy notice. Retention schedule is owned with PRD 05’s compliance notes but must exist before go-live: financial records kept for the tax period the school’s advisor confirms; marketing leads shorter.

## Exit

A real student can enrol, see their journey, and staff can update lessons without a spreadsheet. `localStorage` is no longer the source of truth.
