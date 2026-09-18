# 000 — Target Architecture

**Status**: Accepted · **Scope**: whole frontend · **Supersedes**: `AGENTS.md` §Architecture, `PLAN.md` §2

## 1. Why this spec exists

The frontend is Angular 19.2.25 and builds cleanly. It is nevertheless being rebuilt rather than updated, because a large fraction of its code conflicts with the official Angular skills in ways that upgrading does not fix. This spec records the target and the reasoning so later specs can simply reference it.

### Verified facts driving the design

Checked directly against published packages on 2026-09-18, not assumed:

| Fact | Evidence |
|---|---|
| Angular latest stable is **22.1.7** | `npm view @angular/core dist-tags` → `latest: 22.1.7` |
| `@Service` decorator is real and shipped | `declare const Service: ServiceDecorator` in `@angular/core@22.1.7/types/core.d.ts:1322`, with `autoProvided` option |
| Signal Forms are shipped | `@angular/forms@22.1.7` exports `./signals` → `types/signals.d.ts` |
| Angular 22 apps are **zoneless by default** | `ng new` (v22) produces no `zone.js` dependency and no `polyfills` entry |
| Vitest is the built-in runner | `ng new` generates `"test": {"builder": "@angular/build:unit-test"}` + `vitest` devDependency |
| TypeScript 6.0 is the v22 baseline | generated `package.json` pins `typescript: ~6.0.2` |
| `@angular/aria` 22.1.7 is published | `npm view @angular/aria dist-tags` → `latest: 22.1.7` |
| Material/CDK, NgRx signals, TanStack Query all support v22 | peer ranges `^22.0.0`, `^22.0.0`, `>=16.0.0` respectively |
| `tailwindcss-rtl` is abandoned | last publish 2022-05-19, Tailwind v3 only |

## 2. Target stack

| Layer | Choice | Replaces |
|---|---|---|
| Framework | Angular **22.1.x**, zoneless, standalone | Angular 19 + zone.js |
| UI components | **Angular Material 22** + CDK | hand-rolled Tailwind component library, `@ng-select/ng-select` |
| Accessible primitives | **`@angular/aria`** where Material has no equivalent | — |
| Styling | **Tailwind CSS v4** (CSS-first config) | Tailwind v3 + `tailwind.config.js` + `tailwindcss-rtl` |
| Forms | **Signal Forms** (`@angular/forms/signals`) | Reactive Forms + form services + CVA wrappers |
| Server state | **TanStack Query** (`@tanstack/angular-query-experimental`) | `rxMethod` fetch/refetch chains |
| Client state | **NgRx SignalStore** (`@ngrx/signals` 22) | same, but scoped to genuine client state only |
| Icons | **Material Symbols** via `mat-icon` | `@hugeicons/angular` |
| Tests | **Vitest** via `@angular/build:unit-test` | none (was removed) |
| Dates | `date-fns` + `date-fns-jalali` | unchanged — no Material equivalent for Jalali |

### Dropped dependencies

`@ng-select/ng-select` (→ `mat-select`), `@hugeicons/angular` + `@hugeicons/core-free-icons` (→ `mat-icon`), `tailwindcss-rtl` (→ v4 logical properties), `zone.js` (→ zoneless), `@angular/platform-browser-dynamic` (unused), `autoprefixer`/`postcss` as direct deps (→ `@tailwindcss/postcss`).

## 3. Why Material replaces the existing component library

The user's instruction was to replace "Spartan UI" with Angular Material. **There is no Spartan UI in this repository** — no `@spartan-ng` dependency, no `hlm`/`brn` usage. The instruction is therefore applied to what actually occupies that role: the hand-rolled Tailwind component library in `frontend/src/app/shared/components/` plus `ng-select`.

That layer has concrete defects, which is why replacing rather than porting it is right:

- **`shared/components/button.ts`** (262 lines) parses Tailwind class strings with regex to synthesize hover shades (`#deriveHover`), emitting `!bg-blue-700`-style classes. It also carries five `mat-*` variants that reimplement Material's look in Tailwind instead of using Material. Both problems vanish with `matButton`.
- **`shared/components/form-field.ts`** recomputes validation errors in `ngDoCheck`, i.e. on every change detection cycle, with a manual JSON-compare guard to suppress the resulting churn. `mat-form-field` + Signal Forms replace it entirely.
- **`shared/components/input.ts` / `select.ts` / `textarea.ts`** are `ControlValueAccessor` wrappers. Signal Forms' `[formField]` makes the CVA layer unnecessary — the skills state plainly: "Signal Forms replace these concepts entirely."
- **`styles.scss`** carries ~90 lines of `::ng-deep`-style global overrides to restyle `ng-select`'s internals. Removing ng-select removes the need.

## 4. Anti-patterns to eliminate

Each is a direct conflict with the official skills, with the authority cited:

| Current code | Conflicts with | Fix |
|---|---|---|
| `effect()` that calls `.set()` to select a default address (`features/orders/pages/checkout.ts:394`) | `effects.md`: "**CRITICAL RULE: DO NOT use effects to propagate state**… causes infinite loops. Always use `computed()` or `linkedSignal()`" | `linkedSignal` |
| `standalone: true` on every component | best practices: "Must NOT set `standalone: true`… It's the default in v20+" | omit |
| `[ngClass]` in checkout and elsewhere | best practices: "Do NOT use `ngClass`, use `class` bindings" | `[class.x]` / `[class]` |
| `@ViewChild` decorator + `ElementRef` (`shared/components/input.ts`) | `migrations.md` signal-queries; best practices favor signal queries | `viewChild()` |
| `Injectable({providedIn:'root'})` on new singletons | best practices: "Prefer the `@Service` decorator… (v22+)" | `@Service()` |
| `*.component.ts` filenames / `XxxComponent` class names | `naming-conventions.md` "Intent over Role" for new v20+ projects | suffixless |
| Manual refetch-after-mutation chains (`addresses`, `catalog`, `checkout` stores) | — (correctness/DRY) | TanStack Query invalidation |
| 449-line `checkout.ts` holding 4 wizard steps | best practices: "Keep components small and focused on a single responsibility" | one component per step |
| `pure: false` `TranslatePipe` re-running on every CD cycle | `pipes.md` prefers pure pipes | pure pipe keyed on a language signal |

**Naming**: this is a new v22 workspace, so `naming-conventions.md` applies in its modern form — suffixless files and classes (`product-card.ts` → `class ProductCard`), `.model.ts` retained for interfaces. The convention check in that reference ("inspect adjacent files… if unsure use the traditional suffix") resolves to modern style because the workspace is new, not because the old one used suffixes.

## 5. State management: TanStack Query vs SignalStore

The user asked for both, "choosing the most appropriate solution for each use case." The split:

**TanStack Query — all server state** (anything owned by PostgreSQL and merely cached client-side). It provides caching, request dedup, `invalidateQueries`-driven refetch, and loading/error state for free — exactly the hand-rolled machinery in the current stores.

- Queries: products list, product detail, categories, cart, addresses, admin lists
- Mutations + invalidation: add/update/remove cart item, address CRUD, product/category CRUD, place order

**SignalStore — genuine client state only** (no server owner, must outlive a component):

- `AuthSession` — tokens + current user; read by the interceptor and guards
- Theme and language preferences

**Neither** — ephemeral UI state (wizard step, selected size, dialog open) stays in component `signal`/`linkedSignal`. It does not belong in a store.

This directly resolves a documented tension: `PLAN.md` §11 says "SignalStore for Auth only — everything else fetched via API service", while `PROJECT_KNOWLEDGE.md` §8 records seven stores actually built. TanStack Query is what the plan was reaching for.

> Note: `@tanstack/angular-query-experimental` is named "experimental" upstream. It is the only Angular binding TanStack publishes and is widely used in production; the risk is API churn on a future major, not instability. Accepted deliberately.

## 6. Directory structure

```
frontend/src/
├── main.ts                     bootstrapApplication(App, appConfig)
├── styles.css                  @import 'tailwindcss' + Material theme (CSS, not SCSS)
└── app/
    ├── app.ts                  root shell: toolbar / outlet / footer
    ├── app.config.ts           all providers
    ├── app.routes.ts           lazy routes
    ├── core/
    │   ├── auth/               session store, guards, interceptor, auth API
    │   ├── http/               api base, error normalization
    │   └── i18n/               language service, translate pipe, en/fa dictionaries
    ├── shared/                 cross-feature presentational pieces + pipes
    └── features/
        ├── home/  catalog/  cart/  checkout/  addresses/  admin/
        └── <feature>/{routes, pages, components, data, model}
```

`data/` holds the feature's query/mutation definitions and HTTP calls; `model/` holds `*.model.ts` types. Feature-local, not global.

## 7. Preserved contracts

The backend is out of scope, so every wire-level contract in `PROJECT_KNOWLEDGE.md` §14 is binding. Carried over verbatim:

- Error body is `{ statusCode, message }`; the client reads `err.error?.message`
- `POST /api/auth/refresh` returns `{ accessToken, refreshToken, user }`
- localStorage keys `accessToken`, `refreshToken`, `app-theme`, `app-language`
- Money crosses as **strings** (Prisma `Decimal`) — parse with `Number()` only at display/arithmetic
- IDs are UUID strings; `images` is a JSON array, first element is the thumbnail
- Uppercase enum values compared via `shared/const/*` objects, never inline literals
- Upload URLs stay relative `/uploads/...`
- Root `shared/` stays the single source of cross-half types, imported via `@domain/*`

Persian-first RTL and full en/fa parity are product requirements and are preserved.

## 8. Migration strategy

Greenfield, feature by feature, old app left running until the new one reaches parity:

1. Scaffold Angular 22 workspace with the CLI into `frontend-next/` (spec 001)
2. Port: foundation → core/auth → catalog → cart/checkout → admin (specs 001–005)
3. Tests alongside each feature (spec 006)
4. At parity: `frontend/` deleted, `frontend-next/` becomes `frontend/`, root configs updated
5. `npm run dev` (frontend + untouched backend) verified end to end

Root `package.json` keeps its single-package layout — that decision (`PROJECT_KNOWLEDGE.md` §12) is sound and orthogonal to the Angular version. Backend scripts, Prisma and `shared/` are not touched.

## 9. Acceptance criteria

- [ ] `ng build` and `ng test` pass; `ng version` reports Angular 22.1.x
- [ ] No `zone.js`, `@ng-select/ng-select`, `@hugeicons/*`, `tailwindcss-rtl`, or `tailwind.config.js` remain
- [ ] No `standalone: true`, no explicit `OnPush`, no `ngClass`/`ngStyle`, no `@ViewChild`/`@HostBinding`/`@HostListener` decorators
- [ ] No `FormControl`/`FormGroup`/`FormBuilder`/`ControlValueAccessor` imported from `@angular/forms`
- [ ] No `effect()` writes signal state; defaults derive via `computed`/`linkedSignal`
- [ ] Every singleton service uses `@Service()`; every injection uses `inject()`
- [ ] All server reads go through TanStack Query; SignalStore holds only session + preferences
- [ ] Files are suffixless per `naming-conventions.md`; interfaces keep `.model.ts`
- [ ] Every routed page lazy-loads; no component file exceeds ~150 lines
- [ ] All §7 contracts hold; en/fa keys stay at parity; RTL verified in both languages
- [ ] Static images use `NgOptimizedImage`; keyboard navigation and visible focus work
