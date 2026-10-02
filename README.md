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
