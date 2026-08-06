# ADR-0005 — Single-package monorepo layout

**Status:** accepted

## Context

The project started with two separate npm packages in one repo (ADR-0001): root for Angular, `backend/` for NestJS, each with its own `package.json`, `node_modules`, `eslint.config.mjs`, and `.gitignore`. This created duplication (two lockfiles, two ESLint configs, two Prettier configs) and required `npm --prefix backend` for backend commands. The user preferred the single-package monorepo style (like the `taskflow-fullstack` reference project): one of everything.

## Decision

The project uses a **single-package monorepo layout** — one `package.json` at the root holding all dependencies for both halves, one `node_modules`, one lockfile, one ESLint config with per-folder blocks, one `.gitignore`, one Prettier config.

Layout:

```
<project-root>/
├── package.json / package-lock.json / node_modules/
├── .gitignore / .prettierrc / eslint.config.mjs
├── nest-cli.json          (sourceRoot: "backend/src")
├── angular.json           (project rooted at "frontend")
├── tsconfig.json          (base + paths)
├── tsconfig.frontend.json / tsconfig.frontend.app.json
├── tsconfig.backend.json  / tsconfig.build.json
├── frontend/              (Angular app: src/, proxy.conf.json, tailwind, postcss)
├── backend/               (NestJS app: src/, prisma/, .env)
└── shared/                (cross-half shared code, importable via @shared/*)
```

## Consequences

- **Easier:** single `npm install`, single lockfile, one toolchain (TypeScript, Prettier, ESLint), `@shared/*` imports work in both halves without a package boundary.
- **Harder:** one Node version for the whole repo (Node ≥ 22), one set of tool versions for everything. The two halves share the same `node_modules`, so a dependency conflict in one half could theoretically affect the other.
- All backend commands (`nest start`, `prisma migrate`, `prisma seed`) run from the root with no `--prefix` needed.
