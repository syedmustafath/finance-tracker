# Spendwise

A modern, mobile-first personal expense tracker with a custom budget cycle — a rebuild of an AppSheet app,
installable as a PWA. Amounts are shown in BDT (৳).

## Features

- **Quick add** — log an expense as it happens: amount, category, optional note, and date (defaults to today).
- **Daily history** — expenses grouped by day with a total for each day, browsable cycle by cycle. Tap any entry
  to edit or delete it (with undo).
- **Custom budget cycle** — instead of a fixed calendar month, set the day of the month your cycle restarts
  (e.g. 25th, to match a salary date). A cycle runs from that day up to (not including) its next occurrence;
  set it to 1 for a plain calendar month. Budget math and the History tab both follow this cycle.
- **Budgets** — set a budget per cycle and see:
  - **Daily budget**: cycle budget ÷ days in the cycle
  - **Left today**: what you can still spend today
  - **Adjusted daily**: what's left for the cycle (as of the start of today) ÷ days remaining, so overspending
    earlier in the cycle lowers your allowance, and underspending raises it
  - **Remaining for the cycle** with a progress bar
- **Light & dark mode**, installable to your home screen (PWA manifest + offline-capable service worker).
- **Backup** — export/import all data as JSON from the Budget tab.

Data is stored locally in the browser (`localStorage`), so nothing leaves your device. Use export/import to move
data between devices.

## Development

```bash
npm install
npm run dev       # start dev server
npm test          # run unit tests
npm run build     # typecheck + production build into dist/
```

Deployment is configured for Vercel (`vercel.json`); the build output (`dist/`) can also be hosted on any other
static host.
