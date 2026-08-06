# Code Guide — Tailor Ecommerce

> Beginner-friendly explanation of how the code works. Written for junior developers and less-capable agent AIs, in plain language. If you need the *product behavior* (features, user flows, screens), read `docs/features.md` instead. This file is about **how the code is organized and how it runs**.

Stack at a glance: **Angular 19** (standalone, zoneless-ready, signals) frontend + **NestJS 11** backend + **Prisma** ORM over **PostgreSQL**. Single-package monorepo: one `package.json` at root, frontend in `frontend/`, backend in `backend/`, shared code in `shared/`.

---

## 1. Entry points

### Frontend — `frontend/src/main.ts`

This is where the Angular app starts. `bootstrapApplication(AppComponent, { providers })` wires up:

- `provideRouter(routes)` — routing from `frontend/src/app/main.route.ts`
- `provideHttpClient()` — HTTP
- `provideAnimationsAsync()` — animations (used by Material dialogs/bottom sheets)
- `ThemeService` — dark mode

### Frontend — `frontend/src/app/app.ts`

The root component (`AppComponent`) is a simple shell that never changes between pages:

```
<app-navbar />        ← sticky top bar (auth-aware)
<router-outlet />     ← the current page renders here
<app-footer />
<app-notification />  ← global toast container (reads NotificationService signal)
```

### Frontend — `frontend/src/app/main.route.ts`

Defines all routes. Every page is **lazy-loaded** with `loadComponent: () => import(...)`, so each page is only downloaded when visited. Routes:

| Path | Page | Guard |
|---|---|---|
| `/` | Home | — |
| `/login` | Login | — |
| `/register` | Register | — |
| `/profile` | Profile | `authGuard` |
| `**` | → redirect to `/` | — |

The full planned route map (products, cart, checkout, orders, admin, ...) is in `PLAN.md` §4 — the routes above are the ones implemented so far.

### Backend — `backend/src/main.ts`

NestJS bootstrap:

1. Creates the `uploads/` directory if missing.
2. Creates the Nest app, sets global prefix `api` → all routes live under `/api`.
3. Enables CORS.
4. Global `ValidationPipe({ whitelist: true, transform: true })` — rejects unknown DTO fields and auto-transforms payloads.
5. Global `HttpExceptionFilter` — every error response becomes `{ statusCode, message }`.
6. Swagger at `/docs`.
7. Listens on `process.env.PORT ?? 3000`.

---

## 2. Frontend `core/` — app-wide plumbing (runs for every request/route)

- **`core/services/api.service.ts`** — a tiny generic wrapper around `HttpClient` (`get/post/put/patch/delete`), prefixing `/api`. Feature services use this instead of calling `HttpClient` directly.

- **`core/interceptors/auth.interceptor.ts`** — a *functional* interceptor. On **every HTTP request**:
  1. Skips the refresh endpoint itself (to avoid a loop).
  2. If a token exists, attaches `Authorization: Bearer <token>`.
  3. If the request **fails with 401** and we have a refresh token, it calls `AuthService.refresh()`, stores the new token pair, and **retries the original request** once with the new token.
  4. If refresh also fails → `auth.logout()` (clears storage, redirects home).

- **`core/guards/auth.guard.ts`** — route guards:
  - `authGuard` → allow if logged in, else `router.parseUrl('/login')`.
  - `adminGuard` → allow only if logged in **and** `role === 'ADMIN'`, else redirect `/`.

---

## 3. Frontend `features/auth/` — the reference feature

Everything in this feature shows the project's conventions, so read it carefully before touching other features. Files are organized as `pages/`, `store/`, `services/`, `forms/`, `models/`.

### Data flow (login example)

```
LoginPage (form)  ──getRawValue()──▶  AuthStore.login(payload)
                                        │
                                        ▼
                                  AuthService.login()  ──▶  HttpClient
                                        ▲                    │
                                        │          interceptor adds Bearer token
                                  response                    ▼
                                        │              POST /api/auth/login  (proxied → backend)
                                        ▼
                              store: token/refreshToken/user saved to
                              localStorage + state → navigate to '/'
```

### Files

- **`models/auth.ts`** — interfaces: `AuthUserModel`, `AuthPayloadModel` (email/password), `RegisterPayloadModel`, `AuthResponseModel` (access + refresh token + user). Note the `Model` suffix and `readonly` properties (conventions).

- **`services/auth.ts`** — `AuthService`, five methods: `login`, `register`, `refresh`, `me`, `updateProfile`, each a typed HTTP call to `/api/auth/*`.

- **`store/auth.ts`** — `AuthStore`, an **NgRx `signalStore`** with `{ providedIn: 'root' }` (one shared instance for the whole app).
  - **State** (`withState`): `{ token, refreshToken, user, loading }`, seeded from `localStorage`.
  - **Methods** (`withMethods`):
    - `isLoggedIn()` / `isAdmin()` — simple derived checks.
    - `login` / `register` / `loadProfile` — **`rxMethod`** async workflows. Pattern: `pipe(tap(loading=true), switchMap(api call), tapResponse({ next, error }))`. On success they persist tokens + user and navigate; on error they set `loading=false` and show a `NotificationService` toast.
    - `logout()` — clears localStorage + state, navigates home.
  - **Hooks** (`withHooks.onInit`): if a token already exists in localStorage, re-fetch the profile (`loadProfile()`) so a page refresh restores the session.

- **`forms/login.ts`, `forms/register.ts`** — form **services** (not component-local). Each builds a typed reactive form with `#fb.nonNullable.group({...})`, exposes it via a `get form()` getter, and provides `resetForm()`. Register form includes `confirmPassword`; the page validates that it matches `password` before calling the store.

- **`pages/login.ts`, `register.ts`, `profile.ts`** — presentational pages. They inject the form service + the store, bind shared custom elements, and use `{{ 'key' | translate }}` for text. `onSubmit()` guards on `form.invalid`, then calls `store.login(form.getRawValue())`.

---

## 4. Frontend `shared/` — reusable building blocks

### Custom elements (`shared/components/`)

All are **standalone**, use **signal inputs/outputs** (`input()`, `output()`), inline `template:`, and Tailwind-only styling. They are *dumb* — no business logic, no store access.

- **`button.ts`** — `app-button`. Variants: `primary/secondary/destructive/ghost/warning/success/outline/icon` plus Material-style `mat/mat-raised/mat-flat/mat-stroked/mat-text` with a `color` input. Emits `(buttonClick)` — there is **no `routerLink`**; pages navigate with the router instead.
- **`input.ts`**, **`textarea.ts`** — `ControlValueAccessor` (CVA) components: they implement `writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`, which makes them work with `formControlName` in reactive forms.
- **`select.ts`** — CVA wrapping `@ng-select/ng-select`; options are `{ value: number|string; label: string }[]`.
- **`card.ts`** — layout container with `variant`/`padding`/`cssClass`.
- **`form.ts`** — `<form>` wrapper that takes a `FormGroup` input and emits `ngSubmit`.
- **`navbar.ts`** — reads `AuthStore`; shows cart badge, profile dropdown (with Admin link when admin), and a mobile menu. Contains its own small UI signals (`mobileMenuOpen`, `profileDropdownOpen`, `cartCount`).
- **`footer.ts`**, **`notification.ts`** — footer; global toast that renders `NotificationService.notification`.
- **`theme-toggle.ts`**, **`language-toggle.ts`** — dark mode + language switches (self-contained, use native `<button>`).
- **`confirm-dialog.ts`**, **`confirm-bottom-sheet.ts`** — Material dialog/bottom-sheet that close with `true`/`false`.

### Services (`shared/services/`)

- **`theme.ts`** — `ThemeService`: a `signal` + `effect()` that adds/removes the `dark` class on `<html>` and persists to `localStorage['app-theme']`.
- **`language.ts`** — `LanguageService`: loads `en.json`/`fa.json`, keeps a `currentLanguage` signal, sets `<html lang>`/`dir`, and exposes `translate(key)` with English fallback.
- **`notification.ts`** — `NotificationService`: a `signal<NotificationModel | null>` and `show(type, message)` with a 3-second auto-dismiss timer.

### Pipes (`shared/pipes/`)

- **`translate.ts`** — `TranslatePipe`: impure (re-renders) and registers an `effect` so the UI updates the moment the language changes.
- **`localized-date.ts`** — `LocalizedDatePipe`: formats with `date-fns` (Gregorian) for English and `date-fns-jalali` for Persian.

### Other shared

- **`forms/password.ts`** — `PasswordFormService` with a cross-field `matchPasswords` validator (new password must equal confirm).
- **`const/http-methods.ts`** — `HTTP_METHODS` constant.
- **`models/`** — `NotificationModel`, `ApiErrorResponse`.
- **`index.ts`** — barrel files re-export everything.

### Feature `features/home/` — placeholder landing page (theme/language toggles + two buttons).

---

## 5. Backend (NestJS) — `backend/src/`

### Wiring — `app.module.ts`

Imports: `ConfigModule` (global, reads `.env`), `ServeStaticModule` (serves `uploads/` at `/uploads`), `PrismaModule`, `AuthModule`, `UploadModule`. Plus `AppController` with `GET /api/health`.

### `common/` — cross-cutting concerns

- **`prisma/prisma.service.ts`** — extends `PrismaClient`, wired with the `@prisma/adapter-pg` driver using `DATABASE_URL`. Connects on module init, disconnects on destroy. Declared in a `@Global()` module so every other module can inject it.
- **`guards/jwt-auth.guard.ts`** — `JwtAuthGuard` = passport `AuthGuard('jwt')`; validates the access token on protected routes.
- **`guards/roles.guard.ts`** — `RolesGuard`: reads `@Roles(...)` metadata from the handler and checks the JWT `role` against it.
- **`decorators/current-user.decorator.ts`** — `@CurrentUser()` param decorator; returns `request.user` (the validated JWT payload) or a single field of it.
- **`decorators/roles.decorator.ts`** — `@Roles(Role.ADMIN)` sets metadata the `RolesGuard` reads.
- **`filters/http-exception.filter.ts`** — catches all exceptions and normalizes them to `{ statusCode, message }` (joins validation message arrays).

### `auth/` — the auth module

- **`auth.controller.ts`** — routes: `POST /register`, `POST /login`, `POST /refresh`, `GET /me` (JWT), `PATCH /profile` (JWT). Swagger-tagged.
- **`auth.service.ts`** — the business logic:
  - `register` — checks for existing email/phone (`ConflictException`), bcrypt-hashes the password, creates the user, returns tokens + sanitized user.
  - `login` — finds by email, bcrypt-compares, throws `UnauthorizedException` on failure.
  - `refresh` — verifies the refresh token against `JWT_REFRESH_SECRET`, re-issues a new pair.
  - `me` / `updateProfile` — read/update the current user; `updateProfile` re-hashes the password if provided.
  - `#signTokens` — signs an **access** (default 15m) and **refresh** (default 7d) JWT with **separate secrets** from `.env`.
  - `#toUserResponse` — strips `password` before anything is sent to the client.
- **`jwt.strategy.ts`** — passport-jwt strategy for the access token; `validate()` returns `{ id, email, role }` which becomes `request.user`.
- **`dto/`** — `class-validator` DTOs: `RegisterDto` (validates Iranian mobile regex `^09\d{9}$`), `LoginDto`, `RefreshDto`, `UpdateProfileDto` (all optional).

### `upload/` — file upload

Multer `diskStorage` writing to `uploads/` with `randomUUID()` filenames. `POST /upload` (single `file`) and `POST /upload/multiple` (up to 10 `files`) return `/uploads/<filename>` URLs.

### Database — `backend/prisma/schema.prisma`

11 models: `User`, `Category`, `Product`, `ProductVariant`, `Portfolio`, `Cart`, `CartItem`, `Address`, `Order`, `OrderItem`, `ContactMessage`; plus enums `Role`, `OrderStatus`, `PaymentStatus`, `ShippingMethod`, `PaymentMethod`. The generated type-safe client lives in `backend/src/generated/prisma/` and is committed to the repo.

---

## 6. Request path (end to end)

```
Browser → Angular dev server (4200)
        → proxy.conf.json forwards /api and /uploads → backend (3000)
        → Nest global ValidationPipe + HttpExceptionFilter
        → controller → service → PrismaService → PostgreSQL
        → JSON response back through the AuthInterceptor (adds token on the way out)
```

In production the same proxy concept would be done by a web server / reverse proxy.

---

## 7. Conventions glossary (rules the code follows)

- **Standalone components only**, inline `template:` (no `templateUrl`/`NgModule`).
- **Signal-based inputs/outputs**: `input()`, `input.required()`, `output()` — no `@Input()`/`@Output()` decorators.
- **Modern template control flow**: `@if`, `@for`, `@switch` — never `*ngIf`/`*ngFor`.
- **`#` private fields** instead of TypeScript `private` (`readonly #foo = inject(...)`). Anything referenced in a template must be public.
- **Interfaces** get a `Model` suffix and `readonly` properties. `type` is only used for unions.
- **Forms live in services** (`forms/`) with a `get form()` getter; pages pass `form.getRawValue()` straight to the store, which calls the API service.
- **Async state workflows** in stores use `rxMethod` + `tapResponse` (`@ngrx/signals` + `@ngrx/operators`).
- **Custom elements** (`app-*`) for all UI primitives; no raw `<button>`/`<input>` except in self-contained specialized components (theme/language toggles).
- **Tailwind only** for styling (no component `styles:`), dark mode via `dark:` variants and the `dark` class on `<html>`.
- **i18n** through the `translate` pipe and `i18n/en.json` / `fa.json` — never hardcoded strings.
- **API layer**: components never call `HttpClient`; they go through feature services (→ `ApiService`).
- **DTO mapping at the boundary**: the backend `#toUserResponse` strips `password`; the frontend models describe exactly what the API returns.

---

## 8. Testing

> Testing infrastructure has been removed from this project (both frontend and backend): there is no `tests/` directory, no `jest` config, and no test scripts. If testing is re-added later, this section should document the setup. See the global `~/.config/opencode/docs/testing-strategy.md` for the reusable approach.
