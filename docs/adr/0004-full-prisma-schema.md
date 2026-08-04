# ADR-0004 — Full Prisma schema defined in Phase 0

**Status:** accepted

## Context

PLAN.md Phase 0 says "Define all Prisma models + run migrations + seed". Alternative: define only auth-related models now and add the rest per feature phase. The full schema is already designed in PLAN.md §3 (11 models + enums).

## Decision

Create the complete Prisma schema (`User`, `Category`, `Product`, `ProductVariant`, `Portfolio`, `Cart`, `CartItem`, `Address`, `Order`, `OrderItem`, `ContactMessage` + enums) in Phase 0 and run one initial migration. Only the auth module's endpoints are implemented in Phase 0; the other modules get their tables now and their endpoints in their own phases.

## Consequences

- **Easier:** one coherent migration from the start; later feature phases only add endpoints/modules, not schema churn; relations are correct up front.
- **Harder:** the schema may need refinement once real modules are built (acceptable — later migrations handle it).
