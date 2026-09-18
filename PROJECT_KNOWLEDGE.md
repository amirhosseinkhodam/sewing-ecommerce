# Sewing Ecommerce — Project Knowledge & Learning Guide

> **Living document.** This file describes the CURRENT state of the project — how it works and why it is built this way. It is maintained automatically by the agent: any task that changes architecture, APIs, database, auth, state management, config, or deployment updates this file in the same task (see the `project-knowledge` skill). It is not a changelog.
>
> **Doc map:** `README.md` = overview + run commands · `PLAN.md` = roadmap, planned routes/endpoints/phases · `AGENTS.md` = coding conventions · `docs/adr/` = formal decision records (when added) · Swagger at `/docs` = generated API reference.

---

## 1. Project overview

A Persian-first, mobile-responsive sewing shop ecommerce website.

- **Domain**: online storefront for a custom sewing business (clothing categories: مردانه/men, زنانه/women, بچگانه/kids).
- **Users**: Guest (browse catalog/product detail), Customer (cart → checkout → order), Admin (`ADMIN` role; manages products/categories from `/admin`).
- **Implemented today**: auth (JWT access+refresh), product catalog + detail with variants/stock, category management, image upload, server-side cart, address book, order creation from cart (single transaction), admin panel for products/categories.
- **Planned** (see `PLAN.md`): order history UI, card-to-card receipt upload, portfolio/contact pages, admin dashboard/customers/messages/settings, Zarinpal payment, Kavenegar SMS.

## 2. Technology stack

Only what is actually used (verified in root `package.json`):

| Layer | Technology |
|---|---|
| Frontend | Angular 19 standalone components (no NgModules), zone-based change detection (`zone.js` present, no zoneless provider) |
| Styling | Tailwind CSS 3 + `tailwindcss-rtl` plugin (RTL-ready utilities) |
| State | `@ngrx/signals` SignalStore + `@ngrx/operators` (`tapResponse`) |
| UI libs | Angular Material + CDK (dialogs/bottom sheets), `@ng-select/ng-select`, Hugeicons (`@hugeicons/angular`) |
| Dates | `date-fns` (Gregorian) + `date-fns-jalali` (Persian calendar) |
| Backend | NestJS 11 (`@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/swagger`, `@nestjs/serve-static`) |
| ORM | Prisma 7 with driver adapter `@prisma/adapter-pg` (generated client committed under `backend/src/generated/prisma/`) |
| Database | PostgreSQL |
| Auth | JWT access + refresh tokens (Passport `passport-jwt` strategy), bcrypt password hashing |
| Validation | `class-validator` + `class-transformer` via global `ValidationPipe` |
| File upload | Multer `diskStorage` into local `uploads/` directory |
| Toolchain | Single root `package.json` (frontend + backend + shared), TypeScript ~5.8, ESLint 9 flat config, Prettier, `concurrently`, Node ≥ 22 (`.nvmrc`) |
| Testing | **None** — test infrastructure was removed from the project. Verification today = `npm run lint` + `npm run build` + manual testing via the running app / Swagger UI |
| Deployment | Dev-only setup (Angular dev-server proxy). No Dockerfile, CI, or reverse proxy — *Unknown / not confirmed from the current codebase* beyond the build scripts |

## 3. Architecture

```
Browser
   ↓
Angular dev server :4200        frontend/proxy.conf.json
   │  proxies /api/* and /uploads/* ──────────────┐
   ↓                                              ↓
Angular app (standalone, lazy routes)      NestJS app :3000
   ├── core/          guards, interceptor, ApiService     ├─ global prefix /api
   ├── auth/          AuthStore + services/forms/pages    ├─ ValidationPipe (whitelist+transform)
   ├── features/      cart, products, addresses, orders,  ├─ HttpExceptionFilter
   │                  home, admin                         ├─ Guards (JwtAuthGuard, RolesGuard)
   ├── i18n/          en.json / fa.json                   ├─ Controllers → Services
   └── shared/        dumb UI elements, pipes, services   ├─ PrismaService (global module)
                                                       ↓
Root shared/  (@domain/* alias)              PostgreSQL
types + models + const mirrored across both halves
```

### Monorepo layout

One root `package.json` / lockfile / ESLint / Prettier. `frontend/` and `backend/` are folders, not packages. Cross-half types live in root `shared/`:

- Frontend imports it via path aliases: `@domain/models/user`, `@domain/const/order-statuses` (plus app aliases `@core/*`, `@shared/*`, `@auth/*`, `@i18n/*`). No `../..` imports, no barrel files.
- Backend imports `shared/` via relative paths (`../../../shared/models/order`) because path aliases are not rewritten in emitted NestJS JS.

### Backend modules (`backend/src/`)

| Module | Responsibility |
|---|---|
| `auth/` | register/login/refresh/me/profile, JWT signing, bcrypt (the reference feature — every module copies its shape) |
| `categories/` | public list controller + `admin/categories` CRUD controller |
| `products/` | public list/detail controllers + `admin/products` CRUD controller, variants upsert, query filtering |
| `cart/` | one cart per user, add/update/remove items with stock checks |
| `addresses/` | address book CRUD scoped to the authenticated user |
| `orders/` | create order from cart (one `$transaction`) |
| `upload/` | Multer single/multiple upload to `uploads/` (public, no guard) |
| `common/` | `PrismaModule` (global), `JwtAuthGuard`, `RolesGuard` + `@Roles()`, `@CurrentUser()`, `HttpExceptionFilter`, `slugify` util |

Every feature follows the same shape: `module + controller(s) + service + dto/`. Controllers are dumb (receive request, delegate); services own business logic and Prisma queries.

### Frontend structure (`frontend/src/app/`)

- `core/` — `ApiService` (typed `/api`-prefixed HttpClient wrapper; the only place that touches HTTP besides the interceptor), `authInterceptor`, `authGuard`/`adminGuard`.
- `auth/` — reference feature: root-level `AuthStore`, `AuthService`, form services, login/register/profile pages.
- `features/<feature>/{pages,store,services,forms,components,models,const}` — only the folders a feature needs. Implemented: `home`, `products`, `cart`, `addresses`, `orders` (checkout), `admin`.
- `shared/` — dumb reusable custom elements (`app-button`, `app-input`, `app-select`, `app-form`, `app-form-field`, modal, toggles…), CVAs for reactive forms, `ThemeService`/`LanguageService`/`NotificationService`/`ModalService`, `TranslatePipe` + `LocalizedDatePipe` + `LocalizedNumberPipe`, centralized validators.
- Components are single `.ts` files with inline templates; every routed page is lazy-loaded via `loadComponent`.

### Implemented routes (`main.route.ts`)

Public: `/` (home), `/products`, `/products/:slug`, `/login`, `/register`.
Protected by `authGuard`: `/cart`, `/checkout`, `/addresses`, `/profile`.
Protected by `adminGuard`: `/admin` (layout + children `products`, `products/new`, `products/:id/edit`, `categories`; index redirects to `products`).
Fallback: `**` → `/`. Planned routes live in `PLAN.md §4` — do not assume they exist.

## 4. Request / data flows

Development request path: `Browser → ng serve :4200 → proxy (/api, /uploads) → NestJS :3000 → ValidationPipe → Guard → Controller → Service → PrismaService → PostgreSQL`. Production would replace the proxy with a reverse proxy (*not configured yet — Unknown*).

### Login (end-to-end)

```
LoginPage
  → LoginFormService.form.getRawValue()
  → AuthStore.login({ payload, returnUrl })        [rxMethod]
    → AuthService.login() → ApiService.post('/auth/login')
      → POST /api/auth/login
        → ValidationPipe (LoginDto)
        → AuthController → AuthService.login()
          → findUnique by email → bcrypt.compare
          → #signTokens (access 15m + refresh 7d, separate secrets)
      ← { accessToken, refreshToken, user }         [password omitted]
  ← localStorage.setItem(accessToken/refreshToken) + patchState
  ← router.navigateByUrl(returnUrl ?? '/')
```

### Catalog browse

`CatalogStore.loadProducts()` (component-scoped store provided on the page) → `GET /api/products?search&category&minPrice&maxPrice&sort&page&pageSize` → `ProductsService` builds a Prisma `where` clause, includes `category` + ordered `variants` → returns `{ items, total, page, pageSize, totalPages }`.

### Guest add-to-cart → login-return flow

1. On `/products/:slug`, clicking "Add to Cart" while logged out navigates to `/login?returnUrl=<current url>&variantId=...&autoAdd=1`.
2. After successful login, `AuthStore.login` navigates back to `returnUrl`.
3. `ProductDetailComponent` reads `autoAdd=1` + `variantId` from query params, calls `CartStore.addItem()` → `POST /api/cart/items`, then clears the params.

### Checkout → order creation (the core transaction)

```
CheckoutPage (provides CheckoutStore)
  → loadAddresses() → GET /api/addresses
  → placeOrder({ shippingAddressId, shippingMethod, paymentMethod, notes })
    → POST /api/orders (JwtAuthGuard)
      → OrdersService.create(userId, dto):
          1. load cart incl. items + product + variant   → 400 if empty
          2. verify address belongs to userId            → 404 if not
          3. verify stock for every item                 → 400 if insufficient
          4. $transaction:
               - create Order (status PENDING, paymentStatus PENDING)
               - snapshot OrderItems (name/image/size/unitPrice/totalPrice frozen at purchase time)
               - decrement ProductVariant.stock per item
               - delete all CartItems (cart becomes empty)
      → map Prisma result → shared OrderModel (Decimal → string)
  ← CartStore refreshed (navbar badge empties)
```

## 5. Authentication & authorization

**Mechanism**: stateless JWT. Access token ~15 min, refresh token 7 days, signed with **different secrets** (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`); expiries configurable via env, defaults hardcoded as fallbacks. Payload: `{ sub: userId, email, role }`.

**Backend responsibilities** (`backend/src/auth/`):

- `register`: rejects duplicate email **or** phone with 409, hashes password with bcrypt (10 rounds), returns token pair + user.
- `login`: email lookup + `bcrypt.compare`, generic 401 "Invalid credentials" on failure (no user-enumeration hint).
- `refresh`: verifies refresh token with the refresh secret, reloads user, issues a fresh pair. No rotation/revocation table (deliberate MVP trade-off — see decisions).
- Every response strips sensitive fields via Prisma `omit` (`USER_OMIT` = password, createdAt, updatedAt). The wire shape is the shared `UserModel`.
- `jwt.strategy.ts`: Passport verifies the Bearer token against the access secret; `validate()` returns `{ id, email, role }` which becomes `request.user`. Controllers read it via `@CurrentUser()` / `@CurrentUser('id')`.
- Authorization: `@UseGuards(JwtAuthGuard)` for "any logged-in user"; admin routes add `RolesGuard` + `@Roles(Role.ADMIN)` (e.g. `admin/products`, `admin/categories`). 401 = not authenticated/expired; 403 = authenticated but wrong role.

**Frontend responsibilities**:

- Tokens persist in `localStorage` keys `accessToken` / `refreshToken`. `AuthStore` seeds state from them on boot and re-fetches the profile (`GET /api/auth/me`) in `withHooks.onInit`, so a page refresh restores the session.
- `authInterceptor`: skips `/api/auth/refresh` (prevents loops) → attaches `Authorization: Bearer …` to every request → on **401**, calls refresh once, stores the new pair (`setToken`), retries the original request → if refresh fails, `logout()` (clears storage, redirects `/`).
- `authGuard` (logged in?) and `adminGuard` (role check via `USER_ROLES.ADMIN`) protect client routes. These are UX, not security — the backend guards are the real gate.

## 6. API contracts

Global prefix `/api`. Errors are always `{ statusCode: number, message: string }` (message is a joined string even when validation produces arrays). Because of `whitelist: true`, request bodies must match DTO fields exactly — extra fields are silently stripped.

### Auth (public except me/profile)

| Method | Path | Auth | Body | Response |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `{firstName, lastName, email, password, phone}` | `{accessToken, refreshToken, user}` (409 if email/phone taken) |
| POST | `/api/auth/login` | — | `{email, password}` | `{accessToken, refreshToken, user}` |
| POST | `/api/auth/refresh` | — | `{refreshToken}` | `{accessToken, refreshToken, user}` |
| GET | `/api/auth/me` | Bearer | — | `UserModel` |
| PATCH | `/api/auth/profile` | Bearer | partial profile (+optional new password) | `UserModel` |

`user.role` ∈ `'CUSTOMER' | 'ADMIN'` (uppercase — mirrors the Prisma enum).

### Products / Categories

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/products` | — | query: `search, category (slug), minPrice, maxPrice, sort (newest\|priceAsc\|priceDesc), page, pageSize` → `{items, total, page, pageSize, totalPages}` |
| GET | `/api/products/:slug` | — | detail incl. `variants[]` (size, stock, optional override price) |
| POST/PATCH/DELETE | `/api/admin/products…` | Admin | variants upserted on edit; delete cascades variants |
| GET | `/api/categories` | — | active categories |
| POST/PATCH/DELETE | `/api/admin/categories…` | Admin | delete → 409 if category still has products |

### Cart / Addresses / Orders (all JwtAuthGuard)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/cart` | upserts an empty cart if none exists |
| POST | `/api/cart/items` | `{productId, variantId, quantity}`; merges duplicate lines; 400 if total quantity exceeds variant stock |
| PATCH/DELETE | `/api/cart/items/:id` | ownership checked via the user's cart |
| GET/POST | `/api/addresses` | list/create for current user |
| PATCH/DELETE | `/api/addresses/:id` | ownership enforced in service |
| POST | `/api/orders` | `{shippingAddressId, shippingMethod, paymentMethod, notes?}` → creates order transactionally (see flow above). Only creation exists so far — no list/detail endpoints yet |

### Upload / Health (public)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/upload` | multipart field `file` → `{ url: "/uploads/<uuid>.<ext>" }` |
| POST | `/api/upload/multiple` | field `files` (≤10) → `{ urls }` |
| GET | `/api/health` | `{ status: "ok" }` |

Upload URLs are relative paths served by the backend's `ServeStaticModule`; store them directly on models and use them as `<img src>`.

**Boundary gotchas**: IDs are UUID strings (never numbers) · `price`/`unitPrice`/`totalAmount` arrive as **strings** (Prisma `Decimal` serialization — parse with `Number()` before arithmetic) · `images` is a JSON array of URL strings (first element = thumbnail).

## 7. Database

Schema: `backend/prisma/schema.prisma` (single source of truth; 11 models + 5 enums: `Role`, `OrderStatus`, `PaymentStatus`, `ShippingMethod`, `PaymentMethod`).

Key relations & constraints (verified):

- `User` — unique `email` **and** unique `phone`; has many `addresses`/`orders`, optional one-to-one `cart`.
- `Category` — unique slug; has many products/portfolio.
- `Product` — unique slug, `price Decimal`, `images Json`; many `variants` (`size` string, `stock` int, nullable price that falls back to product price).
- `Cart` — `userId @unique` (exactly one per user). `CartItem` cascades on cart delete; FKs to product + variant.
- `Address` — belongs to user, `isDefault` flag. Note: **`Order.shippingAddressId` is a plain string, NOT a Prisma relation/FK to Address** — deleting an address never breaks historical orders (reason undocumented in repo — treat as intentional denormalization, don't "fix" casually).
- `OrderItem` — denormalized **snapshot** (`productName`, `productImage`, `size`, `unitPrice`, `totalPrice`), cascade-deleted with its order; no relation to ProductVariant.
- `Portfolio` and `ContactMessage` exist in schema but have **no backend module/API yet** (schema-ahead-of-implementation).

Workflow: migrations only via Prisma (`npm run prisma:migrate` dev / `prisma:deploy` prod-style), config in root `prisma.config.ts` (loads `.env` via dotenv, seed via `tsx backend/prisma/seed.ts`). The generated client goes to `backend/src/generated/prisma` (gitignored — regenerate with `npm run prisma:generate`; the build does it automatically). Seed: idempotent upserts creating the admin user (email from `SEED_ADMIN_EMAIL`, default `admin@sewing.local`) plus categories men/women/kids and sample products.

## 8. State management (@ngrx/signals)

Two kinds of stores, deliberately split:

| Store | Scope | State | Purpose |
|---|---|---|---|
| `AuthStore` | root (`providedIn: 'root'`) | `{accessToken, refreshToken, user, loading}` | session; consumed by guards + interceptor + navbar |
| `CartStore` | root | `{cart, loading}` + computed `items/totalItems/totalPrice` | server-cart cache; navbar badge reads `totalItems()` |
| `CatalogStore`, `ProductDetailStore`, admin product/category/form stores, `AddressesStore`, `CheckoutStore` | component/route-scoped (`providers: [...]` on the page) | per-feature lists, flags | die with the route; fresh state per visit |

Patterns used everywhere:

- Async work via `rxMethod` + `tapResponse` (success patches state, error patches `loading:false` and shows a toast through `NotificationService` reading `err.error?.message`).
- Loading/error are plain boolean signals in state; derived data uses `withComputed` (e.g. cart totals reduce over items).
- When one store method must call a sibling method (mutate then reload), they live in **separate `withMethods` blocks** — within one block sibling methods aren't typed yet.
- The **server is the source of truth** for domain data: every mutation endpoint returns the fresh entity/collection and the store replaces its cache wholesale (no optimistic updates).

## 9. Error handling

```
Prisma/validation failure
  → NestJS exception (ConflictException, UnauthorizedException, NotFoundException, BadRequestException…)
    → global HttpExceptionFilter  →  { statusCode, message }   (messages joined into one string)
      → Angular HttpClient error
        → 401? authInterceptor tries refresh once, else logout
        → store catch → NotificationService.show('error', err.error?.message)
          → <app-notification> toast in the root shell
```

Typical statuses: 400 DTO/stock/cart-empty · 401 invalid credentials/expired token · 403 non-admin on admin route · 404 missing entity/address · 409 duplicate email/phone or non-empty category delete · 500 fallback "Internal server error".

## 10. Configuration

`.env` at the repo root (gitignored — names only, never commit values):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Prisma datasource + `PrismaService`) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Separate signing secrets for the two token types |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | Token lifetimes (defaults `'15m'` / `'7d'`) |
| `PORT` | Backend port (default 3000) |
| `SEED_ADMIN_EMAIL` | Overrides seed admin email (default `admin@sewing.local`) |

Other config surfaces: `ConfigModule.forRoot({ isGlobal: true })` reads `.env` from the process cwd; `prisma.config.ts` (root) loads `.env` for CLI commands; `frontend/proxy.conf.json` proxies `/api` + `/uploads` to `localhost:3000`; `nest-cli.json` sets `sourceRoot: backend/src`; Tailwind design tokens in `tailwind.config.js`; localStorage keys: `accessToken`, `refreshToken`, `app-theme`, `app-language`.

## 11. Deployment / DevOps

Dev setup only: `npm run dev` runs both servers concurrently. `npm run build` produces `dist/backend` + `dist/frontend`; `npm start:prod` runs `node dist/backend/src/main`. Uploaded files live in `uploads/` (created on boot, served statically at `/uploads`). No Docker, CI/CD, or reverse proxy configuration exists — *Unknown / not confirmed from the current codebase*.

## 12. Key decisions & why

### Single-package monorepo (frontend + backend + shared in one package)
- **Decision**: one root `package.json`/lockfile/toolchain; `frontend/` + `backend/` are folders; cross-half code in root `shared/` via `@domain/*` (frontend) and relative imports (backend).
- **Reason**: one install, one TypeScript/ESLint/Prettier version, shared models guarantee the API contract compiles on both sides.
- **Alternatives**: npm workspaces; separate repos; Nx.
- **Trade-off**: can't upgrade Angular deps independently of Nest; alias trick needed because backend emits CJS without path rewriting.

### SignalStore instead of classic NgRx store / RxJS services
- **Decision**: `@ngrx/signals` for all feature state; root stores only for auth + cart.
- **Reason**: signal-native (matches Angular 19 direction), far less boilerplate than actions/reducers/effects, `rxMethod` gives cancellable async workflows with `tapResponse` error handling; component-scoped stores give automatic reset on navigation.
- **Alternatives**: classic `@ngrx/store` + effects; component-local signals + services; Angular `resource()`.
- **Trade-off**: smaller ecosystem/mature docs than classic NgRx; team must learn `withMethods` splitting for sibling calls.

### Stateless JWT refresh without rotation or revocation
- **Decision**: refresh token is just a second signed JWT with a separate secret and 7-day expiry; no DB table, no rotation, no blacklist.
- **Reason**: minimal auth module for an MVP; no extra DB round-trips on refresh.
- **Alternatives**: opaque rotating refresh tokens persisted per-session; Redis denylist.
- **Trade-off**: a stolen refresh token is valid until expiry and cannot be revoked — acceptable for MVP, revisit before real money/users.

### Server-side cart (PostgreSQL), not localStorage
- **Decision**: one `Cart` row per user; every mutation revalidates variant stock server-side.
- **Reason**: cart survives device switches and logout; stock rules can't be bypassed client-side; order creation reads the same rows atomically.
- **Alternatives**: localStorage cart synced on login (guest checkout would be easier, but sync conflicts + weaker stock guarantees).
- **Trade-off**: guests can't accumulate a cart before logging in — solved with the `returnUrl`/`autoAdd` login-return flow instead.

### Order placement inside a single Prisma `$transaction`
- **Decision**: validate cart + address + stock outside, then create order + snapshot items + decrement stock + clear cart in one interactive transaction.
- **Reason**: money-critical invariant — either the whole checkout lands or nothing does; snapshots keep historical orders stable when products change later.
- **Alternatives**: separate calls with compensating logic; DB triggers.
- **Trade-off**: long transactions under load; stock decrement isn't guarded against negative oversell races beyond the pre-check (fine at this scale).

### Money crosses the boundary as strings
- **Decision**: Prisma `Decimal` fields are serialized to strings in shared `*Model` mappers before leaving the backend; frontend parses with `Number()` only at display/arithmetic time.
- **Reason**: avoids silent float precision loss on prices; JSON numbers would lose exactness for currency.
- **Alternatives**: integer minor units (toumans); serializing Decimal objects.
- **Trade-off**: every consumer must remember to parse; TypeScript can't distinguish "numeric string" from other strings.

### Global `ValidationPipe({ whitelist: true, transform: true })`
- **Decision**: every request body passes class-validator DTOs; undeclared properties are stripped, JSON is coerced into DTO instances.
- **Reason**: mass-assignment protection for free (client can't inject `role: 'ADMIN'`); controllers stay clean.
- **Alternatives**: manual validation per handler; schema validation libs (zod).
- **Trade-off**: adding a DTO field you forget to decorate gets silently dropped — subtle bugs if the DTO lags behind the model.

### Persian-aware slugify
- **Decision**: slugs transliterate Persian → Latin (e.g. جلیقه → latin), with a `randomUUID()` fallback for empty results.
- **Reason**: Persian-only slugs produce ugly percent-encoded URLs; transliteration keeps them readable and non-empty.
- **Alternatives**: keeping Unicode slugs; numeric IDs in URLs.
- **Trade-off**: transliteration is lossy/hard to reverse — slugs are identity, not human decoding.

## 13. Concept bridges — NestJS ↔ Angular (learning map)

You know Angular; here is what each backend piece corresponds to:

| You know (Angular) | Meets (NestJS) | Difference that matters |
|---|---|---|
| Standalone providers / `NgModule` | `@Module()` | Same DI idea; Nest modules wire controllers + providers per feature |
| Route Guards (`canActivate`) | Guards (`JwtAuthGuard`, `RolesGuard`) | Client guards gate *navigation* (UX); Nest guards admit/deny the actual *HTTP request* before the controller — the real security boundary |
| `HttpInterceptor` (attach token, retry) | Passport strategy + guards | Your interceptor attaches the header; Passport's `jwt.strategy` is the counterpart that parses/verifies it server-side |
| Reactive Forms validators + `app-form` | DTOs + global `ValidationPipe` | Same job at the opposite edge: instant feedback vs. untrusted-input enforcement; identical regexes duplicated on purpose |
| Component delegating to a store/service | Controller delegating to a service | Both stay thin; business logic lives one layer deeper |
| `rxMethod` + `tapResponse` | `async` service methods | rxMethod adds cancellation (re-entry cancels the previous run); backend methods are plain awaited promises per request |
| `ControlValueAccessor` | — | Adapter pattern letting custom elements join `formControlName`; no direct Nest analog |
| `ApiService` wrapper | `PrismaService` (extends `PrismaClient`) | Each half funnels ALL I/O through one typed gateway |
| `ngOnInit` / `OnDestroy` | `onModuleInit` / `onModuleDestroy` | Lifecycle hooks for resource setup/teardown (DB connect/disconnect) |
| Signals `patchState` | — | Immutable-ish state updates; backend state lives in PostgreSQL, not memory |

Also note the two 401/403 semantics (401 triggers the client auto-refresh; 403 means logged in but forbidden — the interceptor ignores 403).

## 14. Conventions & things NOT to change casually

- **Error body shape `{ statusCode, message }`** (filter joins array messages) — the frontend reads exactly `err.error?.message`.
- **Refresh contract**: `POST /api/auth/refresh` must return `{ accessToken, refreshToken, user }` — the interceptor destructures precisely that.
- **localStorage keys** `accessToken` / `refreshToken` / `app-theme` / `app-language` — seeding, restore-on-refresh, and theme/language persistence depend on them.
- **Field-name contract**: camelCase model fields mirror DTOs 1:1 (`firstName`, `postalCode`…) — renaming one side breaks compile-time safety; keep it that way.
- **Uppercase enum values** (`'ADMIN'`, `'PENDING'`) mirror Prisma enums; compare via `shared/const/*` const objects (`USER_ROLES`, `ORDER_STATUSES`, …), never inline literals.
- **Decimal-as-string, UUID-as-string, images-as-array** boundary rules (§6 gotchas).
- Upload URLs are always relative `/uploads/...` served by the backend — don't absolutize or move serving to the frontend.
- i18n: every user-facing string is a key existing in **both** `en.json` and `fa.json`; dates leave the backend as ISO UTC and get formatted by `LocalizedDatePipe` (Jalali for fa).
- `#private` fields everywhere (never TS `private`); controllers delegate, services own logic; one dto file per body shape.

## 15. Current state & next steps

### Angular 22 modernization — 2026-09-18

The modernization plan lives in `specs/README.md` and specs 000–002. The Angular 19 app described elsewhere in this document remains the running feature-complete reference. `frontend-next/` is a temporary Angular 22.1 workspace; its separate package/lockfile will be merged back into the root single-package layout at parity. Backend and shared wire contracts remain unchanged.

Foundation infrastructure is implemented (Tailwind v4, Material 22, zoneless Vitest, language/theme services). Bootstrap restores preferences, defaulting to Persian/RTL. Translation is a pure pipe with an explicit language argument: `key | translate: i18n.language(): params`; reading a signal only inside a pure pipe does not invalidate its cached result. Material uses native animations without the old animation provider.

The auth transport slice is wired and tested: `AuthSessionStore` owns tokens/user, `AuthApi` owns HTTP calls, functional guards protect routes, and injector-scoped `AuthRefresh` coordinates concurrent refreshes. Tokens attach only to relative `/api/` calls other than login/register/refresh. Retries are bounded to one, and stale refresh responses cannot resurrect a cleared/replaced session. TanStack Query is configured for server state (`retry: 1`, 30-second staleness, no window-focus refetch, no mutation retries).

The auth shell, login/register/profile pages, Signal Forms, Material fields and lazy routes now build. Still pending: shared TanStack mutation definitions, query-owned profile restoration (including waiting before restored-admin role checks), password-match coverage, catalog, cart/checkout, admin, and final cutover. Specs 003–006 are planned, not written. Continue spec 002; do not regenerate the scaffold. Validate with `npm --prefix frontend-next run build`, `npm --prefix frontend-next test -- --watch=false`, and `npx --no-install eslint 'frontend-next/src/**/*.ts'` from the root.

Done: Phases 0–3 (backend foundation, auth frontend + layout, products/categories with admin panel, cart/addresses/checkout + order creation). Next per `PLAN.md §8`: Phase 4 (order history/admin order management, receipt upload), Phase 5 (portfolio/contact), Phase 6 (dashboard/customers/messages/settings), Phase 7 (polish/SEO/error states), Phase 8 (Zarinpal + SMS). Update this file — not PLAN.md — when those land.
