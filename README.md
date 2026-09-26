# Spendwise

A modern, mobile-first personal expense tracker with a daily budget — a rebuild of an AppSheet app.

## Features

- **Quick add** — log an expense as it happens: amount, category, optional note, and date (defaults to today).
- **Daily history** — expenses grouped by day with a total for each day, browsable month by month. Tap any entry to edit or delete it (with undo).
- **Budgets** — set a monthly budget and see:
  - **Daily budget**: monthly budget ÷ days in the month
  - **Left today**: what you can still spend today
  - **Adjusted daily**: what's left for the month (as of the start of today) ÷ days remaining, so overspending earlier in the month lowers your allowance, and underspending raises it
  - **Remaining for the month** with a progress bar
- **Light & dark mode**, installable to your home screen (PWA manifest).
- **Backup** — export/import all data as JSON from the Budget tab.

Data is stored locally in the browser (`localStorage`), so nothing leaves your device. Use export/import to move data between devices.

## Development

```bash
npm install
npm run dev       # start dev server
npm test          # run unit tests
npm run build     # typecheck + production build into dist/
```

The build uses relative paths, so `dist/` can be hosted on any static host (GitHub Pages, Netlify, Vercel, etc.).
