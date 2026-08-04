# Tailor Ecommerce

Persian-first, mobile-responsive tailor shop ecommerce website with guest browsing, customer cart/checkout, and an admin panel for full management. Card-to-card payment (Zarinpal in Phase 8) and SMS notifications (Phase 8) planned.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19 standalone + Tailwind CSS + NgRx SignalStore |
| Backend | NestJS + Prisma + PostgreSQL (in `backend/`) |
| Auth | JWT (access + refresh) |
| Styling | Tailwind CSS + tailwindcss-rtl (RTL ready) |
| Testing | Jest |

## Quick Start

```bash
npm install            # frontend deps
npm run dev            # both servers: frontend on localhost:4200 + backend on localhost:3000
```

Backend requires Node 22 (see `.nvmrc`) and a running PostgreSQL with a `sewing_ecommerce` database. First-time setup:

```bash
cd backend
npm install
npm run prisma:migrate && npm run prisma:seed
npm run start:dev      # API on localhost:3000, Swagger at /docs
```

`npm run dev` proxies `/api` and `/uploads` from the Angular dev server to `localhost:3000`.

## Available Scripts

| Command | Action |
|---|---|
| `npm start` | Frontend dev server on `localhost:4200` |
| `npm run start:backend` | Backend dev server (`backend/`) on `localhost:3000` |
| `npm run dev` | Run frontend + backend together (concurrently) |
| `npm run build` | Production build |
| `npm run lint` | ESLint — checks `src/**/*.ts`, `tests/**/*.ts` |
| `npm run format` | Prettier — writes `src`, `tests` |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode |
| `npm run test:cov` | Coverage report |

Test files live in `tests/`, mirroring the `src/` directory structure. They import source files via relative paths.

## Project Structure

```
src/app/
├── main.ts / app.ts / main.route.ts
├── core/                 # Guards, interceptors, API service
├── features/             # Feature modules (auth, home, ...)
│   ├── <feature>/pages/  # Routed page components
│   ├── <feature>/store/  # SignalStore state
│   ├── <feature>/forms/  # Reactive form services
│   ├── <feature>/models/ # Feature models/interfaces
│   └── <feature>/services/
├── i18n/                 # en.json + fa.json (Persian RTL)
└── shared/               # Custom element library, pipes, services
backend/                  # NestJS + Prisma backend
```

## Current Progress

- **Phase 0 — Backend Foundation**: in progress (`backend/`)
- **Phase 1 — Auth Frontend + Layout**: done (login, register, profile, guards, interceptor, navbar/footer, AuthStore)

Full roadmap, database schema, API endpoints, and implementation phases: see `PLAN.md`.
