# PRD 05 — SME extras

Input to OpenSpec. Do not implement from this file. These are separate changes after the ledger, money, email, and a simple schedule exist. Do not bundle them into an earlier PRD.

## Operations

- Digital contracts and liability waivers (e-sign free tier, or PDF + checkbox + timestamp).
- Vehicle pre-trip checklist attached to a lesson.
- Instructor hours export (payroll hint, not a payroll system).
- Simple CRM: lead → trial evaluation → enrolled (web form, walk-in, referral).

## Marketing (still cheap)

- Google Business Profile (free, and important for local search).
- SEO pages already started (`/program`, `/courses`, `/visit`). Add an FAQ (SAAQ timelines, documents to bring).
- Ask for a review after a phase is complete (email link).
- Keep sample prices distinct from the live rate card until staff confirm prices in an admin screen.

## Teaching

- Lesson-note templates aligned to SAAQ modules.
- Student can see hours remaining toward 15 in-car and 24 theory.
- Exam-area practice packages as bookable SKUs (already in the catalog).

## Risk and compliance

- Law 25 retention schedule: keep financial records for the period the school’s tax advisor confirms (often six years in Canada); purge marketing leads sooner.
- Access control: office vs instructor vs student. 2FA for staff.
- No full card numbers. Stripe only.
- Incident process: who tells the CAI and the students if personal information is compromised. Draft with the school, not in silence.

## Tech hygiene

- Light SSR or prerender for SEO only if marketing needs it (TanStack Start or Next later, not day one).
- Structured logging and error tracking.
- A flag for “payments live” vs “preview”.

## What not to do early

- Native mobile apps (responsive web is enough).
- A custom SMS gateway.
- A full accounting suite (export CSV for the accountant later).
- Building a payment processor.
- Automating SAAQ attestation before staff have described the real workflow.

## Success metrics (whole product)

- 100% of active students have a database record with phase and hours.
- A receipt goes out within one day of payment.
- Reminder emails cover at least 95% of booked lessons.
- Monthly infra bill is about $0 plus the domain plus Stripe’s percentage.
