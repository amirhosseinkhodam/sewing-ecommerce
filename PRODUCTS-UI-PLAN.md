# Products Page UI Fix Plan

Status legend: [x] done, [ ] todo

1. [x] **Equal control heights** – inputs rendered 46px, selects 42px. Both now fixed at 44px (`h-11`) in `shared/components/input.ts` and `styles.scss` (`app-select`).
2. [x] **Price filters not working** – the min/max inputs never wrote typed values back to the filter signals (only `[ngModel]` one-way), so the emitted value was always empty and "clear" could not reset the DOM. The filter now listens to `inputChange`, applies on blur and Enter.
3. [x] **Thousand separators** – `app-input` gets a `thousands` flag that formats digits as `1,234,567` while typing; the filter strips separators before querying and formats values coming from the query.
4. [x] **Clear filters resets prices** – fixed by item 2 (signals now track the DOM, so resetting the query clears the fields).
5. [x] **Clear button background** – now `primary` variant with matching height.
6. [x] **Placeholder product images** – seed assigns a random `picsum.photos` image per product (idempotent via `update`); existing DB rows updated by re-running `npm run prisma:seed`.
7. [x] **Card border radius project-wide** – root cause: `tailwind.config.js` is not loaded by Tailwind v4, so `rounded-card`, `shadow-card`, etc. generated nothing. Tokens are now declared in `styles.scss` via `@theme` (`--radius-card: 0.75rem`).

Verify: `npm run lint`, `npm run build`, then check `/products` manually.
