# Logs

## [0.3.0] - 2026-09-24

### Added
- **Phase 5 — Portfolio + Contact** (backend + public pages + admin)
- Backend: `backend/src/portfolio` — `GET /api/portfolio` (paginated, active only, `category`/`search` filters), `GET /api/portfolio/:slug`, and admin CRUD at `/api/admin/portfolio`; Persian titles transliterate to readable slugs via the existing `slugify`
- Backend: `backend/src/contact` — public unauthenticated `POST /api/contact`, plus `/api/admin/messages` (paginated, `isRead` filter, `unreadCount`), `PATCH :id/read`, `DELETE :id`
- Frontend: `/portfolio` gallery (category filter, pagination) and `/portfolio/:slug` detail reusing `ImageGalleryComponent`
- Frontend: `/contact` (form with validation + shop contact details) and `/about` (static i18n copy)
- Admin: `/admin/portfolio` list, `/admin/portfolio/new` + `/:id/edit` form with multi-image upload, `/admin/messages` with read/unread filtering
- Shared: `shared/models/portfolio.ts`, `shared/models/contact.ts`
- i18n: 33 Phase-5 keys added to `en.json` + `fa.json` (238 keys each, parity verified)

### Fixed
- `CategoriesService.remove` only counted products, so deleting a category referenced by a portfolio item surfaced a raw Prisma foreign-key error as a 500. It now checks both relations and returns a 409 `ConflictException`, which the existing frontend already maps to `cannotDeleteCategory`.
- Renamed a local `input` variable that shadowed Angular's imported `input` in `orders/pages/order-detail.ts` and `admin/pages/portfolio-form.ts` (ESLint `no-shadow`).

### Updated
- `main.route.ts` — added `/portfolio`, `/portfolio/:slug`, `/about`, `/contact` and the admin `portfolio*`/`messages` children. The navbar and footer already linked the three public routes, which previously fell through the `**` catch-all to the home page.
- `admin-layout.ts` — "Manage portfolio" and "Messages" sidebar entries

## [0.2.0] - 2026-09-23

### Added
- **Phase 4 — Orders** (backend + customer frontend + admin)
- Backend: `GET /api/orders` (paginated, status filters), `GET /api/orders/:id`, `PATCH /api/orders/:id/receipt`, `PATCH /api/orders/:id/cancel` in `backend/src/orders`
- Backend: `AdminOrdersController` (`/api/admin/orders`) — list with status/paymentStatus/search filters, detail, `PATCH :id/status`, `PATCH :id/payment`
- Backend: `STATUS_TRANSITIONS` state machine enforcing the PLAN.md §7 order lifecycle; illegal transitions return 400 and `DELIVERED`/`CANCELLED` are terminal
- Backend: cancellation restores variant stock in the same transaction as the status change
- Schema: `Order.paymentReceipt`, `Order.shipping*` address snapshot, `OrderItem.variantId`; migrations `20260923173302_orders_phase4` and `20260923185904_order_item_variant_id` backfill existing rows
- Frontend: `/orders` OrderHistoryPage and `/orders/:id` OrderDetailPage with card-to-card bank details and receipt upload
- Frontend: `/admin/orders` list (filters, search, pagination) and `/admin/orders/:id` detail with status management, tracking code, and receipt review (confirm/reject payment)
- Shared: `OrderStatusBadgeComponent`, `AdminOrderModel`/`PaginatedOrdersModel` in `shared/models/order.ts`, `BANK_CARD` const
- i18n: 45 Phase-4 keys added to `en.json` + `fa.json` (205 keys each, parity verified)

### Updated
- `main.route.ts` — added `/orders`, `/orders/:id`, `/admin/orders`, `/admin/orders/:id`
- `admin-layout.ts` — "Manage orders" sidebar entry
- Checkout now redirects to `/orders/:id` after placing an order (previously `/`), where the payment instructions live

## [0.1.0] - 2026-08-13

### Added
- **Phase 2 — Products + Categories** (backend + frontend + admin)
- Backend: Category CRUD + Product CRUD (variants, image upload) in `backend/src/categories` and `backend/src/products`, registered in `app.module.ts`; seed data (3 categories, 5 products)
- Backend: `slugify` util with Persian→Latin transliteration + random fallback (`backend/src/common/utils/slugify.ts`)
- Frontend: public catalog (`/products`) with grid, search (debounced), category/sort/price filters, pagination
- Frontend: product detail (`/products/:slug`) with image gallery, size selector, stock display, add-to-cart (login-gated)
- Frontend: admin panel (`/admin`, adminGuard) — category list + product list (search, pagination) + product form (variants, images, toggles, category select)
- Shared: `ImageGalleryComponent`, `ToggleComponent`, `LocalizedNumberPipe`, `UploadService`, `UploadResponseModel`
- i18n: Phase-2 keys added to `en.json` + `fa.json`

### Updated
- `main.route.ts` — `/products`, `/products/:slug`, `/admin` (with children: products, products/new, products/:id/edit, categories)
- `button.ts` — added `ariaLabel` input
- `forms/product.ts` — nonNullable arrays, typed `payload` getter
- SignalStore patterns — methods that reload after mutations live in a second `withMethods` block (type-safe sibling calls)

## [0.0.2] - 2026-07-26

### Updated
- Synced shared components with taskflow-fullstack reference (input, textarea, select)
- Replaced JalaliDatePipe with LocalizedDatePipe (dual calendar: Gregorian + Jalali)
- Added core infrastructure: auth guard, auth interceptor
- Added shared utilities: HTTP_METHODS constant, PasswordFormService
- Updated ESLint config with DRY rules (no-duplicate-imports, prefer-const, no-var)
- Updated styles.css with status filter responsive styles
- Updated project AGENTS.md with full component/service/pipe listings

## [0.0.1] - 2025-07-18

### Added
- Angular 19 standalone frontend
- Tailwind CSS with design tokens
- Dark/light mode (ThemeService)
- i18n — English + Persian with RTL (LanguageService)
- Custom element library: button, input, select, textarea, card, form, confirm-dialog, confirm-bottom-sheet, theme-toggle, language-toggle
- TranslatePipe, LocalizedDatePipe
- ApiService (generic HTTP wrapper)
- Jest testing setup with zoneless environment
- ESLint + Prettier
- Angular Material (dialogs, bottom sheets)
- @ng-select (searchable dropdowns)
- @ngrx/signals (SignalStore)
- date-fns-jalali (Jalali date formatting)
