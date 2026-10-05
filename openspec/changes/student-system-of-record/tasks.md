# Tasks

## 1. Export and access control before identity

- [x] 1.1 Add `db/migrations/002_student_system_of_record.sql` whose statements create `principals`, `sessions`, `login_challenges`, `staff_members`, and `record_exports` before any student identity column, and verify a text check of that order
- [x] 1.2 In that same file, add `retention_policies` with null `retain_days` before identity columns, then consent-gated student columns, enrolments, phases (28/28/56/56), milestones, lessons, attendance, and `audit_log`, and verify the file has no card, PAN, or CVC wording

## 2. Server access and records

- [x] 2.1 Add parameterized session, magic-link, and redeem handlers that never return a token hash and report `delivery: "not_sent"`, and verify tests cover unknown email, unconfigured database, and driver failures
- [x] 2.2 Add student, lesson, attendance, phase, milestone, deletion-request, and export handlers with office, instructor, and student checks, and verify a student query binds only their principal and a student export does not insert `record_exports`
- [x] 2.3 Wire `api/*` routes and the Vite dev middleware through that handler, and verify `/api/*` stays off the SPA rewrite

## 3. Screens

- [x] 3.1 Point the desk and office at the server for student files, lessons, phases, and attendance, and verify the desk does not read a browser student file
- [x] 3.2 Change registration so it does not collect a card or write a student file to `localStorage`, and verify the invoice screen does not present browser payments as the system of record

## 4. Check

- [x] 4.1 Apply the migration to Neon and record `002_student_system_of_record` once, without printing a connection string
- [x] 4.2 Run `npm run test`, `npm run lint`, `npm run build`, and `openspec validate student-system-of-record --strict`, and verify the built client bundle does not contain `DATABASE_URL` or a Neon host
