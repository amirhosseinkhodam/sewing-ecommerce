# Angular Base Template

A pre-built Angular 19 starter with dark/light mode, i18n (English + Persian), custom element library, Tailwind CSS, and testing — ready to clone and go.

## Quick Start

```bash
# Clone the template
git clone <repo-url> my-new-project
cd my-new-project

# Install dependencies
npm install

# Start dev server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## What's Included

| Feature | Status |
|---|---|
| Angular 19 standalone components | Done |
| Dark/light mode (ThemeService) | Done |
| i18n — English + Persian (LanguageService) | Done |
| RTL support (tailwindcss-rtl) | Done |
| Custom element library (10 components) | Done |
| Design tokens (Tailwind config) | Done |
| Jest testing setup | Done |
| ESLint + Prettier | Done |
| RxJS + @ngrx/signals | Done |
| Angular Material (dialogs, bottom sheets) | Done |
| @ng-select (searchable dropdowns) | Done |

## Custom Components

| Component | Selector | Description |
|---|---|---|
| ButtonComponent | `<app-button>` | Multi-variant button (primary, secondary, destructive, ghost, mat-*) |
| InputComponent | `<app-input>` | Text input with label, error states, CVA |
| SelectComponent | `<app-select>` | Searchable dropdown via @ng-select |
| TextareaComponent | `<app-textarea>` | Multi-line input with label |
| CardComponent | `<app-card>` | Content container with shadow/border variants |
| FormComponent | `<app-form>` | Reactive form wrapper with layout variants |
| ConfirmDialogComponent | `<app-confirm-dialog>` | Material dialog for confirmations |
| ConfirmBottomSheetComponent | `<app-confirm-bottom-sheet>` | Mobile-friendly bottom sheet |
| ThemeToggleComponent | `<app-theme-toggle>` | Animated dark/light toggle |
| LanguageToggleComponent | `<app-language-toggle>` | Language switcher |

## Project Structure

```
src/
├── main.ts                          # Bootstrap
├── styles.scss                      # Tailwind + Material + ng-select
├── app/
│   ├── app.ts                       # Root component
│   ├── main.route.ts                # Routes
│   ├── i18n/                        # Translation files
│   ├── core/
│   │   ├── services/               # ApiService (HTTP wrapper)
│   │   ├── guards/                 # authGuard, adminGuard
│   │   └── interceptors/           # authInterceptor
│   ├── shared/
│   │   ├── components/              # 10 reusable UI components
│   │   ├── services/                # ThemeService, LanguageService
│   │   ├── pipes/                   # TranslatePipe, LocalizedDatePipe
│   │   ├── forms/                   # PasswordFormService
│   │   ├── const/                   # HTTP_METHODS
│   │   └── models/                  # Shared types
│   └── features/
│       └── home/pages/              # Example page
tests/
└── app/shared/
    ├── services/                    # Theme + Language tests
    └── pipes/                       # Translate pipe tests
```

## Commands

| Command | Action |
|---|---|
| `npm start` | Dev server on localhost:4200 |
| `npm test` | Run all tests |
| `npm run test:watch` | Watch mode |
| `npm run test:cov` | Coverage report |
| `npm run build` | Production build |
| `npm run lint` | Lint + fix |
| `npm run format` | Format with Prettier |

## Adding a New Feature

1. Create `src/app/features/<name>/pages/<name>.ts` for the page component
2. Create `src/app/features/<name>/models/<name>.ts` for types
3. Create `src/app/features/<name>/store/<name>.ts` for SignalStore (if needed)
4. Create `src/app/features/<name>/forms/<name>.form.service.ts` for forms (if needed)
5. Add route in `src/app/main.route.ts`
6. Add translation keys in `src/app/i18n/en.json` and `fa.json`

## License

UNLICENSED
