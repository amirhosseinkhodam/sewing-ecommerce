# Specifications — Sewing Ecommerce Modernization

Spec-Driven Development workspace for migrating the frontend from Angular 19 to Angular 22.

## How these specs work

Each spec states **intended behavior** and **acceptance criteria** before implementation. The workflow per spec:

1. Understand current behavior and documented reasons (`PROJECT_KNOWLEDGE.md`, `PLAN.md`, `AGENTS.md`)
2. Write/update the spec
3. Verify the spec against the official Angular skills
4. Implement
5. Verify implementation against acceptance criteria
6. Keep spec and implementation synchronized

A spec exists only where it earns its place — a decision to record, a contract to pin down, or acceptance criteria worth checking. Trivial changes do not get specs.

## Source of truth

Priority order, set by the project owner:

1. **Official Angular skills** — `~/.claude/skills/angular-developer/` + `angular-new-app` (single source of truth)
2. Current project requirements
3. Existing project markdown (`PROJECT_KNOWLEDGE.md`, `PLAN.md`, `AGENTS.md`, `CHANGELOG.md`)
4. Existing implementation

Where existing code conflicts with the skills, **the skills win**. Existing code is not a constraint: delete, merge, split and rewrite are all permitted.

Skills build verified in use: `~/.claude/skills/BUILD_INFO` — `8576f161` (2026-09-09), the `angular/angular` official skills.

## Index

| Spec | Scope | Status |
|---|---|---|
| [000-architecture.md](000-architecture.md) | Target architecture, stack, migration strategy, conventions | Accepted |
| [001-foundation.md](001-foundation.md) | Workspace scaffold, Tailwind v4, Material, providers, i18n | Accepted |
| [002-core-auth.md](002-core-auth.md) | HTTP layer, interceptor, guards, auth session + forms | Accepted |
| [003-catalog.md](003-catalog.md) | Product catalog, filters, product detail | Accepted |
| [004-cart-checkout.md](004-cart-checkout.md) | Cart, addresses, checkout wizard, order placement | Accepted |
| [005-admin.md](005-admin.md) | Admin shell, product/category management | Accepted |
| [006-testing.md](006-testing.md) | Vitest strategy, critical-path coverage | Accepted |

## Decisions taken by the project owner

Recorded 2026-09-18, before implementation:

- **Migration strategy**: greenfield rebuild — scaffold a new Angular 22 workspace with the CLI and port features spec by spec, rather than an in-place `ng update` chain.
- **Testing**: reinstated with Vitest, scoped to critical paths (auth/guards, cart totals, checkout wizard, validators) rather than blanket coverage.
- **Scope**: frontend only. The NestJS/Prisma backend, database and `shared/` contract are untouched; the existing API is a fixed target.
