# Tasks

## 1. Server database boundary

- [x] 1.1 Add `@neondatabase/serverless` and `server/` health logic that pings with a parameterized query, and verify `node --test` covers unconfigured, up, and down without leaking errors
- [x] 1.2 Add `api/health.js` and a Vite dev middleware that call the same function, and verify a missing `DATABASE_URL` returns 503 `unconfigured`
- [x] 1.3 Point `vercel.json` SPA rewrites away from `/api/*`, and verify the rewrite source does not match `/api/health`

## 2. Schema

- [x] 2.1 Commit `db/migrations` SQL for `schema_migrations` and a `students` stub with no identity columns, and verify the file does not mention card data or student names
- [x] 2.2 Add `scripts/apply-migrations.mjs` and `npm run db:migrate` that refuse to run without `DATABASE_URL` and bind the migration id, and verify the missing-URL path exits non-zero without printing a URL
- [x] 2.3 Add `.env.example` with an empty `DATABASE_URL` and keep `.env*` ignored except that example, and verify `git check-ignore` ignores `.env.local` and does not ignore `.env.example`

## 3. Privacy draft

- [x] 3.1 Add `/privacy` in English and French with a draft banner, Law 25 topics, and no invented hosting region, and verify the route is registered before the catch-all
- [x] 3.2 Link the page from the footer in both languages, and verify the footer renders the privacy label

## 4. Check

- [x] 4.1 Run `npm run test`, `npm run build`, and `openspec validate foundations-neon --strict`, and verify all three succeed
