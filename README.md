# Sewing Ecommerce

Persian-first, mobile-responsive sewing shop ecommerce website with guest browsing, customer cart/checkout, and an admin panel for full management. Card-to-card payment (Zarinpal in Phase 8) and SMS notifications (Phase 8) planned.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 22 standalone + Tailwind CSS v4 + Spartan UI; TanStack Query and NgRx SignalStore during migration |
| Backend | NestJS + Prisma + PostgreSQL (in `backend/`) |
| Auth | JWT (access + refresh) |
| Styling | Tailwind CSS v4 + tailwindcss-rtl (RTL ready) |

## Quick Start

```bash
npm install            # all deps (frontend + backend)
npm run dev            # both servers: frontend on localhost:4200 + backend on localhost:3000
```

Requires Node ≥ 22 and a running PostgreSQL with a `sewing_ecommerce` database. First-time setup:

```bash
npm run prisma:migrate && npm run prisma:seed
npm run start:backend  # API on localhost:3000, Swagger at /docs
```

`npm run dev` proxies `/api` and `/uploads` from the Angular dev server to `localhost:3000`.

## Available Scripts

| Command | Action |
|---|---|
| `npm start` | Frontend dev server on `localhost:4200` |
| `npm run start:backend` | Backend dev server on `localhost:3000` |
| `npm run dev` | Run frontend + backend together (concurrently) |
| `npm run build` | Production build (backend then frontend) |
| `npm run lint` | ESLint — checks `frontend/src/**/*.ts` `backend/src/**/*.ts` |
| `npm run format` | Prettier — writes both halves |

## Project Structure

```
frontend/src/app/
├── app.ts / main.route.ts  # bootstrap is frontend/src/main.ts
├── core/                 # Guards, interceptors, API service
├── auth/                 # Auth feature (store, services, forms, pages)
├── features/             # Feature modules (home, products, ...)
│   ├── <feature>/pages/    # Routed page components
│   ├── <feature>/query/    # injectQuery factories (server reads)
│   ├── <feature>/mutation/ # injectMutation factories (server writes)
│   ├── <feature>/store/    # Client state + computed projections
│   ├── <feature>/forms/  # Signal Forms or existing Reactive Forms
│   ├── <feature>/models/ # Feature models/interfaces
│   └── <feature>/services/
├── i18n/                 # en.json + fa.json (Persian RTL)
└── shared/               # Custom element library, pipes, services (import via @shared/*)
backend/                  # NestJS + Prisma backend
shared/                   # Cross-half shared types (root, backend-importable)
```

## Current Progress

- **Phase 0 — Backend Foundation**: done (NestJS 11 + Prisma 7 + PostgreSQL in `backend/`)
- **Phase 1 — Auth Frontend + Layout**: done (login, register, profile, guards, interceptor, navbar/footer, AuthStore)
- **Phase 2 — Products + Categories**: done (public catalog + product detail with gallery/sizes, admin category/product management with image upload)
- **Phase 3 — Cart + Checkout**: done (cart/address/order backend modules; CartPage, AddressManagementPage, multi-step CheckoutPage; navbar cart badge; add-to-cart with login-return flow)
- **Phases 4–5**: done (orders, portfolio, contact)
- **Frontend migration before Phase 6**: underway; see `PLAN.md` for the remaining checklist.

Full roadmap, database schema, API endpoints, and implementation phases: see `PLAN.md`. How the system works (architecture, flows, auth, DB, decisions & why): see `PROJECT_KNOWLEDGE.md` — the canonical living knowledge guide, kept up to date automatically.
