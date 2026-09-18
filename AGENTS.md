# AGENTS.md — Universal Agent Workflow

> This file defines the workflow rules that every AI coding agent must follow when working on this project. It is provider- and model-independent: whether the task is performed by Claude, OpenCode, GapCode, or any future agent, the same rules apply.
>
> Provider-specific configuration (model selection, tool-specific commands, hooks, skills) belongs in that provider's own config files — not here.

---

## 1. Before starting work

Every agent must read these files before making any changes:

| File | Purpose |
|---|---|
| `AGENTS.md` | This file — universal workflow rules + permanent project context |
| `CURRENT.md` | Current state of the project (what's done, in progress, known issues, next steps) |
| `DECISIONS.md` | Important project decisions and their reasoning |
| `PROJECT_KNOWLEDGE.md` | Comprehensive project knowledge (architecture, flows, API contracts, conventions) |

Additionally:

- Read existing code and understand the project context before making changes.
- Follow existing architectural and technical decisions recorded in `DECISIONS.md`.

## 2. While working

- Do not unnecessarily introduce new patterns, abstractions, libraries, or dependencies.
- Prefer simple, maintainable solutions over clever or complex ones.
- Preserve existing behavior unless the task explicitly requires changing it.
- Keep changes within the requested scope. If a wider change is required, explain why and change the smallest related set of files.
- Follow the project's existing code conventions and patterns.

## 3. Before considering a task complete

- Review your own changes. Verify they are correct, complete, and consistent.
- Run the relevant checks, tests, or build commands when appropriate.
- Never claim something was tested if it was not actually tested.
- If you cannot run tests or verification, state what was skipped and why.

## 4. After completing a task

### 4.1 Update `CURRENT.md`

Update `CURRENT.md` to reflect the state of the project **after** the task is completed. This includes:

- What has been completed
- What is currently in progress
- Known issues or blockers
- Important unfinished work
- The next relevant task or context

Only update if the task meaningfully changes the project state. Do not update for trivial changes.

### 4.2 Update `DECISIONS.md`

Update `DECISIONS.md` when a task introduces, changes, or invalidates an important decision:

- Architectural decisions
- Technical decisions
- Workflow decisions
- Dependency or tooling decisions
- Project conventions

Do not record trivial implementation details. If nothing meaningful changed, do not modify this file.

If an existing decision changes, update the existing entry rather than creating contradictory duplicates.

### 4.3 Do not wait for explicit requests

Agents must NOT wait for the user to explicitly request updates to `CURRENT.md` or `DECISIONS.md`. These updates are part of the task completion workflow.

## 5. Do not undo existing decisions

Do not undo or revert an existing decision recorded in `DECISIONS.md` without documenting the reason for the change in the same file.

## 6. State files are local coordination

`CURRENT.md` and `DECISIONS.md` are local agent coordination files. They are:

- **Ignored by Git** (listed in `.gitignore`)
- **Not committed** to the repository
- **Local to each developer's working copy**

This means different agents or developers may have different local states, which is expected. The files coordinate work within a single working copy, not across a team.

---

## Project context

### Overview

Persian-first, mobile-responsive sewing shop ecommerce website with guest browsing, customer cart/checkout, admin panel for full management, card-to-card payment (Zarinpal in Phase 8), and SMS notifications (Phase 8).

### Technology stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19 standalone (no `NgModule`). Uses `bootstrapApplication` with `provideHttpClient()` and `provideRouter()`. |
| Backend | NestJS 11 + Prisma 7 + PostgreSQL, in `backend/` (same repo). |
| Shared | Cross-half code lives in root `shared/` (types, models, const) imported via `@domain/*` path alias. |
| Styling | Tailwind CSS with custom design tokens in `tailwind.config.js`. No CSS/SCSS in components. |
| i18n | English (`en`) and Persian (`fa`, RTL). Translation files in `frontend/src/app/i18n/`. |
| Dark mode | ThemeService with signal-based state, persists to localStorage. |
| State management | `@ngrx/signals` (`signalStore`) for feature state. |
| Node version | Node ≥ 22 for the whole repo (`.nvmrc`). |

### Quick commands

| Command | Action |
|---|---|
| `npm start` | Frontend dev server on `localhost:4200` |
| `npm run start:backend` | Backend dev server on `localhost:3000` |
| `npm run dev` | Frontend + backend together (concurrently) |
| `npm run build` | Production build (backend then frontend) |
| `npm run lint` | ESLint — checks `frontend/src/**/*.ts` `backend/src/**/*.ts` `shared/**/*.ts` |
| `npm run format` | Prettier — writes both halves |

All backend commands run from the root (single `package.json`): `npm run prisma:migrate`, `npm run prisma:seed`, `npm run prisma:generate`, `npm run prisma:studio`.

### Architecture principles

- **Single-package monorepo**: One root `package.json`/lockfile/toolchain; `frontend/` + `backend/` are folders; cross-half code in root `shared/`.
- **Path aliases**: Frontend uses `@core/*`, `@shared/*`, `@i18n/*`, `@auth/*`, `@domain/*`. Backend uses relative paths for `shared/`.
- **No barrel files**: No `index.ts` re-exports — import files directly.
- **Reference feature**: Read `auth/` before building other features — it demonstrates every project convention.
- **Entry points**: `frontend/src/main.ts` (bootstrap), `frontend/src/app/main.route.ts` (routes), `backend/src/main.ts` (NestJS bootstrap).

### Important conventions

- **Error body shape**: `{ statusCode, message }` — frontend reads `err.error?.message`.
- **Refresh contract**: `POST /api/auth/refresh` returns `{ accessToken, refreshToken, user }`.
- **localStorage keys**: `accessToken`, `refreshToken`, `app-theme`, `app-language`.
- **Field-name contract**: camelCase model fields mirror DTOs 1:1.
- **Uppercase enum values**: `'ADMIN'`, `'PENDING'` etc. — compare via `shared/const/*` objects, never inline literals.
- **Decimal-as-string, UUID-as-string, images-as-array**: Boundary rules — see `PROJECT_KNOWLEDGE.md §6`.
- **Upload URLs**: Always relative `/uploads/...` served by backend.
- **i18n**: Every user-facing string is a key in both `en.json` and `fa.json`.
- **Private fields**: Use `#private` fields everywhere (never TS `private`).
- **Controllers delegate, services own logic**: One dto file per body shape.

### Roles (access control)

- **Guest** — no account; browses everything public.
- **Customer** — logged-in `CUSTOMER`; cart, checkout, orders, addresses, profile.
- **Admin** — `ADMIN` role; manages the shop from `/admin`.

Auth is JWT: short-lived access token + 7-day refresh token. On a 401 the frontend refreshes automatically; if refresh fails the user is logged out and redirected to `/login`.

### Testing

Testing infrastructure has been removed from the Angular 19 app (no `tests/`, no jest config, no test scripts). The Angular 22 workspace in `frontend-next/` uses Vitest. Verification = `npm run lint` + `npm run build` + manual testing.

---

## Provider/model independence

This file must NOT contain:

- Provider-specific commands or configurations
- Model-specific behavior or limitations
- Tool-specific features or hooks
- Anything that would only apply to one AI coding assistant

Provider-specific configuration remains in that provider's own config files:

```
AGENTS.md
    ↓
Universal project workflow + permanent context
    ↓
┌──────────────┬──────────────┬──────────────┐
│ Claude       │ OpenCode     │ GapCode      │
│ config       │ config       │ config       │
└──────────────┴──────────────┴──────────────┘
```

## Quick reference

| Action | File | Committed? |
|---|---|---|
| Universal workflow + project context | `AGENTS.md` | Yes |
| Current project state | `CURRENT.md` | No (gitignored) |
| Project decisions | `DECISIONS.md` | No (gitignored) |
| Comprehensive project knowledge | `PROJECT_KNOWLEDGE.md` | Varies |
