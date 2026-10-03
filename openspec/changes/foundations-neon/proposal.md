# Proposal

## Why

The site is a Vite demo: student files live in `localStorage`, and there is no server-side database or Law 25 notice. A Neon boundary has to exist before any real student row is stored, and the browser must never see the connection string.

## What Changes

- Add a server-only health check that pings Neon when `DATABASE_URL` is set and reports `unconfigured` when it is not, without returning secrets or student rows.
- Commit a first SQL migration (`schema_migrations` + a `students` stub with no identity columns) and a script that applies it explicitly.
- Add `.env.example` with an empty `DATABASE_URL`. Ignore real env files.
- Add a bilingual draft privacy page at `/privacy` for the school to review.
- Keep `/api/*` off the SPA rewrite in `vercel.json`.
- Leave the Zustand demo on `localStorage`.

## Capabilities

### New Capabilities

- `database-boundary`: Server-only Postgres access and a health check that does not leak secrets.
- `schema-foundation`: Versioned SQL migrations and an empty `students` stub.
- `privacy-notice`: Public EN/FR Law 25 draft the school must review before it is treated as policy.

### Modified Capabilities

- None.

## Impact

- New `server/`, `api/health.js`, `db/migrations/`, `scripts/apply-migrations.mjs`, `.env.example`.
- Dependency: `@neondatabase/serverless`.
- `vercel.json` rewrite, privacy route, footer link.
- No auth, no Stripe, no Resend, no change to desk or office behaviour.

## Out of scope

- Buying or attaching a custom domain.
- Backups, dumps, and student export.
- Replacing `localStorage`, enrolment, lessons, staff roles, invoices, email, or scheduling.
- Creating a Neon project or inventing a connection string.
- Real GST/QST registration numbers.
