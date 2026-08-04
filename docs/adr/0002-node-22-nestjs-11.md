# ADR-0002 — Node 22 LTS + NestJS 11

**Status:** accepted

## Context

The machine had Node v18.19.1. NestJS 11 (current) requires Node ≥ 20. Sticking with Node 18 would have forced NestJS 10 and an older toolchain.

## Decision

Upgrade to Node 22 LTS via nvm (`nvm install 22`) and use NestJS 11 for the backend. Document the Node 22 requirement in the project README/AGENTS.

## Consequences

- **Easier:** modern NestJS 11 features, current `@nestjs/*` versions, LTS support for the project lifetime.
- **Harder:** the system default Node is still 18; backend commands must be run with the nvm Node 22 active (or via the project's node version manager config).
