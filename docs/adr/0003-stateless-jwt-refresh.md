# ADR-0003 — Stateless JWT refresh tokens

**Status:** accepted

## Context

The frontend auth flow (already built in Phase 1) expects a token pair: `POST /api/auth/refresh { refreshToken }` → `{ accessToken, refreshToken }`. Options for refresh tokens: stateless signed JWTs, or server-side storage (DB table with hashes, rotation, revocation).

## Decision

Issue both tokens as signed JWTs with separate secrets. Access token: 15 min expiry. Refresh token: 7 days. No database table for refresh tokens; no rotation/revocation for the MVP. Refresh verification uses `jwt.verify` against the refresh secret.

## Consequences

- **Easier:** no extra table, simpler auth module, matches the plan's "stateless" framing.
- **Harder:** a stolen refresh token is valid until expiry (no revocation). Acceptable for the MVP; revisit with DB-backed rotation if needed later (recorded as a possible follow-up ADR).
