# Sewing Ecommerce — Plan

Persian-first, mobile-responsive sewing shop for real customers: guest browsing, customer cart/checkout, admin panel, card-to-card payment, online gateway and SMS notifications.

Sources of truth: database → `backend/prisma/schema.prisma`; API → Swagger at `/docs`; routes → `frontend/src/app/main.route.ts`; conventions → `AGENTS.md`; run/deploy commands → `README.md`.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 22 (standalone, zoneless) + Tailwind v4 + Spartan headless primitives; TanStack Query for server state, SignalStore for session state, Signal Forms |
| Backend | NestJS 11 + Prisma 7 + PostgreSQL |
| Auth | JWT: 15 min access token + 7 day refresh token |
| Payment | Card-to-card (always on) + provider-neutral `PaymentGateway` interface |
| SMS | Provider-neutral `SmsProvider` interface |
| Deploy | Single Docker image + Postgres + Caddy (automatic HTTPS) |

## Status

Done: backend, auth, catalog, cart/checkout, orders, portfolio/contact, admin panel (dashboard, customers, settings), TanStack Query + Signal Forms migration, SEO, loading/error/empty states, responsive audit, Docker + Caddy packaging, fake payment gateway, log-based SMS, 24h auto-cancel of unpaid online orders, rate limiting, helmet, upload limits, translated API errors, automated tests (Jest, Vitest, Playwright, CI, coverage), Kavenegar SMS provider (code and env docs).

Not yet done: everything below. Order of work (set 2026-10-21): cleanup → i18n → tests → real SMS → real gateway → PWA → deploy. Finish and verify each phase before starting the next.

Why this order:
- Cleanup first, so tests are not written for code about to be deleted.
- i18n before tests, so assertions on Persian text are not rewritten after wording changes.
- Tests before paid services, so the integrations land on a safety net.
- PWA after the paid integrations, because the service worker must never cache payment, auth or order responses. Installability can only be fully verified over HTTPS.
- The real gateway callback needs a public HTTPS URL, so use a staging deploy or tunnel in Phase 13.

## Phase 9 — Cleanup — almost done
Behavior must not change; lint and build stay green after every slice. Done: `knip` inventory, unused files/exports/types/dependencies/i18n keys, shared stock-restore helper and phone/name form rules. No unused Prisma fields exist.
- [ ] Manual pass over the pages touched by this phase (login, register, profile, contact, address form, order cancel) before moving on

## Phase 10 — Finish i18n — TODO
- [ ] Review `fa.json` wording page by page (one term per concept); native speaker signs off
- [ ] Persian digits, Jalali dates and currency formatting consistent on customer and admin pages
- [ ] Native speaker reviews SMS texts (sent to real customers)
- [ ] Lint + build + manual pass in both languages

## Phase 12 — Real SMS provider (paid) — code done, needs real-SMS verification
Needs a provider account (e.g. Kavenegar), API key, sender line, approved templates.
- [ ] Verify with one real SMS to the owner
- [ ] Optional: sent-SMS log table, low-balance warning

## Phase 13 — Real bank gateway (paid) — TODO
Needs a verified merchant account (e.g. Zarinpal) and a public HTTPS callback URL.
- [ ] Confirm amount unit (Toman vs Rial) and callback rules
- [ ] Implement the gateway behind `PaymentGateway` (`request` + `verify`), selected by `PAYMENT_PROVIDER`; `fake` stays refused in production
- [ ] Tests with the API mocked (success, failure, user cancel, verify mismatch, already-verified callback)
- [ ] Verify in the gateway sandbox, then one small real payment
- [ ] Write the owner's refund/dispute procedure (refund in gateway panel, mark order refunded in admin)
- [ ] Document env vars in `.env.production.example` and `README.md`

## Phase 14 — PWA — TODO
- [ ] Angular service worker + web manifest (fa name, `dir: rtl`, theme colors, `display: standalone`), icons (192/512, maskable, Apple touch)
- [ ] Cache the app shell, hashed assets, capped images/fonts; **`/api` is network-only** (auth, cart, orders, payment, admin never cached); service worker file stays `no-cache` in Nest static config and `Caddyfile`
- [ ] Offline fallback page and indicator; checkout/payment require a connection
- [ ] New-version prompt so a deploy never strands users on a stale shell
- [ ] Install button where `beforeinstallprompt` exists, iOS "Add to Home Screen" hint
- [ ] Verify on HTTPS staging: Lighthouse installability, Android + iOS install, offline, update after redeploy; Playwright check that `/api` is not served from cache

## Phase 15 — Deploy + launch — TODO
- [ ] Production env complete (`DOMAIN`, JWT secrets, `SEED_ADMIN_PASSWORD`, SMS and gateway keys); demo seed off; default admin password changed
- [ ] Owner deploys: DNS A record → server, open 80/443, `up -d --build`, seed admin once
- [ ] Daily Postgres backup and `/uploads` backup, with a tested restore
- [ ] Monitoring: restart policy, uptime check, log rotation
- [ ] Production smoke test: register, card-to-card and online order, SMS received, admin confirms, small real payment, PWA installs
- [ ] Rollback plan: previous image tag and DB restore steps

## Business rules to preserve

- **Roles**: Guest browses public pages; Customer (`CUSTOMER`) has cart, checkout, orders, addresses, profile; Admin (`ADMIN`) manages everything under `/admin`. Client guards are UX only; the backend guards enforce.
- **Add to cart as guest**: redirect to `/login?returnUrl=…&autoAdd=1&variantId=…`; after login the product page adds the item and clears the params.
- **Checkout**: address → shipping (POST/COURIER, rate read server-side from settings) → payment (card-to-card default, online only if `/api/payment/methods` offers it) → review. Order creation is one transaction: snapshot items and address, decrement stock, clear cart. `total = subtotal + shippingAmount`.
- **Card-to-card**: order is PENDING/PENDING → customer transfers and uploads receipt → admin confirms (order auto-advances to CONFIRMED, paymentStatus PAID) or rejects.
- **Order lifecycle**: `PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`; `PENDING` and `CONFIRMED` can go to `CANCELLED`. `DELIVERED` and `CANCELLED` are terminal. Enforced by `STATUS_TRANSITIONS` in `backend/src/orders/orders.service.ts`; the admin UI mirrors the map, so change both together. Cancelling restores variant stock; customers may cancel only while PENDING/CONFIRMED.
- **Online payment**: unpaid online orders auto-cancel after 24h (stock restored, SMS sent). The gateway callback is verified server-side.
- **Auth**: on 401 the frontend refreshes automatically; if refresh fails it logs out and redirects to `/login`. Refresh tokens are stateless (separate secret, no rotation or revocation); a stolen token stays valid until expiry — revisit before launch if the risk is not acceptable.

## Key technical decisions

| Decision | Choice | Why |
|---|---|---|
| Repo layout | Single-package monorepo, shared code in `shared/` | One toolchain, API contract compiles on both sides |
| Server vs client state | TanStack Query for server data; SignalStore only for `AuthStore` | Caching and invalidation without hand-written loading/refetch code |
| Cart | Server-side (PostgreSQL) | Survives devices; stock rules cannot be bypassed client-side |
| Money | `Decimal` serialized as strings at the API edge | No float precision loss |
| Validation | Global `ValidationPipe({ whitelist, transform })` | Blocks mass assignment (e.g. injecting `role`) |
| Order history | Items and shipping address are snapshotted on the order | Later product/address edits never rewrite past orders |
| Slugs | Persian → Latin transliteration, UUID fallback | Readable URLs |
| UI primitives | `app-*` components wrapping Spartan headless primitives, styled with Tailwind; no Angular Material | Accessibility without a styled library |
| About text / shop details | About copy is static i18n; phone, address, hours, bank card are admin-editable in Settings | Owner's decision |
