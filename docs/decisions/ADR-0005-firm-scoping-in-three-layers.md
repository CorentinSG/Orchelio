---
adr: 5
title: Firm scoping is enforced in three layers
status: accepted
phase: 3
tags: [decision, multi-tenancy, security]
---

# ADR-0005 — Firm scoping is enforced in three layers

## Context

Orchelio's central promise is that one firm cannot see another firm's client
files. The demonstration uses a shared database with a `firmId` column, so that
promise rests entirely on every query filtering by it.

The failure mode is not exotic. It is one forgotten `where` clause, on one
query, on one page, written in a hurry two years from now — and the result is a
law firm reading another firm's privileged material. A convention ("remember to
scope your queries") is not a control, because conventions are exactly what a
hurried change ignores.

## Decision

The rule is enforced three times over, at three different levels, so that
breaking it fails loudly rather than leaking quietly.

**1. The type system.** Every function in `src/lib/data/` takes a `FirmScope` as
its first argument. `getMatter({ matterId, firmId })`, never
`getMatter(matterId)`. Forgetting the firm is a compile error.

**2. The database client.** `src/lib/data/firm-scope.ts` wraps Prisma. Every
operation against a firm-scoped model is inspected before it runs; one that does
not mention `firmId` throws `FirmScopeError`. The guard is applied once, to the
application's single client, and no unguarded client is exported anywhere — so
opting out would have to be a visible change to `src/lib/prisma.ts`.

**3. The access guards.** `requireFirmAccess` and `requirePermission` check the
caller's membership before a page renders, and record every refusal.

### The part that is easy to get backwards

Boolean combinators need *opposite* treatment, and getting it wrong is itself a
leak:

| Combinator | Rule | Why |
| ---------- | ---- | --- |
| `AND` | one scoped branch is enough | every condition must hold |
| `OR` | **every** branch must be scoped | any branch may match alone — `OR: [{ firmId }, { status: "active" }]` returns every active matter in the database |
| `NOT` | never counts | a negated firm is the opposite of a scope |

The first version of the guard treated arrays uniformly and accepted the leaking
`OR`. A unit test caught it before it reached a screen.

## Consequences

- A query that forgets the firm fails immediately and visibly, in development,
  rather than returning rows nobody notices are wrong.
- 40 integration tests run against a real database holding two firms with
  deliberately similar records — same client name, same filename, same matter
  title — because that is how a test catches a query that matches on title and
  forgets the firm.
- **Stated limitation:** the guard checks that a firm is *named*, not that it is
  named *correctly*. A deliberately perverse query would pass. It defends
  against omission, the realistic mistake, not against sabotage.
- **Stated limitation:** all three layers run inside the application. They
  protect against a programming mistake, not against a compromised process or a
  mistaken database administrator. Production needs row-level security or
  separate schemas — see [Production readiness](../PRODUCTION_READINESS.md).

## See also

- [Architecture §4 — Multi-tenancy](../ARCHITECTURE.md)
- [ADR-0010 — Two caches, and never firm data across requests](ADR-0010-two-caches-only.md)
- [ADR-0004 — Middleware is not the security boundary](ADR-0004-middleware-is-not-the-boundary.md)
