# Tailor Ecommerce — AGENTS.md

> General conventions (naming, styling, components, forms, i18n, state management, custom elements, modern Angular syntax, DRY, etc.) are in `~/.config/opencode/AGENTS.md`. This file only contains project-specific details.

## Overview

Persian-first, mobile-responsive tailor shop ecommerce website with guest browsing, customer cart/checkout, admin panel for full management, card-to-card payment (Zarinpal in Phase 8), and SMS notifications (Phase 8).

## Quick commands

| Command | Action |
|---|---|
| `npm start` | Frontend dev server on `localhost:4200` |
| `npm run start:backend` | Backend dev server (`backend/`) on `localhost:3000` |
| `npm run dev` | Frontend + backend together (concurrently) |
| `npm run build` | Production build |
| `npm run lint` | ESLint — checks `src/**/*.ts`, `tests/**/*.ts` |
| `npm run format` | Prettier — writes `src`, `tests` |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode |
| `npm run test:cov` | Coverage report |

Backend commands run from `backend/` (`npm --prefix backend run <script>` from root): `start:dev`, `build`, `lint`, `prisma:migrate`, `prisma:seed`, `prisma:generate`, `prisma:studio`.

**Node version:** backend requires Node ≥ 22 (`.nvmrc`). Frontend works with Node 18.19+ / 20.11+ / 22+.

Test files live in `tests/`, mirroring the `src/` directory structure. They import source files via relative paths.

## Architecture

- **Frontend**: Angular 19 standalone (no `NgModule`). Uses `bootstrapApplication` with `provideHttpClient()` and `provideRouter()`.
- **Backend**: NestJS + Prisma + PostgreSQL, in `backend/` (same repo).
- **Styling**: Tailwind CSS with custom design tokens in `tailwind.config.js`. No CSS/SCSS in components.
- **i18n**: English (`en`) and Persian (`fa`, RTL). Translation files in `src/app/i18n/`.
- **Dark mode**: ThemeService with signal-based state, persists to localStorage.
- **State management**: `@ngrx/signals` (`signalStore`) for feature state.
- **Testing**: Jest with `jest-preset-angular`. Zoneless test environment.

> Full detail (stack, DB schema, API endpoints, routes, workflows, i18n keys, technical decisions, day-by-day) is in `PLAN.md`.

## Current Progress

- **Phase 0 — Backend Foundation** — done (NestJS 11 + Prisma 7 + PostgreSQL in `backend/`: auth, upload, Swagger)
- **Phase 1 — Auth Frontend + Layout** — done (guards, interceptor, navbar/footer, login/register, AuthStore, profile)
- **Phase 2 — Products + Categories** — next

Phase checklists live in **`PLAN.md` §8** — update them there, never duplicate here.
