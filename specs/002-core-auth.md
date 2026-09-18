# 002 — Core: HTTP, Session, Guards, Auth Forms

**Status**: In progress — auth pages, TanStack workflows, and profile restoration verified; admin restoration guard pending · **Depends on**: [000](000-architecture.md), [001](001-foundation.md)

## 1. Intent

Port the auth feature, which the old `AGENTS.md` designated "the reference feature — read this before building others." It keeps that role: whatever this spec establishes for HTTP, query setup, forms and error handling is the pattern every later feature follows.

Behavior is preserved exactly (the backend is untouched); the implementation changes substantially.

## 2. HTTP layer

**`ApiService` is deleted.** It wrapped `HttpClient` only to prefix `/api`, adding an indirection layer with no behavior — and `http-client.md` shows features injecting `HttpClient` into their own services directly. Each feature's `data/` service calls `HttpClient` with its own full paths. (Several feature services already bypassed `ApiService` anyway, so this also removes an inconsistency.)

**Error normalization.** The backend always returns `{ statusCode, message }` (`PROJECT_KNOWLEDGE.md` §9), and today ~12 call sites repeat `err.error?.message ?? fallback`. One helper replaces that duplication:

```ts
export function apiErrorMessage(error: unknown, fallback: string): string
```

It reads `HttpErrorResponse.error.message`, falling back to a translated default. This is the single place that knows the error contract.

## 3. Session state

`AuthSessionStore` — NgRx SignalStore, `{ providedIn: 'root' }`. This is the one place a store is right rather than TanStack Query: tokens are client-owned state read synchronously by the interceptor and guards, not server data.

State: `{ accessToken, refreshToken, user }`, seeded from `localStorage` (keys `accessToken`/`refreshToken` — contract, §7 of 000).

Computed: `isAuthenticated`, `isAdmin` (compares against `USER_ROLES.ADMIN` from `@domain/const/user-roles`, never a literal).

Methods: `setTokens`, `setUser`, `clear`.

Two changes from the current `AuthStore`:

- **No navigation.** The old store injected `Router` and navigated inside `login`/`logout`/`register`, mixing session state with routing. Navigation moves to the components that trigger it — the store only owns state.
- **No `loading` flag and no `rxMethod`.** Request lifecycle state comes from TanStack Query mutations.
- **Profile restore on boot** moves from `withHooks.onInit` to a `me` query enabled only when a token exists, so a page refresh still restores the session.

## 4. Interceptor

`authInterceptor` — functional, per `http-client.md` ("Prefer functional interceptors").

Behavior preserved: skip `/api/auth/refresh` (prevents loops) → attach `Authorization: Bearer <token>` → on **401** with a refresh token present, refresh once, store the new pair, retry the original request → if refresh fails, clear the session and redirect to `/`.

**Bug fixed in passing.** The current interceptor calls `inject(AuthService)` *inside* the `catchError` callback ([auth.interceptor.ts:26](../frontend/src/app/core/interceptors/auth.interceptor.ts#L26)). By then the injection context is gone — `injection-context.md` limits `inject()` to construction-time contexts — so the 401 refresh path throws instead of refreshing whenever it is reached outside a live context. Both dependencies are injected up front in the new version.

Concurrent 401s share a single in-flight refresh so a page issuing several requests at once does not fire several refreshes.

Refresh coordination is scoped to the application injector, not module-global state. Only relative `/api/` requests receive session credentials. Login, register, and refresh bypass bearer attachment and automatic refresh. A delayed 401 for an old access token retries with the already-rotated token without refreshing again. Each original request retries at most once; a retried 403/500 propagates without logging out. A retried 401 or failed refresh clears the matching session and redirects home. Logout or replacement of the session while refresh is pending must never restore the old session or clear the new one. Unsubscribing all waiting requests releases the pending refresh.

## 5. Guards

Unchanged in behavior, per `route-guards.md`: `authGuard` admits authenticated users else redirects to `/login` (preserving `returnUrl`); `adminGuard` requires authenticated **and** `isAdmin` else `/`. Both stay `CanActivateFn` and read the session store's computed signals.

## 6. Auth API + queries

`core/auth/auth-api.ts` (`@Service()`) — thin typed calls: `login`, `register`, `refresh`, `me`, `updateProfile`.

TanStack Query usage:

| Operation | Kind | Notes |
|---|---|---|
| `me` | query | key `['auth','me']`; enabled only when a token exists; restores session on refresh |
| `login` / `register` | mutation | on success: store tokens + user, then navigate |
| `updateProfile` | mutation | on success: update session user, invalidate `['auth','me']` |
| `refresh` | direct call | driven by the interceptor, not a component — no query needed |

`QueryClient` defaults: `retry: 1`, `staleTime: 30s`, `refetchOnWindowFocus: false`. Mutations never retry — re-posting a login or an order is wrong.

## 7. Forms — Signal Forms

Login, register and profile forms are rebuilt with `@angular/forms/signals`. The skills are unambiguous: "prefer Signal Forms" for v22, and "Do NOT import `FormControl`, `FormGroup`, `FormArray`, or `FormBuilder`… Signal Forms replace these concepts entirely."

Consequently these are all deleted: the `forms/*.ts` form-service layer (`LoginFormService`, `RegisterFormService`, `PasswordFormService`, `AddressFormService`, `ProductFormService`), `shared/components/form.ts`, `shared/components/form-field.ts`, and the CVA wrappers `input.ts` / `textarea.ts` / `select.ts`.

Shape — model signal, then `form()` with a validation schema:

```ts
protected readonly credentials = signal({ email: '', password: '' });

protected readonly loginForm = form(this.credentials, (path) => {
  required(path.email, { message: 'validation.required' });
  email(path.email, { message: 'validation.email' });
  required(path.password, { message: 'validation.required' });
});
```

Rules followed from `signal-forms.md`: never `null`/`undefined` as an initial value (`''` for strings, `0` for numbers, `[]` for arrays); bind with `[formField]`; never set `[disabled]`, `[readonly]`, `min` or `max` in the template; submit via `submit(form, async () => …)` with an `async` callback; validation messages are i18n keys resolved by the `translate` pipe.

**Custom validators** port to `validate()` returning `{ kind, message }` (never `null` — `undefined` when valid):

- Iranian phone — `^09\d{9}$`, mirroring the backend DTO regex
- Persian name — Arabic-script or ASCII Latin letters, combining marks, spaces and Persian half-spaces; at least two letters. Arabic-block digits and punctuation are not letters and must be rejected.
- Strong password — length ≥ 8, upper, lower, digit
- Password match — cross-field via `valueOf(path.password)`
- National code — **dropped**: `nationalCodeValidator` is dead code, referenced by no form

Errors render through `mat-form-field` + `mat-error`, replacing `FormFieldComponent`'s `ngDoCheck` error mapping and its `ERROR_TO_TRANSLATION`/`ERROR_PRIORITY` tables — the message now travels with the validator.

Name character checks and password complexity preserve frontend policy, which is stricter than the backend's nonempty-name and eight-character-password checks. Phone validation matches the backend exactly.

## 8. Pages

`login`, `register`, `profile` — lazy-loaded, Material-based (`mat-card`, `mat-form-field`, `matInput`, `matButton`), each under ~120 lines and responsible for one screen.

The guest add-to-cart return flow is preserved: `/login?returnUrl=…&variantId=…&autoAdd=1`; after login the page navigates to `returnUrl`, and product detail performs the auto-add (spec 003). Route params arrive as signal `input()`s via `withComponentInputBinding()` instead of `ActivatedRoute.snapshot`.

## 9. Acceptance criteria

- [x] Login with valid credentials stores both tokens, sets the user, and navigates to `returnUrl` or `/`
- [x] Login with bad credentials shows the backend's message via a Material snackbar; no tokens stored
- [x] Register creates the account, stores tokens, navigates to `/`; duplicate email/phone surfaces the 409 message
- [x] A page refresh with a stored token restores the session via the `me` query
- [x] A 401 triggers exactly one refresh, retries the original request, and succeeds transparently
- [x] A failed refresh clears tokens and redirects to `/`
- [x] Concurrent 401s trigger a single refresh, not several
- [x] Requests to `/api/auth/refresh` carry no `Authorization` header
- [x] `authGuard` redirects anonymous users to `/login` preserving `returnUrl`; `adminGuard` sends non-admins to `/`
- [x] Profile update persists and the navbar reflects the new name
- [x] Validation predicates are covered and the new pages use Signal Forms with Material fields
- [x] No `FormGroup`/`FormControl`/`FormBuilder`/`ControlValueAccessor` anywhere in `frontend-next`; no forms service layer
- [x] `ApiService`, `FormComponent`, `FormFieldComponent`, and the CVA input wrappers are absent from `frontend-next`
- [x] Session store contains no `Router` and performs no navigation
- [ ] Tests cover: interceptor refresh-once + retry, concurrent-401 single refresh, both guards, each custom validator

## 10. Implementation checkpoint — 2026-09-18

The previous session staged the session store, auth API, interceptor, guards, validation predicates, snackbar helper, and a temporary Signal Forms probe. Those files were retained and reviewed; the disposable probe was removed after baseline compilation.

Completed this slice: injector-scoped refresh coordination, interceptor registration, TanStack Query defaults, guard navigation tests, auth validation/error tests, and foundation corrections (explicit language pipe argument, Persian startup, persisted preferences, removal of legacy animation provider). HTTP tests cover concurrent and delayed 401s, one-retry behavior, 403/500 propagation, failed refresh, credential scoping, cancellation, logout/replacement during refresh, anonymous requests, and missing refresh tokens.

Verification: production build passed; Vitest passed 73 tests across 8 files; ESLint passed for all `frontend-next/src/**/*.ts`; `git diff --check` passed. HTTP integration tests use Angular's testing backend; live backend and browser visual checks are still pending with the pages.

Next: ensure the admin guard awaits profile restoration before checking roles, and add password-match validation plus bilingual rendered error assertions. The current login/register/profile pages, lazy routes, shell, shared TanStack mutations, and bootstrap `me` restoration are implemented and build-tested; restored-admin navigation is not implemented yet.

The existing Angular 19 app remains until feature parity; deletion criteria above apply at cutover, not during the parallel-workspace migration.
