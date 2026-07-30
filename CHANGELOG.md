# Logs

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
