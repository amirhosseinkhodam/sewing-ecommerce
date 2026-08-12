# Backend Code Explaination

A cross-discipline "translation guide" for the Tailor Ecommerce monorepo.

This document explains the **backend** to a **frontend developer**, and the **frontend** to a **backend developer**. It focuses on the *how* (what each piece of code does) and the *why* (the reasoning behind the architecture), using the real files in this repository. It assumes you already know your own side of the stack.

> Two quick context notes before you start:
> - The whole project is a **single-package monorepo**: one root `package.json`, one `node_modules`, one lockfile, one ESLint/Prettier config. `frontend/` and `backend/` are *folders*, not separate npm packages. See `AGENTS.md`.
> - Everything talks over plain HTTP/JSON with JWT auth. The two halves only ever meet at the REST contract (see the [Appendix](#appendix-api-contract)).

---

## Table of Contents

- [Part A — Backend for Frontend Developers](#part-a--backend-for-frontend-developers)
  - [A1. Big picture: the request lifecycle](#a1-big-picture-the-request-lifecycle)
  - [A2. Where everything lives](#a2-where-everything-lives)
  - [A3. Entry points: `main.ts` and `app.module.ts`](#a3-entry-points-maints-and-appmodulets)
  - [A4. Prisma and the database](#a4-prisma-and-the-database)
  - [A5. The auth module — the reference feature](#a5-the-auth-module--the-reference-feature)
  - [A6. Uploads](#a6-uploads)
  - [A7. Error contract](#a7-error-contract)
  - [A8. Backend conventions](#a8-backend-conventions)
  - [A9. Pitfalls for frontend developers](#a9-pitfalls-for-frontend-developers)
- [Part B — Frontend for Backend Developers](#part-b--frontend-for-backend-developers)
  - [B1. Big picture: bootstrap and providers](#b1-big-picture-bootstrap-and-providers)
  - [B2. Where everything lives](#b2-where-everything-lives)
  - [B3. The app shell and routing](#b3-the-app-shell-and-routing)
  - [B4. `core/`: API service, interceptor, guards](#b4-core-api-service-interceptor-guards)
  - [B5. State: the `AuthStore` SignalStore](#b5-state-the-authstore-signalstore)
  - [B6. The auth feature — a complete data flow](#b6-the-auth-feature--a-complete-data-flow)
  - [B7. Forms](#b7-forms)
  - [B8. Shared custom elements](#b8-shared-custom-elements)
  - [B9. Services: theme, language, notifications](#b9-services-theme-language-notifications)
  - [B10. Pipes and i18n](#b10-pipes-and-i18n)
  - [B11. Frontend conventions](#b11-frontend-conventions)
  - [B12. Pitfalls for backend developers](#b12-pitfalls-for-backend-developers)
- [Appendix — API Contract](#appendix--api-contract)

---

# Part A — Backend for Frontend Developers

You know Angular. You're about to read NestJS + Prisma + PostgreSQL code. Good news: NestJS is structurally very similar to Angular — modules, DI, decorators, providers. If you can read an Angular service, you can read a NestJS service. This part maps the concepts.

## A1. Big picture: the request lifecycle

A request from your frontend travels this exact path:

```
Browser
  └─ Angular dev server (localhost:4200)
       └─ proxy.conf.json  (rewrites /api/* and /uploads/* → localhost:3000)
            └─ NestJS app (localhost:3000)
                 ├─ 1. Global ValidationPipe (whitelist + transform)
                 ├─ 2. Global HttpExceptionFilter (normalizes errors)
                 ├─ 3. Guards (JwtAuthGuard, RolesGuard)  [route-level]
                 ├─ 4. Controller  (validates + parses the route)
                 ├─ 5. Service     (business logic)
                 ├─ 6. PrismaService (SQL via Prisma ORM)
                 └─ PostgreSQL
```

Key facts:

- The backend is served under the global prefix **`/api`** (set in `main.ts`). So a controller method with route `'login'` on controller `@Controller('auth')` is reachable at `POST /api/auth/login`.
- In development, your Angular dev server proxies `/api` and `/uploads` to port 3000 (`frontend/proxy.conf.json`), so from the frontend's point of view everything is same-origin.
- In production there would be a reverse proxy in front of the backend instead.

## A2. Where everything lives

```
backend/
├── prisma/
│   ├── schema.prisma     # the single source of truth for the DB shape
│   ├── migrations/       # SQL migration history (Prisma generates these)
│   └── seed.ts           # idempotent sample data
└── src/
    ├── main.ts           # bootstrap: pipes, filters, CORS, Swagger, prefix
    ├── app.module.ts     # root module: wires ConfigModule, uploads, Prisma, Auth, Upload
    ├── app.controller.ts # GET /api/health
    ├── common/
    │   ├── decorators/   # @CurrentUser, @Roles
    │   ├── guards/       # JwtAuthGuard, RolesGuard
    │   ├── filters/      # HttpExceptionFilter
    │   └── prisma/       # PrismaService + PrismaModule (global)
    ├── auth/             # the reference feature (module, controller, service, dto, jwt.strategy)
    └── upload/           # file upload (Multer)
```

Future features (`categories`, `products`, `cart`, `orders`, ...) follow the **exact same `auth/` layout** — that's why it's called the reference feature.

## A3. Entry points: `main.ts` and `app.module.ts`

**`backend/src/main.ts`** — every NestJS app starts here:

- `NestFactory.create<NestExpressApplication>(AppModule)` — builds the app from the root module.
- `app.setGlobalPrefix('api')` — all routes are under `/api`.
- `app.enableCors()` — allows cross-origin requests (dev convenience; the dev proxy makes this mostly moot).
- `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` — two important behaviors:
  - **`whitelist: true`** strips any property from the request body that isn't declared in a DTO. If a client sends `{ email, password, isAdmin: true }`, `isAdmin` is silently dropped — a cheap security guard against mass-assignment.
  - **`transform: true`** converts plain JSON into typed DTO class instances, and coerces primitives (e.g. string `"5"` → number `5` for `@Param` / `@Query`).
- `app.useGlobalFilters(new HttpExceptionFilter())` — every thrown error is converted to the standardized `{ statusCode, message }` shape (see [A7](#a7-error-contract)).
- Swagger is generated automatically from the controllers/DTOs and mounted at **`/docs`** — you can explore and test every endpoint there.
- It `mkdirSync`s an `uploads/` directory on boot so Multer always has a destination.
- Port comes from `PORT` env var, default `3000`.

**`backend/src/app.module.ts`** — think of it as the Angular root `imports` array:

- `ConfigModule.forRoot({ isGlobal: true })` — loads `.env` and makes `ConfigService` injectable everywhere without re-importing the module.
- `ServeStaticModule.forRoot({ rootPath: uploads, serveRoot: '/uploads' })` — serves uploaded files at `/uploads/<filename>`.
- `PrismaModule` — a `@Global()` module, so `PrismaService` is injectable in any feature without importing anything.
- `AuthModule`, `UploadModule` — the current features.

## A4. Prisma and the database

**Why Prisma?** Type-safe database access. The schema in `backend/prisma/schema.prisma` is the single source of truth for the DB shape, and the generated client in `backend/src/generated/prisma/` gives you (and TypeScript) fully typed query methods.

**Models you'll meet** (`schema.prisma`): `User`, `Category`, `Product`, `ProductVariant`, `Portfolio`, `Cart`, `CartItem`, `Address`, `Order`, `OrderItem`, `ContactMessage`, plus enums `Role`, `OrderStatus`, `PaymentStatus`, `ShippingMethod`, `PaymentMethod`. Some are implemented in the API already (`User` via auth), the rest are schema-ready for upcoming phases.

**`common/prisma/prisma.service.ts`** — a thin subclass of `PrismaClient`:

- Uses the `PrismaPg` adapter with `DATABASE_URL` from config.
- `onModuleInit` connects, `onModuleDestroy` disconnects — NestJS lifecycle hooks so the pool's lifetime matches the app's.
- Because `PrismaModule` is `@Global()`, every service can do `constructor(prisma: PrismaService)` and query with `this.#prisma.user.findUnique(...)` etc.

**Frontend-relevant gotchas:**

- **`Decimal` fields** (`price`, `totalAmount`) are returned to the client as **strings**, not numbers. `prisma.category.create({ data: category })` is typical.
- **`Json` fields** (`Product.images`) are returned as parsed JS objects/arrays, and accepted as such.
- **IDs are UUID strings** (`String @id @default(uuid())`), not auto-increment integers. The frontend never assumes numeric IDs.
- **Migrations & seed**: run from the repo root with `npm run prisma:migrate`, `npm run prisma:seed`, `npm run prisma:studio` (a browser GUI to inspect data). `seed.ts` creates the admin user and three sample categories (`men`, `women`, `kids`).

## A5. The auth module — the reference feature

Open `backend/src/auth/` — every future feature copies this shape:

```
auth/
├── auth.module.ts       # declares controller + providers, imports Passport + Jwt
├── auth.controller.ts   # routes: /register /login /refresh /me /profile
├── auth.service.ts      # business logic
├── jwt.strategy.ts      # how "Bearer <token>" becomes a user
└── dto/                 # one file per request body contract
    ├── register.dto.ts
    ├── login.dto.ts
    ├── refresh.dto.ts
    └── update-profile.dto.ts
```

### Controller → Service flow

The controller is intentionally dumb: it receives the request, applies guards, and delegates to the service. No SQL, no hashing, no business rules in the controller.

```ts
@Post('login')
@HttpCode(200)
login(@Body() dto: LoginDto) {
  return this.#auth.login(dto);
}
```

Note the private field pattern (`readonly #auth`) — NestJS DI happens through the constructor, then the value is stored in a `#`-prefixed private field. You'll see this everywhere (see [A8](#a8-backend-conventions)).

### What the service does

`auth.service.ts` is where the interesting logic lives:

- **`register`**: checks for an existing email *or* phone (`findFirst` with an `OR`), throws `ConflictException` (→ HTTP 409) if taken, hashes the password with **bcrypt** (10 rounds — never store plaintext, never return it), creates the user, and returns tokens + user.
- **`login`**: looks up by email, compares bcrypt hashes, throws `UnauthorizedException` (→ 401) on failure.
- **`refresh`**: verifies the *refresh* token with a **separate secret** (`JWT_REFRESH_SECRET`), reloads the user, issues a fresh token pair.
- **`#signTokens`**: issues an **access token (15 min)** and a **refresh token (7 days)**, signed with *different* secrets and expiries so a leaked access token can't mint new tokens. It's `async` with `Promise.all`.
- **Prisma `omit`**: every query that returns a user uses `omit: { password, createdAt, updatedAt }` (shared `USER_OMIT` const) so `password` never leaves the service. `login` fetches the password for the bcrypt check, then strips it via destructuring before returning. The response shape is the shared `UserModel` (from `shared/models/user.ts`) — this is why your frontend never sees a `password` field.

### How a token becomes a user: `jwt.strategy.ts`

Passport's JWT strategy reads the `Authorization: Bearer <token>` header, verifies the signature against `JWT_ACCESS_SECRET`, and calls `validate(payload)`. The returned object becomes `request.user`:

```ts
validate(payload: JwtPayload): AuthUser {
  return { id: payload.sub, email: payload.email, role: payload.role };
}
```

So any controller can grab the authenticated user with the `@CurrentUser()` decorator (`common/decorators/current-user.decorator.ts`) — it reads `request.user` and optionally returns a single field: `@CurrentUser('id')`.

### Guards: who is allowed

- **`JwtAuthGuard`** (`common/guards/jwt-auth.guard.ts`) — one-liner extending Passport's `AuthGuard('jwt')`. Apply with `@UseGuards(JwtAuthGuard)` + `@ApiBearerAuth()` (for Swagger). Rejects unauthenticated requests with 401.
- **`RolesGuard` + `@Roles('ADMIN')`** — reads the role from `request.user` and compares against the roles declared on the handler. `@Roles()` with no args lets everyone through. Combined with `JwtAuthGuard` this gives `@UseGuards(JwtAuthGuard, RolesGuard)` on admin-only routes.

**Why guards instead of checks inside the service?** Cross-cutting concerns stay at the edge of the request. The service assumes it already has a valid user.

### DTOs: the contract validation

`dto/register.dto.ts` shows the pattern — class-validator decorators on `readonly` properties:

```ts
@IsString()
@Matches(/^09\d{9}$/, { message: 'phone must be a valid Iranian mobile number' })
readonly phone: string;
```

The global `ValidationPipe` runs these rules, and on failure returns a 400 with the message(s). **Important**: because `whitelist: true`, any field *not* decorated is stripped. So when the frontend sends a body, it must match the DTO field-for-field or extra fields will be dropped silently.

## A6. Uploads

`backend/src/upload/upload.controller.ts` uses Multer with `diskStorage`:

- Files land in `uploads/` with a `randomUUID()` filename (original name is discarded — no path traversal, no collisions).
- `POST /api/upload` (field `file`) → `{ url: "/uploads/<uuid>.jpg" }`.
- `POST /api/upload/multiple` (field `files`, max 10) → `{ urls: [...] }`.

The returned relative paths (`/uploads/...`) are what you store on the model and use directly as image `src` — the dev proxy and `ServeStaticModule` both serve them.

## A7. Error contract

`common/filters/http-exception.filter.ts` catches **everything** and responds with exactly:

```json
{ "statusCode": 400, "message": "email must be an email" }
```

- `message` is a single string — even class-validator arrays are joined with `", "`.
- Unknown exceptions fall back to `500` / `"Internal server error"`.
- This is why the frontend interceptor/store can reliably read `err.error?.message` for every error.

| Situation | Status |
|---|---|
| Validation failed (DTO) | 400 |
| Duplicate email/phone | 409 (ConflictException) |
| Wrong credentials / expired token | 401 (UnauthorizedException) |
| Not authenticated | 401 |
| Authenticated but not admin on an `@Roles('ADMIN')` route | 403 |

## A8. Backend conventions

- **`#` private fields, never `private`**: `readonly #prisma: PrismaService;` assigned in the constructor. Enforced by ESLint.
- **`readonly` everywhere**: DTO properties and injected services are immutable.
- **One `dto/` file per body shape**, always `class XxxDto` with class-validator decorators.
- **Controllers delegate; services own logic; modules wire them.** Every feature = `module + controller + service + dto`.
- **Global `PrismaModule`** so features don't re-import it.
- Interfaces like `AuthUser` / `JwtPayload` are declared next to what uses them, not in a shared barrel.

## A9. Pitfalls for frontend developers

1. **Decimal fields arrive as strings** — don't do arithmetic expecting numbers; parse with `Number(...)` or a price formatter.
2. **Don't rely on IDs being numbers** — they're UUID strings.
3. **Error bodies are always `{ statusCode, message }`** — read `err.error?.message`, not `err.message`.
4. **401 ≠ 403**: 401 means "not logged in / token invalid" (the interceptor will try to refresh); 403 means "logged in but not allowed".
5. **`images` is a JSON array** (`Json` type) — the API expects/returns an array of `/uploads/...` URLs, not a single URL.
6. **Only one cart/address per user** for now; relation rules come from the Prisma schema, not the frontend.

---

# Part B — Frontend for Backend Developers

You know NestJS. You're about to read Angular. NestJS and Angular share DNA (decorators, DI, modules), so you already understand the skeleton. The parts that will surprise you: **reactive forms**, **signals**, **ControlValueAccessor**, **standalone components** (no `NgModule`), and the **SignalStore** pattern. This part maps the concepts back to backend equivalents.

## B1. Big picture: bootstrap and providers

**`frontend/src/main.ts`** is the frontend equivalent of `backend/src/main.ts`:

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideAnimationsAsync(),
    provideHttpClient(),
    provideRouter(routes),
    ThemeService,
  ],
});
```

- `bootstrapApplication` = `NestFactory.create`. The app is **standalone** — there are no `NgModule`s anywhere; components, pipes, and routes are self-contained.
- `provideRouter(routes)` registers the router (like `@nestjs/router`).
- `provideHttpClient()` gives you `HttpClient` injectable everywhere.
- `ThemeService` is provided at the root so dark mode is active from the very first render.

The equivalent of a root module's `providers` is this array. Services marked `@Injectable({ providedIn: 'root' })` don't even need to be listed here — they're auto-registered.

## B2. Where everything lives

```
frontend/src/app/
├── main.ts               # bootstrap (see B1)
├── app.ts                # root shell component (navbar + router-outlet + footer + toast)
├── main.route.ts         # all routes (lazy-loaded)
├── core/                 # app-wide plumbing
│   ├── guards/auth.guard.ts
│   ├── interceptors/auth.interceptor.ts
│   └── services/api.service.ts
├── features/             # one folder per feature (auth today, products/... next)
│   └── auth/
│       ├── pages/        # routed components (login, register, profile)
│       ├── store/        # AuthStore (SignalStore)
│       ├── forms/        # form services (login.ts, register.ts)
│       ├── models/       # TypeScript interfaces matching the API
│       └── services/     # HTTP wrappers (AuthService)
├── i18n/                 # en.json + fa.json (Persian, RTL)
└── shared/               # reusable, framework-agnostic-ish building blocks
    ├── components/       # custom elements: app-button, app-input, app-form, ...
    ├── services/         # theme, language, notification
    ├── pipes/            # translate, localized-date
    ├── forms/            # password form service
    ├── validators/       # shared validation functions
    └── models/ const/    # shared types and constants
```

Think of `core/` as the NestJS `common/` (guards, interceptors, global service), `features/*` as NestJS modules, `shared/` as a reusable library both use.

## B3. The app shell and routing

**`app.ts`** is the root shell, like an Angular wrapper around your whole app:

```html
<app-navbar />
<main><router-outlet /></main>
<app-footer />
<app-notification />
```

Every route renders inside `<router-outlet>`. The navbar and footer never re-render on navigation.

**`main.route.ts`** is the "controller map":

```ts
{
  path: 'products',
  loadComponent: () => import('./features/products/pages/catalog').then(m => m.CatalogComponent),
}
```

- Every page is **lazy-loaded** with `loadComponent` — the browser only fetches the JS chunk when you navigate there (like lazy NestJS module loading, but on the client).
- `canActivate: [authGuard]` protects routes. **`auth.guard.ts`** is the backend's `RolesGuard` equivalent but client-side: reads the `AuthStore`, returns `true` to allow, or a `Router` URL to redirect.

## B4. `core/`: API service, interceptor, guards

### `services/api.service.ts` — your HTTP client wrapper

The frontend never calls `HttpClient` directly. Everything goes through `ApiService`, which prefixes `/api`:

```ts
get<T>(path) { return this.#http.get<T>(`/api${path}`); }
post<T>(path, body) { return this.#http.post<T>(`/api${path}`, body); }
```

`T` is the expected response type — the backend's DTOs have frontend mirror interfaces in `features/*/models/*.ts`.

### `interceptors/auth.interceptor.ts` — the JWT middleware

This is the frontend equivalent of `JwtAuthGuard` + your refresh logic combined into an HTTP middleware:

1. Skips the refresh endpoint (no infinite loop).
2. Attaches `Authorization: Bearer <token>` from the store to every request.
3. On **401**: if a refresh token exists, calls `POST /api/auth/refresh`, stores the new pair via `auth.setToken(...)`, and **retries the original request once**.
4. If refresh also fails → `auth.logout()` (clears storage, navigates home) and rethrows.

**Why this matters to you as a backend dev**: the access token is short-lived (15 min) and the refresh token is long-lived (7 days). The frontend *expects* your refresh endpoint at `POST /api/auth/refresh` returning `{ accessToken, refreshToken, user }`, and it expects 401 (not 403) to trigger refresh.

### `guards/auth.guard.ts` — route protection

- `authGuard`: logged in? → allow; else redirect `/login`.
- `adminGuard`: logged in **and** `role === 'ADMIN'`? → allow; else `/`.

Client guards are UX, not security — the backend `RolesGuard` is the real gate.

## B5. State: the `AuthStore` SignalStore

`auth/store/auth.ts` is the frontend's "session cache". It uses **`@ngrx/signals`** `signalStore` — a modern, signal-based state store.

```ts
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),   // { token, refreshToken, user, loading }
  withMethods((store, ...) => ({
    login: rxMethod<AuthPayloadModel>(pipe(
      tap(() => patchState(store, { loading: true })),
      switchMap((payload) =>
        authService.login(payload).pipe(
          tapResponse({
            next: (res) => { /* persist + patch state + navigate */ },
            error: (err) => { /* patch loading false + toast */ },
          }),
        ),
      ),
    )),
    ...
  })),
  withHooks({ onInit(store) { if (store.token()) store.loadProfile(); } }),
);
```

Key ideas for a backend dev:

- **`withState`** = the store's "database" — a small reactive object. State is seeded from `localStorage` (`accessToken`, `refreshToken`), so a page refresh restores the session *before* the profile is even fetched.
- **`withMethods`** = the store's "services". `rxMethod` is like a typed effect: it takes an input, runs an observable pipeline, and updates state via `patchState`.
- **`tapResponse`** is the RxJS equivalent of a try/catch that distinguishes success/error cleanly — like `async`/`await` in your services but with automatic cancellation on re-entry.
- **`withHooks.onInit`** = `OnModuleInit`-style bootstrapping: if a token exists, re-fetch `/api/auth/me` to restore the user object.
- Components inject the store and **read state as signals**: `store.loading()`, `store.isAdmin()`. Backend parallel: a shared in-memory cache with reactive reads.
- Rule of thumb from the plan: **only auth is global state**. Future features fetch via API services and keep local component state, so don't expect a store for every feature.

## B6. The auth feature — a complete data flow

Follow one action end-to-end. **Login:**

```
LoginComponent
  └─ injects LoginFormService (owns the reactive form) + AuthStore
  └─ (formSubmit) → onSubmit()
       └─ store.login(this.loginForm.form.getRawValue())
            └─ AuthStore.login: rxMethod<AuthPayloadModel>
                 └─ switchMap → AuthService.login(payload)
                      └─ ApiService.post<AuthResponseModel>('/auth/login', payload)
                           └─ HttpClient → proxy → POST /api/auth/login
                                └─ (backend: AuthController → AuthService → Prisma)
```

**Models** (`models/auth.ts`) mirror your DTOs:

```ts
export interface AuthPayloadModel {   // = LoginDto
  readonly email: string;
  readonly password: string;
}
export interface AuthResponseModel {  // = login() return value
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly user: UserModel;           // = shared/models/user.ts
}
```

**Services** (`services/auth.ts`) mirror your controller routes 1:1: `login`, `register`, `refresh`, `me`, `updateProfile`.

**Field names matter**: `getRawValue()` sends exactly the model properties — `email`, `password`, `firstName`, `lastName`, `phone`, `refreshToken`. If you rename a backend DTO field, you must rename it here too.

## B7. Forms

Forms are the biggest mental shift. Look at `forms/login.ts`:

```ts
@Injectable({ providedIn: 'root' })
export class LoginFormService {
  readonly #fb = inject(FormBuilder);
  readonly #form = this.#fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, strongPasswordValidator()]],
  });
  get form() { return this.#form; }
}
```

- The form is a **typed reactive form** owned by a service (`get form()` getter), not scattered in components.
- **Template** binds custom elements with `formControlName` (see B8) and validates automatically via `app-form` + `app-form-field`.
- Components read the value with **`getRawValue()`** (not `.value`) because `.value` omits disabled controls and returns `Partial<T>`.
- **Validators are centralized** in `shared/validators/validators.ts` (Persian name, Iranian phone `09xxxxxxxxx`, national-code checksum, strong password) — the same regexes your backend DTOs use, mirrored client-side for instant feedback.
- `app-form` calls `markAllAsTouched()` on submit and only emits if valid — so by the time `onSubmit()` runs, the data is guaranteed valid *client-side* (your backend still must validate; never trust the client).

## B8. Shared custom elements

`shared/components/` contains **dumb, reusable UI primitives** used via element selectors: `app-button`, `app-input`, `app-select`, `app-textarea`, `app-card`, `app-form`, `app-form-field`, `app-modal`, `app-loading-spinner`, navbar, footer, notification, theme/language toggles.

- **No business logic, no API calls, no store access.** They receive data via `input()` signals and emit events via `output()` — like a NestJS controller that only delegates.
- **Signal-based API**: `readonly label = input<string>()`, `readonly buttonClick = output<void>({ alias: 'buttonClick' })` — modern Angular, no `@Input()`/`@Output()` decorators.
- **ControlValueAccessor (CVA)**: `app-input`, `app-select`, `app-textarea` implement `ControlValueAccessor` (with `NG_VALUE_ACCESSOR` provider) so they plug into reactive forms via `formControlName` — think of it as implementing an interface your form system understands (`writeValue`, `registerOnChange`, `registerOnTouched`, `setDisabledState`).
- **The form component owns validation UX**: it watches `statusChanges` and shows translated errors; no manual `@if` error blocks in pages.
- Backend parallel: these are your "common libraries" — shared, dependency-free, versioned by use.

## B9. Services: theme, language, notifications

**`services/theme.ts`** — signal-based dark mode. A signal `isDark` toggles a `dark` class on `<html>`; Tailwind's `dark:` variants react. Persists to `localStorage` key `app-theme`.

**`services/language.ts`** — the i18n engine. Holds a `currentLanguage` signal (`'en'` or `'fa'`), and in an `effect`:
- sets `document.documentElement.lang` and `dir="rtl"`/`dir="ltr"`,
- persists to `localStorage` key `app-language`.

`translate(key)` walks the nested JSON (`en.json` / `fa.json`) with an English fallback, so a missing key in `fa` silently falls back instead of crashing. **Every user-facing string must be a translation key** — no hardcoded text. The `TranslatePipe` is *impure* so it re-renders on language change.

**`services/notification.ts`** — a global toast. `show(type, message)` sets a signal, auto-dismisses after 3s. `app-notification` in the root shell renders it. This is how stores surface backend errors: `notification.show('error', err.error?.message)`.

## B10. Pipes and i18n

- **`TranslatePipe`** — `{{ 'products' | translate }}` resolves keys, supports params (`'minlength' | translate: { required: 6 }`).
- **`LocalizedDatePipe`** — formats ISO timestamps as **Jalali** (Persian calendar) when language is `fa`, Gregorian otherwise. Backend sends UTC ISO strings; the pipe handles display.
- i18n lives in `frontend/src/app/i18n/*.json`. Adding a feature means adding keys to **both** `en.json` and `fa.json`; a missing key in one is a UI bug (falls back to English).

## B11. Frontend conventions

- **`#` private fields** (same rule as backend — `readonly #http = inject(HttpClient)`), never `private`.
- **Models**: `interface XxxModel` with `readonly` properties, in `models/` directories only. Field names match the backend DTOs.
- **Files match their primary export**: `auth.ts` exports `AuthService`/`AuthStore`/`UserModel` depending on folder (`services/`, `store/`, `models/`).
- **String/enum values are camelCase** client-side (`'superAdmin'`) — but note the *API* enums from Prisma are uppercase (`'ADMIN'`); the frontend compares against `'ADMIN'` because that's what the backend sends.
- **Components are single `.ts` files with inline `template:`** — no external HTML files.
- **Standalone everywhere** — components import their own dependencies; no `NgModule`.

## B12. Pitfalls for backend developers

1. **localStorage keys are `accessToken` and `refreshToken`** — if you ever change token semantics, the interceptor/store expectations change with them.
2. **The frontend reads `err.error?.message`** — so your `HttpExceptionFilter` shape `{ statusCode, message }` is load-bearing. If `message` is an array, the frontend still gets a joined string (the filter handles it).
3. **`refresh` must return the full pair + user** (`{ accessToken, refreshToken, user }`) — the interceptor destructures exactly that.
4. **403 vs 401**: client guards only gate UI. Real authorization is yours. If you return 403 where the client expects 401 (e.g. expired token), the auto-refresh won't trigger.
5. **Field names are the contract**: `firstName`/`lastName` (not `first_name`), `phone` matching `/^09\d{9}$/`. Changing a DTO field without updating `features/*/models/*.ts` breaks the frontend at compile time (good — TypeScript catches it).
6. **`/uploads` static serving** comes from the backend (`ServeStaticModule`); the frontend just references the returned URL path.
7. **Date display is dual-calendar** — send ISO UTC timestamps; don't send pre-localized strings or the Jalali/Gregorian switch will break.

---

## Appendix — API Contract

Current live endpoints (Swagger at `/docs`). Shapes match DTO ⇄ model.

### Auth

| Method | Path | Auth | Request body (DTO) | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `RegisterDto` `{firstName, lastName, email, password, phone}` | `{accessToken, refreshToken, user}` |
| POST | `/api/auth/login` | — | `LoginDto` `{email, password}` | `{accessToken, refreshToken, user}` |
| POST | `/api/auth/refresh` | — | `RefreshDto` `{refreshToken}` | `{accessToken, refreshToken, user}` |
| GET | `/api/auth/me` | Bearer | — | `UserModel` `{id, firstName, lastName, email, phone, role}` |
| PATCH | `/api/auth/profile` | Bearer | `UpdateProfileDto` (all optional) | `UserModel` |

`role` ∈ `'CUSTOMER' | 'ADMIN'` (Prisma `Role` enum, sent uppercase).

### Upload

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/upload` | — | multipart field `file` | `{ url }` |
| POST | `/api/upload/multiple` | — | multipart field `files` (≤10) | `{ urls: string[] }` |

URLs look like `/uploads/<uuid>.jpg` and are served statically by the backend.

### Health

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/api/health` | — | `{ status: "ok" }` |

### Error responses

Every failure is `{ "statusCode": number, "message": string }` (see [A7](#a7-error-contract)).

### Planned (schema-ready, frontend routes already in the navbar)

`/api/categories`, `/api/products`, `/api/cart`, `/api/orders`, `/api/addresses`, `/api/payment/*`, `/api/portfolio`, `/api/contact`, and the `/api/admin/*` group. Full endpoint list: `PLAN.md` §6.
