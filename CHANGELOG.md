# Logs

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
