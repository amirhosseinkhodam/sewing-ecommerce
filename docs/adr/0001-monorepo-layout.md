# ADR-0001 — Backend lives in the same repository

**Status:** accepted

## Context

Phase 0 (backend foundation) was originally thought to live in a separate repository. The project AGENTS.md even said "separate repository". The frontend was built first (Phase 1) and now needs a backend to talk to. Two options: a separate repo, or a `backend/` directory in the same repo.

## Decision

The NestJS backend lives in `backend/` inside the same repository, with its own `package.json`, lockfile, and `node_modules` — not npm workspaces, not a separate repo. Root `package.json` scripts delegate into it (`npm --prefix backend run ...`), and the Angular dev server proxies `/api` → `http://localhost:3000`.

## Consequences

- **Easier:** single clone gets both halves; frontend/backend changes can ship together; the existing `PLAN.md` `backend/` layout applies as-is.
- **Harder:** root tooling (lint/format/build) must be kept in sync across two packages; a single shared lockfile is lost (mitigated by the separate `package.json`).
- Workspaces were rejected to avoid npm hoisting issues with Angular's build tooling.
