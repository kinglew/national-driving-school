# Design

## Context

`001_foundations` created `schema_migrations` and a `students` stub (`id`, timestamps, `preferred_language`). Desk, office, and registration still persist a demo file in `localStorage`, including specimen card last-4 values. PRD 01 requires backup/export and explicit access control before identity columns. PRD 02 owns money, PRD 03 owns email, PRD 04 owns calendars.

## Goals / Non-Goals

**Goals:**

- One ordered migration: access tables, `record_exports`, retention policies, then identity, then training tables.
- Server checks for `office`, `instructor`, and `student`. Parameterized queries only.
- Desk and office use the API for those records. Browser storage is not the student file.
- An office JSON export that writes `record_exports` first.
- Audit rows for enrolment, lesson changes, attendance, milestone and phase edits, export, and deletion requests.

**Non-Goals:**

- Sending magic-link email, passwords, or a shared gate token in the repo.
- Payments, invoices as data, Stripe, or card numbers.
- Student self-booking and instructor calendars.
- Deleting rows while retention days are null.
- Moving the enquiry inbox off `localStorage`.

## Decisions

1. **Statement order in `002_student_system_of_record.sql`.** `principals`, `sessions`, `login_challenges`, `staff_members`, `record_exports`, and `retention_policies` are created first. Only then does `ALTER TABLE students` add identity and consent columns. Enrolments, phases, milestones, lessons, attendance, and `audit_log` follow. The migration runner records the id after the statements. It still splits on semicolons, so the file has no functions and no `DO` blocks.
2. **Roles live on `principals`.** `staff_members` is office or instructor only. A student principal is created in the same statement as the student row. There is no public signup.
3. **Sessions are bearer tokens.** The client keeps the raw token in `sessionStorage` only. The database stores SHA-256 hex. Logout sets `revoked_at`. Challenges expire in 30 minutes. Sessions expire in 12 hours.
4. **Magic link is a stub.** `POST /api/auth/magic-link` always returns `{ ok: true, delivery: "not_sent" }`. It does not echo a token. If the email matches an active principal, it stores a hash of a random token and discards the raw value, so nothing in this phase can deliver it. `POST /api/auth/redeem` is implemented for a later mailer, or for a hash that already exists. No email provider is called.
5. **Who can do what.** Office: enrol, list every student, assign lessons, edit phases and milestones, record attendance, export, request deletion. Instructor: list and update only lessons assigned to them, plus attendance on those lessons. Student: read their own journey and set their own signature. Everyone else: 401. Wrong role: 403. Hidden lesson: 404.
6. **Enrolment is one CTE.** Consent, guardian-if-under-18, and the program code are checked in the server before the statement. The statement inserts the principal, student, enrolment, four phases (28/28/56/56), milestone, optional first lesson, and audit rows together. A unique email violation becomes `email_in_use` with no driver text.
7. **Progress is summed minutes.** Targets are 1440 theory minutes and 900 road minutes. They are not a second table. Phase completion dates are office edits, not a guess from module checkboxes.
8. **Export shape.** `GET /api/exports/students?purpose=backup|access_request` inserts `record_exports`, then returns students, enrolments, phases, milestones, lessons, and attendance. It omits `sessions`, `login_challenges`, and any payment field. There is no card column to omit.
9. **Retention.** Three policy rows with `retain_days` null and a note that the school must confirm. Deletion sets `deletion_requested_at` only.
10. **Screens.** Registration loses the card step and posts only with an office session. Otherwise it keeps the draft in component state and explains that the office records the file. Desk and office call the API. The invoice route says receipts are not stored yet. Language and the enquiry inbox may stay in the Zustand persist key. Promo "places left" no longer counts local student rows.
11. **Failures.** Unconfigured database: 503, no query. Driver errors: log the error name only, body `database_down` or the same unconfigured style without the message. `Cache-Control: no-store` on these routes.
12. **No new secret.** This phase does not add `STAFF_GATE_TOKEN`. Until mail exists, staff sessions are created only by redeeming a challenge that was stored out of band.

13. **One student function besides health.** Vercel Hobby allows 12 serverless functions, and a root catch-all only matches one segment. `api/[...slug].js` serves one-segment routes. `vercel.json` rewrites `/api/:a/:b` to `/api/nested?a=:a&b=:b` on that same function. Public paths do not change.

## Risks / Trade-offs

- [Nobody can finish a magic link until email exists] → Redeem and the hash columns are in place. The UI says delivery is not sent. Do not invent a password to paper over it.
- [Owner role on Neon can read every row] → The browser never gets `DATABASE_URL`. Routes use the server checks above. This is not database RLS.
- [Export is a pull, not a nightly dump] → It is the backup the office can run and the access-request file. Neon point-in-time remains a console setting, not this change.
- [Enquiry inbox is still local] → It is not a student record. PRD 05 owns leads.

## Migration Plan

1. Apply `002_student_system_of_record.sql` to the Neon `main` branch.
2. Insert `002_student_system_of_record` into `schema_migrations` in that same transaction.
3. Deploy the API. `GET /api/health` stays `database: up`. `GET /api/students` without a session is 401.
4. Rollback of the app is a previous deployment. Rolling back the tables is safe only while they hold no real students; do not drop them after identity is in use.

## Open Questions

- How many days each retention purpose lasts (school advisor). Left null on purpose.
- Which real people are the first office and instructor principals. Not seeded with a password.
