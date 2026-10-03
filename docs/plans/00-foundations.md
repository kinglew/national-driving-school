# PRD 00 — Foundations

**North star:** recurring spend stays about the domain only (~CAD $15–20/year). Free tiers plus pay-as-you-go. Stripe fees only when someone pays. Scale for **500–1000 students/year**, low public traffic, durable student records.

**Today:** Vite + React + TypeScript + Tailwind SPA. Catalog and copy live in code. EN/FR UI. Desk, office, and invoice are a **demo** (Zustand + `localStorage`). Hosted on Vercel Hobby. No real auth, database, email, or payments.

This PRD is an input to OpenSpec. The first change, `foundations-neon`, delivers only the database boundary, the stub schema, environment hygiene, and a draft privacy page. It does **not** retire `localStorage`, buy a domain, or turn on backups.

## Cost envelope

| Need | Choice | Notes |
|------|--------|-------|
| Domain | Purchase (only fixed cost) | Point DNS at Vercel |
| Hosting | Vercel Hobby | Fine at this traffic; watch serverless limits |
| Database | **Neon Postgres** free tier | Not Supabase. Student journey data will live here |
| Auth | Separate from the database, later | Not Supabase Auth. Decided in PRD 01 |
| Email | Resend free (3k/month) | PRD 03. Not built in foundations |
| Payments | Stripe (no monthly fee) + manual Interac / cash / cheque | PRD 02. ~2.9% + $0.30 on cards |
| Files | Cloudflare R2 free tier, later | Optional. Not Supabase Storage |
| Monitoring | Vercel Analytics free / Sentry free | Errors and uptime, when a change asks for it |
| Backups | Neon point-in-time where the free tier allows it, plus a dump export | Before any real student rows |

Avoid paid scheduling suites, a custom server, and SMS until volume forces it.

## Phase 0 work

1. **Custom domain** on Vercel + HTTPS. Owner task, not this code change.
2. **Environments.** `preview` and `production` env vars on Vercel. Never commit secrets. `DATABASE_URL` is server-only. `.env.example` holds a placeholder.
3. **Quebec compliance baseline**
   - Privacy notice and consent (Law 25): what is stored, why, retention, access and deletion.
   - Bilingual EN/FR for student-facing legal copy.
   - GST/QST on real invoices (registration numbers on receipts). The preview already prints specimen tax lines. Real numbers are an owner input before PRD 02 goes live. Do not invent them.
4. **Database boundary.** Server API + Neon Postgres. The browser never holds the connection string. `localStorage` stays the demo source until PRD 01 replaces it on purpose.
5. **Backups and export.** Nightly or scheduled dump, and a one-click student export, **before** real identity is written. Not part of `foundations-neon`.

## `foundations-neon` slice (this change)

- Server health check that pings Neon when `DATABASE_URL` is set, and says `unconfigured` when it is not, without leaking the URL.
- Committed SQL: `schema_migrations` and a `students` stub (no identity columns yet).
- Apply migrations with an explicit script. Do not migrate as a side effect of the health check.
- Draft privacy page at `/privacy`, EN and FR, marked for the school to review.
- `vercel.json` must not send `/api/*` to the SPA shell.

**Exit for this slice:** empty schema can be applied, privacy draft is on the site, deploy still serves the SPA, no production data yet.

**Exit for the whole PRD (later changes):** domain live, privacy page reviewed by the school, backups in place, demo `localStorage` no longer the source of truth.

## Architecture

```
[Vercel Hobby] Vite React app + serverless /api routes
    ↓  DATABASE_URL stays on the server
[Neon Postgres]
    ↓ later
[Stripe] payment webhooks
[Resend] transactional email
[R2] PDFs / uploads, if needed
```

## What not to do here

- Do not add Supabase (database, auth, or storage).
- Do not put a service-role key or `DATABASE_URL` in client code.
- Do not store card numbers. The preview may keep a last-4 specimen in the browser; production payments are Stripe (PRD 02).
- Do not implement enrolment, invoicing, email, or scheduling from this PRD.
