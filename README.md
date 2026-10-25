# Sewing Ecommerce

Persian-first, mobile-responsive sewing shop: guest browsing, customer cart/checkout, admin panel, card-to-card payment, and a provider-neutral online gateway and SMS layer (fake/log providers until paid accounts exist).

## Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 22 standalone + Tailwind CSS v4 + Spartan UI primitives; TanStack Query (server state), SignalStore (session), Signal Forms |
| Backend | NestJS 11 + Prisma 7 + PostgreSQL (`backend/`) |
| Auth | JWT (access + refresh) |
| Deploy | Docker image + Postgres + Caddy (automatic HTTPS) |

## Quick start

Requires Node ≥ 22 and a running PostgreSQL with a `sewing_ecommerce` database.

```bash
npm install
npm run prisma:migrate && npm run prisma:seed   # first time only
npm run dev                                     # frontend :4200 + backend :3000 (Swagger at /docs)
```

`npm run dev` proxies `/api` and `/uploads` to `localhost:3000`. Online payment is off unless `PAYMENT_PROVIDER` is set in `.env`; `PAYMENT_PROVIDER=fake` enables a local Pay / Fail page (no money moves) and is refused under `NODE_ENV=production`. Card-to-card is always available.

## Scripts

| Command | Action |
|---|---|
| `npm start` | Frontend dev server (`:4200`) |
| `npm run start:backend` | Backend dev server (`:3000`) |
| `npm run dev` | Both together |
| `npm run build` | Production build (backend, then frontend) |
| `npm run lint` | ESLint over `frontend/`, `backend/`, `shared/` |
| `npm run format` | Prettier |
| `npm test` | Backend + frontend unit tests |
| `npm run test:backend` | Backend Jest + supertest specs (needs `DATABASE_URL_TEST` in `.env`, a Postgres database separate from `DATABASE_URL`) |
| `npm run test:backend:coverage` | Same, with a coverage report in `coverage/backend` |
| `npm run test:frontend` | Frontend Vitest specs (`frontend/tests/`), run through `ng test` |
| `npm run test:e2e` | Builds the app, then runs the Playwright journeys in `e2e/` in English and Persian against `DATABASE_URL_TEST` (first run: `npx playwright install chromium`; set `E2E_CHROMIUM_PATH` to use an installed Chromium) |
| `npm run prisma:migrate` / `prisma:generate` / `prisma:seed` / `prisma:studio` | Database tooling |

## Production (Docker)

One image serves the API, `/uploads` and the built Angular app on one port.

```bash
cp .env.production.example .env.production   # fill in real secrets (never committed)
docker compose --env-file .env.production up -d --build
docker compose --env-file .env.production run --rm app npx prisma db seed   # first run only: creates the admin
```

Migrations apply on every container start. The `caddy` service serves HTTPS for `DOMAIN` and renews the certificate itself: point DNS at the server and open ports 80/443 before the first `up`. The app binds only to `127.0.0.1:3000`. Demo data is skipped when `NODE_ENV=production` (force with `SEED_DEMO=true`).

## Project structure

```
frontend/src/app/
├── core/        # guards, interceptors, API service
├── auth/        # auth feature
├── features/    # <feature>/{pages,query,mutation,store,forms,models,services}
├── i18n/        # en.json + fa.json (Persian RTL)
└── shared/      # app-* component library, pipes, services
backend/         # NestJS + Prisma
shared/          # types and consts used by both halves
```

## Status and roadmap

SMS: set `SMS_PROVIDER=kavenegar` with `KAVENEGAR_API_KEY` and `KAVENEGAR_SENDER` for real messages (`log` only logs; unset sends nothing).

Core shop, admin panel and Docker packaging are done. Remaining work — cleanup, i18n review, real SMS, real payment gateway, PWA, deploy — is tracked in [PLAN.md](PLAN.md). The generated API reference is Swagger at `/docs`.
