# Production PRDs

These documents are the product input for National Driving School (Montréal Class 5, about 500–1000 students a year). They are **not** permission to write feature code.

Every feature, including a bugfix that changes behaviour, goes through OpenSpec first:

1. **Propose** — `openspec` change with a proposal.
2. **Specs** — delta specs with scenarios.
3. **Implement** — only the tasks in that change.
4. **Verify** — `openspec validate --strict` and the checks named in the tasks.

Do not implement from a PRD directly. A PRD can be split across more than one change. A change must not pull in the next PRD “while we are here”.

## Stack (locked)

| Need | Choice |
|------|--------|
| Hosting | Vercel Hobby |
| Database | **Neon Postgres** (not Supabase) |
| Email | Resend (when that PRD is in an OpenSpec change) |
| Payments | Stripe fees only, plus manual Interac e-Transfer / cash / cheque in the ledger |
| Fixed cost | Domain only (~CAD $15–20/year) |

Today’s app is a Vite + React + TypeScript + Tailwind + Zustand demo. Desk, office, and invoices use `localStorage`. Nothing is charged.

## Order

| PRD | What it covers |
|-----|----------------|
| [00-foundations.md](00-foundations.md) | Domain, Law 25, environments, Neon instead of `localStorage` |
| [01-student-system-of-record.md](01-student-system-of-record.md) | Students, enrolment, lessons, staff roles |
| [02-money.md](02-money.md) | Invoices, receipts, Stripe, manual Interac/cash |
| [03-email.md](03-email.md) | Transactional email |
| [04-scheduling.md](04-scheduling.md) | Instructor and car calendars |
| [05-sme-extras.md](05-sme-extras.md) | Contracts, leads, SEO, teaching notes, hygiene |

First change: `foundations-neon` (a slice of PRD 00). Next change should be the student system of record (PRD 01), and it must include backup/export and access control before any real identity is stored.

## Still open for the owners

1. Card-first (Stripe) vs Interac-first with Stripe optional.
2. Who runs the office day to day (one clerk vs instructors).
3. Must students self-book, or is office-booked v1 enough?
4. Domain name (`nationaldrivingschool.ca` or `.qc.ca` if eligible).

Neon vs Supabase is **closed**: Neon. Auth is not Supabase Auth.
