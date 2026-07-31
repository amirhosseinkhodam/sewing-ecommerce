# Tailor Ecommerce — AGENTS.md

> General conventions (naming, styling, components, forms, i18n, state management, custom elements, modern Angular syntax, DRY, etc.) are in `~/.config/opencode/AGENTS.md`. This file only contains project-specific details.

## Overview

Persian-first, mobile-responsive tailor shop ecommerce website with guest browsing, customer cart/checkout, admin panel for full management, card-to-card payment (Zarinpal in Phase 8), and SMS notifications (Phase 8).

## Quick commands

| Command | Action |
|---|---|
| `npm start` | Dev server on `localhost:4200` |
| `npm run build` | Production build |
| `npm run lint` | ESLint — checks `src/**/*.ts`, `tests/**/*.ts` |
| `npm run format` | Prettier — writes `src`, `tests` |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode |
| `npm run test:cov` | Coverage report |

Test files live in `tests/`, mirroring the `src/` directory structure. They import source files via relative paths.

## Architecture

- **Frontend**: Angular 19 standalone (no `NgModule`). Uses `bootstrapApplication` with `provideHttpClient()` and `provideRouter()`.
- **Backend**: NestJS + Prisma + PostgreSQL (separate repository)
- **Styling**: Tailwind CSS with custom design tokens in `tailwind.config.js`. No CSS/SCSS in components.
- **i18n**: English (`en`) and Persian (`fa`, RTL). Translation files in `src/app/i18n/`.
- **Dark mode**: ThemeService with signal-based state, persists to localStorage.
- **State management**: `@ngrx/signals` (`signalStore`) for feature state.
- **Testing**: Jest with `jest-preset-angular`. Zoneless test environment.
- **Payment**: Card-to-card (primary), Zarinpal (Phase 8)
- **SMS**: Kavenegar integration (Phase 8)

## Current Progress

### Phase 0 — Backend Foundation (3 days)
- [ ] Initialize NestJS project with Prisma + PostgreSQL
- [ ] Define all Prisma models + run migrations + seed
- [ ] Auth module: JWT, bcrypt, Passport strategies
- [ ] File upload module (Multer)
- [ ] Global guards, filters, pipes
- [ ] Swagger/OpenAPI docs

### Phase 1 — Auth Frontend + Layout (3 days)
- [x] AuthGuard + AdminGuard (wired to AuthStore)
- [x] AuthInterceptor (attach JWT + handle 401 with refresh)
- [x] Shared layout: Navbar (logo, nav links, cart badge, login/profile dropdown), Footer
- [x] LoginPage + RegisterPage
- [x] AuthStore (SignalStore, `providedIn: 'root'`)
- [x] ProfilePage

### Phase 2 — Products + Categories (4 days)
- [ ] Backend: Category CRUD
- [ ] Backend: Product CRUD + variants + image upload
- [ ] Admin: CategoryListPage
- [ ] Admin: ProductListPage + ProductFormPage
- [ ] Public: CatalogPage (grid, filters, pagination, search)
- [ ] Public: ProductDetailPage (gallery, sizes, add-to-cart)

### Phase 3 — Cart + Checkout (4 days)
- [ ] Backend: Cart CRUD
- [ ] Backend: Address CRUD
- [ ] Frontend: AddressManagementPage
- [ ] Frontend: CartPage
- [ ] Frontend: CheckoutPage (multi-step stepper)
- [ ] Cart count badge in navbar

### Phase 4 — Orders (3 days)
- [ ] Backend: Order creation from cart
- [ ] Frontend: OrderHistoryPage + OrderDetailPage
- [ ] Admin: OrderListPage + status management + tracking
- [ ] Card-to-card payment receipt upload flow

### Phase 5 — Portfolio + Contact (2 days)
- [ ] Backend: Portfolio CRUD
- [ ] Admin: PortfolioListPage + PortfolioFormPage
- [ ] Public: PortfolioPage + PortfolioDetailPage
- [ ] Public: AboutPage
- [ ] Public: ContactPage
- [ ] Admin: MessagesPage

### Phase 6 — Admin Dashboard (2 days)
- [ ] Backend: Dashboard stats endpoint
- [ ] Frontend: DashboardPage (stats cards, charts, recent orders)
- [ ] Frontend: CustomerListPage
- [ ] Frontend: SettingsPage
- [ ] Admin layout (sidebar + header)

### Phase 7 — Polish + Launch (3 days)
- [ ] SEO meta tags for all pages (Title, Description, OG tags)
- [ ] Complete i18n pass (all Persian text verified)
- [ ] Loading skeletons for all data-fetching pages
- [ ] Error boundaries: API failure -> inline error + retry button, 404 page, 500 page
- [ ] Empty states: no products, no orders, no messages, empty cart
- [ ] Responsive audit (mobile/tablet/desktop)
- [ ] Image lazy loading, code splitting
- [ ] Build + deploy

### Phase 8 — Paid Services (2 days)
- [ ] Backend: Zarinpal integration (request + verify)
- [ ] Frontend: Zarinpal payment option in checkout
- [ ] SMS notification service (Kavenegar)
- [ ] SMS on order status transitions

**Total estimate: ~26 working days**

> Full details: Database schema, API endpoints, routes, workflows, i18n keys, and technical decisions are in `PLAN.md`.
