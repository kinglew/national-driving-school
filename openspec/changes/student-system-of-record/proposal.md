# Proposal

## Why

Student files still live in the browser (`localStorage`). The database only has a `students` stub with no identity, and nothing stops a later change from adding names before backup and access control exist. Real enrolment has to move to the server under Quebec Law 25, without pulling in payments, email delivery, or scheduling.

## What Changes

- Add access-control tables (explicit `office`, `instructor`, and `student` roles, sessions, and magic-link challenges) and a `record_exports` log **before** any student identity column.
- Add a retention-policy table whose durations stay unset until the school confirms them.
- Extend `students` with identity, contact, consent, and deletion-request columns only after those tables, plus enrolments, the 28/28/56/56-day phases, milestones, lessons, attendance, and an audit log.
- Serve those records from server-only parameterized queries. Students read only their own rows. Office staff enrol and export. Instructors see and update only assigned lessons.
- Point the desk, front office, and registration screens at that API for the records this phase owns. Stop using browser storage as the student file.
- **BREAKING:** the preview students stored in the browser are no longer the file. Card capture on registration is removed so a card number is never kept.
- Magic-link **delivery** is a stub: the server stores only a hash and does not send mail or return a token.

## Capabilities

### New Capabilities

- `record-export`: Office-only JSON backup and access-request export, recorded before it is returned, with no session secrets.
- `staff-access`: Explicit roles, server-side session checks, and a magic-link challenge that is not delivered in this phase.
- `student-records`: Consent-gated identity, enrolments, Class 5 phases, lessons, attendance against 24h theory and 15h road, and an audit log.

### Modified Capabilities

- None. `openspec/specs/` has no synced requirements yet. This change does not edit the `foundations-neon` deltas.

## Impact

- New migration `db/migrations/002_student_system_of_record.sql`, applied after `001_foundations` and recorded in `schema_migrations`.
- New `server` handlers and `/api/*` routes for session, students, lessons, attendance, phases, milestones, and export.
- Desk, office, registration, and invoice screens. `DATABASE_URL` stays server-only.
- No new npm dependency.

## Out of scope

- Invoices, receipts, balances, Stripe, Interac, cash, and any card number.
- Resend or any other email send. Magic-link mail is not delivered.
- Calendars, vehicles as a fleet, and student self-booking.
- Leads, contracts, SEO, and teaching-note products.
- Inventing retention lengths, GST/QST numbers, or a public password.
- Supabase Auth, row-level security as a substitute for the server checks, and a service-role key in the browser.
