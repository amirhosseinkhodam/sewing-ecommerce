# 001 — Foundation: Workspace, Styling, Providers, i18n

**Status**: In progress — infrastructure verified; toolbar/footer pending · **Depends on**: [000](000-architecture.md)

## 1. Intent

Stand up an Angular 22 workspace that later feature specs can build on without revisiting configuration: CLI-generated scaffold, Tailwind v4, Material theming with RTL + dark mode, the provider set, and the i18n mechanism.

## 2. Workspace scaffold

Created with the CLI per `angular-new-app` (no version pin — v22 is latest stable, and the skill says not to specify a version unless asked):

```bash
npx @angular/cli@latest new frontend-next --style=css --ssr=false \
  --prefix=app --ai-config=none --interactive=false
```

Flag reasoning:

- `--style=css` — Tailwind v4 is CSS-first; SCSS bought only the `#{!important}` interpolation used by the ng-select overrides being deleted. The `tailwind-css.md` reference gives `@import 'tailwindcss'` for CSS as the standard path.
- `--ssr=false` — the app is a dev-proxy SPA today with no SSR configuration (`PROJECT_KNOWLEDGE.md` §11 records deployment as unconfigured). Adding SSR would be new scope, not modernization.
- `--ai-config=none` — this repo already has `AGENTS.md`; a second generated agent config would compete with it.
- Tests **not** skipped — spec 006 reinstates them.

Not renamed to `frontend/` until parity (000 §8), so the working app stays available for behavioral comparison.

### Inherited v22 defaults — kept deliberately

Zoneless change detection, `@angular/build:application` builder, `@angular/build:unit-test` (Vitest), TypeScript 6.0, `provideBrowserGlobalErrorListeners()`, production budgets. All verified present in a scratch `ng new` run.

## 3. Dependencies

```bash
ng add @angular/material        # theming + typography + animations wiring
ng add tailwindcss              # v4 + @tailwindcss/postcss + .postcssrc.json
npm i @angular/aria @ngrx/signals @tanstack/angular-query-experimental \
      date-fns date-fns-jalali
```

`ng add` over `npm install` for Angular libraries, per `cli.md`: "ALWAYS use `ng add`… installs the package AND runs initialization schematics."

## 4. Styling

`src/styles.css` — Tailwind v4 CSS-first, no `tailwind.config.js` (the reference is explicit that creating one "will break the application build"):

```css
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --font-sans: 'Amiri', Tahoma, Arial, sans-serif;
  --radius-card: 1rem;
  --radius-control: 0.5rem;
  --radius-container: 0.75rem;
}
```

Design tokens carry over from `tailwind.config.js` as `@theme` variables. The `dark` variant is declared explicitly because the app toggles a `.dark` class on `<html>` rather than using `prefers-color-scheme`, preserving the existing user-controlled theme.

**RTL**: `tailwindcss-rtl` is dropped (abandoned 2022, v3-only). Tailwind v4's logical properties replace it — `ps-*`/`pe-*`/`ms-*`/`me-*`/`text-start`/`text-end` follow `dir` natively, so a single class set serves both directions. This is strictly better than the plugin for a Persian-first app.

**Material theming**: Material 3 with a light/dark color scheme driven by the same `.dark` class, so Material components and Tailwind utilities stay visually consistent. No `::ng-deep`; the ~90 lines of ng-select overrides are deleted with the library.

## 5. Providers

`src/app/app.config.ts`:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions(), withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideTanStackQuery(new QueryClient({ /* see 002 */ })),
  ],
};
```

- `provideHttpClient(withInterceptors(...))` — `http-client.md`: functional interceptors preferred; the provider is needed here specifically to register one.
- `withComponentInputBinding()` — lets routed pages take route params as signal `input()`s instead of injecting `ActivatedRoute`.
- `withViewTransitions()` — `route-animations.md`, native View Transitions API.
- Zoneless is the default; no change-detection provider is added.
- Material 22 uses native animations. Do not register `provideAnimationsAsync()` or import the legacy animations package: the temporary workspace can otherwise resolve Angular 19 animations from the parent installation.

## 6. i18n

Existing mechanism reused in shape (en/fa JSON dictionaries + a `translate` pipe) because it is a product requirement with full key parity, but with the performance defect fixed.

**Current defect**: `TranslatePipe` is `pure: false`, so `transform` re-runs for every interpolation on every change detection cycle, plus it holds an `effect` and a manual `markForCheck`.

**Target**: a **pure** pipe with an explicit language argument: `key | translate: i18n.language(): params`. Reading a signal only inside `transform` does not invalidate Angular's cached pure-pipe result when its arguments are unchanged. The language argument makes the dependency part of the cache key. A rendered-template regression test must verify switching both ways, including inside control-flow blocks. `pipes.md` prefers pure pipes; best practices warn against `effect` for state propagation.

`LanguageService` → `@Service()`, exposing `readonly language = signal<Language>()`, and setting `<html lang>`/`<html dir>`. Writing to `document` is genuine DOM-sync side-effect work, which `effects.md` lists as a valid `effect` use — it stays, unlike the state-propagating effects being removed.

`ThemeService` → `@Service()`, same pattern, `.dark` class on `<html>`, persisted to `app-theme`.

Both preferences are initialized at application startup, before the first component renders. New visitors default to Persian/RTL; valid stored language choices take precedence.

## 7. Root shell

`app.ts` — a shell with one responsibility, matching the current structure (toolbar / outlet / footer / toast). Toolbar, footer and toast each live in their own component; the shell composes and holds no logic.

## 8. Acceptance criteria

- [x] `ng build` succeeds; `ng test` runs; `ng version` reports Angular 22.1.x
- [x] No `tailwind.config.js`; `styles.css` uses `@import 'tailwindcss'`, never `@tailwind` directives
- [x] `.postcssrc.json` registers `@tailwindcss/postcss`
- [ ] No `tailwindcss-rtl`; RTL achieved with logical properties, verified in fa and en
- [ ] Dark mode toggles via `.dark` on `<html>`, persists to `app-theme`, and restyles Material and Tailwind surfaces consistently
- [x] `<html lang>` and `<html dir>` track the selected language; choice persists to `app-language`
- [x] `TranslatePipe` is pure; changing language updates all visible text
- [x] Missing key falls back to English, then to the key itself (current behavior preserved)
- [x] en/fa dictionaries have identical key sets
- [x] `LanguageService` and `ThemeService` use `@Service()` and expose readonly signals
- [x] Amiri font and the card/control/container radii are available as theme tokens

## 9. Verification checkpoint — 2026-09-18

The temporary workspace has Angular framework/Material/CDK/Aria 22.1.7, CLI/build 22.1.8, NgRx 22.0.1 and TypeScript 6.0.3 installed without invalid direct dependencies (`npm ls --depth=0`). No dependency upgrade or workspace regeneration is needed for this slice. Root Angular 19 dependencies intentionally remain until cutover (000 §8).

The production build and Vitest suite verify providers, stored preferences, dictionary parity and language changes in rendered templates. Theme/RTL visual verification remains pending with the real shell and pages. The root ESLint configuration now includes `frontend-next/src` and its Vitest globals; run it without `--fix` for verification.
