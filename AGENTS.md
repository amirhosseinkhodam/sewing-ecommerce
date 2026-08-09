# Tailor Ecommerce — AGENTS.md

> General conventions (naming, styling, components, forms, i18n, state management, custom elements, modern Angular syntax, DRY, etc.) are in `~/.config/opencode/AGENTS.md`. This file only contains project-specific details.

## Overview

Persian-first, mobile-responsive tailor shop ecommerce website with guest browsing, customer cart/checkout, admin panel for full management, card-to-card payment (Zarinpal in Phase 8), and SMS notifications (Phase 8).

## Quick commands

| Command | Action |
|---|---|
| `npm start` | Frontend dev server on `localhost:4200` |
| `npm run start:backend` | Backend dev server on `localhost:3000` |
| `npm run dev` | Frontend + backend together (concurrently) |
| `npm run build` | Production build (backend then frontend) |
| `npm run lint` | ESLint — checks `frontend/src/**/*.ts` `backend/src/**/*.ts` |
| `npm run format` | Prettier — writes both halves |

All backend commands run from the root (single `package.json`): `npm run prisma:migrate`, `npm run prisma:seed`, `npm run prisma:generate`, `npm run prisma:studio`.

**Node version:** Node ≥ 22 for the whole repo (`.nvmrc`).

## Architecture

- **Frontend**: Angular 19 standalone (no `NgModule`). Uses `bootstrapApplication` with `provideHttpClient()` and `provideRouter()`.
- **Backend**: NestJS + Prisma + PostgreSQL, in `backend/` (same repo).
- **Shared**: Cross-half code lives in `shared/` (types, models), importable via `@shared/*`.
- **Styling**: Tailwind CSS with custom design tokens in `tailwind.config.js`. No CSS/SCSS in components.
- **i18n**: English (`en`) and Persian (`fa`, RTL). Translation files in `frontend/src/app/i18n/`.
- **Dark mode**: ThemeService with signal-based state, persists to localStorage.
- **State management**: `@ngrx/signals` (`signalStore`) for feature state.

> Full detail (stack, DB schema, API endpoints, routes, workflows, i18n keys, technical decisions, day-by-day) is in `PLAN.md`.

## Code Guide — how the code is organized

### Entry points

- **Frontend `frontend/src/main.ts`** — `bootstrapApplication(AppComponent, ...)` wires `provideRouter` (routes from `frontend/src/app/main.route.ts`), `provideHttpClient`, `provideAnimationsAsync`, and `ThemeService`.
- **Frontend `frontend/src/app/app.ts`** — root shell that never changes: `<app-navbar />`, `<router-outlet />`, `<app-footer />`, `<app-notification />` (global toast).
- **Frontend `frontend/src/app/main.route.ts`** — all routes, every page lazy-loaded via `loadComponent`. Implemented: `/`, `/login`, `/register`, `/profile` (`authGuard`), `**` → `/`. Full planned route map in `PLAN.md` §4.
- **Backend `backend/src/main.ts`** — NestJS bootstrap: global prefix `api`, CORS, global `ValidationPipe({ whitelist: true, transform: true })`, global `HttpExceptionFilter` (normalizes every error to `{ statusCode, message }`), Swagger at `/docs`, port `PORT ?? 3000`.

### Frontend `core/` — app-wide plumbing

- `core/services/api.service.ts` — thin typed `HttpClient` wrapper (`get/post/put/patch/delete`) prefixing `/api`. Feature services use this, never `HttpClient` directly.
- `core/interceptors/auth.interceptor.ts` — skips the refresh endpoint; attaches `Authorization: Bearer <token>`; on 401 retries once after `AuthService.refresh()`, else `auth.logout()` (clears storage, redirects home).
- `core/guards/auth.guard.ts` — `authGuard` allows if logged in else `/login`; `adminGuard` allows only when logged in **and** `role === 'ADMIN'` else `/`.

### `features/auth/` — the reference feature

Read this feature before building others; it demonstrates every project convention. Files split as `pages/`, `store/`, `services/`, `forms/`, `models/`.

**Login data flow:** `LoginPage` → `store.login(form.getRawValue())` → `AuthStore` (rxMethod + `tapResponse`) → `AuthService.login()` → `ApiService` → `POST /api/auth/login`. On success tokens + user persist to localStorage and state, then navigate to `/`.

- `store/auth.ts` — `AuthStore`, NgRx `signalStore` with `{ providedIn: 'root' }`; state `{ token, refreshToken, user, loading }` seeded from localStorage; `withHooks.onInit` re-fetches the profile when a token already exists (page refresh restores the session).
- `services/auth.ts` — `login`, `register`, `refresh`, `me`, `updateProfile`, each a typed call to `/api/auth/*`.
- `forms/login.ts`, `forms/register.ts` — form **services** (`get form()` getter, `resetForm()`), never component-local.
- `pages/*` — presentational; bind shared custom elements, use `{{ 'key' | translate }}`.

### Frontend `shared/` — reusable building blocks

- `components/` — standalone **dumb** custom elements: `app-button`, `app-input`, `app-textarea`, `app-select`, `app-card`, `app-form`, navbar, footer, notification, theme/language toggles, confirm dialog/bottom sheet. CVAs (`input`, `textarea`, `select`) work with `formControlName`. No store/service injection.
- `services/` — `ThemeService` (adds/removes `dark` class on `<html>`, localStorage), `LanguageService` (loads en/fa, sets `lang`/`dir`, `translate(key)`), `NotificationService` (signal-based toast).
- `pipes/` — `translate` (impure, re-renders on language change), `localized-date` (date-fns for Gregorian, date-fns-jalali for Persian).

### Backend `backend/src/`

- `app.module.ts` — `ConfigModule` (global, reads `.env`), `ServeStaticModule` (serves `uploads/`), `PrismaModule`, `AuthModule`, `UploadModule`, `AppController` (`GET /api/health`).
- `common/` — `prisma.service.ts` (`@Global()`, pg driver via `DATABASE_URL`, connects on init / disconnects on destroy), `JwtAuthGuard`, `RolesGuard` + `@Roles()` decorator, `@CurrentUser()` decorator, `HttpExceptionFilter`.
- `auth/` — controller (`POST /register`, `/login`, `/refresh`, `GET /me`, `PATCH /profile`); service (bcrypt, `#signTokens` issues access 15m / refresh 7d with **separate secrets** from `.env`, `#toUserResponse` strips `password`); `jwt.strategy.ts` → `request.user = { id, email, role }`; `dto/` class-validator DTOs (Iranian mobile regex `^09\d{9}$`).
- `upload/` — Multer `diskStorage` into `uploads/` with `randomUUID()` filenames; `POST /upload` and `POST /upload/multiple`.
- `backend/prisma/schema.prisma` — 11 models + enums; generated client committed in `backend/src/generated/prisma/`.

### Request path (end to end)

`Browser → Angular dev server (4200) → proxy.conf.json (/api + /uploads → 3000) → ValidationPipe + HttpExceptionFilter → controller → service → PrismaService → PostgreSQL`. Production would use a reverse proxy instead.

### Roles (access control)

- **Guest** — no account; browses everything public.
- **Customer** — logged-in `CUSTOMER`; cart, checkout, orders, addresses, profile.
- **Admin** — `ADMIN` role; manages the shop from `/admin`.

Auth is JWT: short-lived access token + 7-day refresh token. On a 401 the frontend refreshes automatically; if refresh fails the user is logged out and redirected to `/login`.

### Testing

Testing infrastructure has been removed from this project (no `tests/`, no jest config, no test scripts). If re-added, document the setup here.

## Current Progress

- **Phase 0 — Backend Foundation** — done (NestJS 11 + Prisma 7 + PostgreSQL in `backend/`: auth, upload, Swagger)
- **Phase 1 — Auth Frontend + Layout** — done (guards, interceptor, navbar/footer, login/register, AuthStore, profile)
- **Phase 2 — Products + Categories** — next

Phase checklists live in **`PLAN.md` §8** — update them there, never duplicate here.
