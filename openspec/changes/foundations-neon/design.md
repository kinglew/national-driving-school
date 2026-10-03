# Design

## Context

See `proposal.md` for why. The app is a static Vite SPA on Vercel. `vercel.json` rewrites every path to `index.html`. There is no API process. PRD 00 locks Neon Postgres, not Supabase.

## Goals / Non-Goals

**Goals:**

- One server path that can run a parameterized query with `DATABASE_URL`.
- A health response a human can use to see whether the variable is missing, the database is down, or the stub schema is present.
- SQL in git that creates only `schema_migrations` and a `students` stub.
- A privacy route that follows the existing EN/FR toggle and is obviously a draft.

**Non-Goals:**

- Row-level security and staff roles (no authenticated roles yet). The server uses the Neon URL and does not expose a student query API.
- Applying migrations inside the health check.
- Reading or writing `.env.local`.

## Decisions

1. **Driver: `@neondatabase/serverless`.** It speaks HTTP, which fits Vercel serverless functions. `pg` needs a TCP socket and is a worse fit for a function that only pings. The `postgres` package is fine on a long-lived Node server but is unnecessary here.
2. **API shape: `api/health.js` plus a Vite dev middleware.** Vercel serves `api/` as functions. The SPA rewrite must exclude `/api/`. Local `vite` does not serve `api/`, so the dev server mounts the same health function. `DATABASE_URL` is read with Vite `loadEnv` on the server only and is not injected into the client bundle.
3. **Shared logic in `server/*.mjs`.** Plain ESM so the Vercel function, the Vite middleware, the migration script, and `node --test` import one implementation without a second compile step.
4. **Queries go through `sql.query(text, params)`.** No string-built SQL from request input. The health check’s SQL is constant. The migration runner’s statements come from committed files, and the migration id is a bound parameter.
5. **`students` has no name, email, phone, or licence columns.** Those arrive with PRD 01, after access control and backups. The stub proves the table and a language check constraint only.
6. **Failures return `database: "down"`.** The handler does not send the driver error to the client, because Neon errors can echo the connection target. Server logs use the error name only.
7. **Privacy copy is a draft in `src/data/privacy.ts`.** It is not legal advice and says the school must review it. It does not claim a hosting region.

## Risks / Trade-offs

- [Health check on the public internet] → It returns only `ok`, `database`, and `schemaReady`. No row counts, no host.
- [Owner role bypasses RLS later] → This change adds no policies. PRD 01 must not query with a superuser from the browser; it must add explicit roles before identity columns.
- [Vite rewrite regression] → `/api/health` is excluded by a negative lookahead. A request to `/api/health` must not return `index.html`.

## Migration Plan

1. Set `DATABASE_URL` in Vercel (Production and Preview) when a Neon project exists. Do not commit it.
2. Run `npm run db:migrate` with that variable in the environment.
3. Open `/api/health` and expect `database: "up"` and `schemaReady: true`.
4. Rollback: remove the env var. The SPA keeps working. The health check returns `unconfigured`. Dropping the stub tables is safe while they hold no people.

## Open Questions

None that change this slice. Neon region and the privacy-officer name are owner decisions recorded as blanks on the draft page.
