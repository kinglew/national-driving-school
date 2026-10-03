# National Driving School

Clean rebuild of the Montréal Class 5 driving-school preview site (École de conduite National).

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- React Router
- Zustand (client-only student desk / preview payments)

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Notes

- Sample prices and preview payments stay in the browser (localStorage). Nothing is charged.
- EN/FR toggle covers UI copy and course text.
- No Grok App Builder chrome.

## Database

Neon Postgres, server-only. Copy `.env.example` and set `DATABASE_URL` locally or in Vercel. Do not commit it.

```bash
npm run db:migrate
```

`GET /api/health` returns `unconfigured` until that variable is set. It does not create tables. There is no Neon project wired in this repo.

## Privacy

`/privacy` is a bilingual Law 25 draft for the school to review. It is not the policy.

## Workflow

Product notes live in `docs/plans`. Features go through OpenSpec (`openspec/`) before code. See `AGENTS.md`.
