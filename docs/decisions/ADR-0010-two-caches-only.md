---
adr: 10
title: Two caches, and never firm data across requests
status: accepted
phase: harness
tags: [decision, performance, multi-tenancy, security]
---

# ADR-0010 — Two caches, and never firm data across requests

## Context

Rendering the dashboard cost 23 SQL statements, measured with
`ORCHELIO_LOG_QUERIES=1` rather than estimated. The knowledge graph identified
why: `currentSession()` is the most connected function in the codebase, called
from the layout, from the page and from each access guard, and every call meant
a session lookup plus its user, memberships and firms.

The obvious remedy — cache it — is also the most dangerous change available in
this codebase. A cache is a place where one request's answer is handed to
another. In a multi-tenant product that is the same shape as the bug the whole
architecture exists to prevent, and worse: no query is involved, so the firm
scoping guard ([ADR-0005](ADR-0005-firm-scoping-in-three-layers.md)) never sees
it. A stale dashboard is an annoyance; another firm's dashboard is a breach.

## Decision

`src/lib/cache.ts` permits exactly two kinds of cache, different in **kind**, not
merely in duration. There is deliberately no third.

| Kind | Lifetime | May hold firm data? |
| ---- | -------- | ------------------- |
| `requestScoped` — React `cache()` | one server request | **yes** — it cannot outlive the request that created it |
| `platformCatalogue` — practice areas, matter types, workflow templates | 60 seconds | **no** — checked at the call site |

`platformCatalogue` takes the model name and throws `UncacheableModelError` for
anything the firm scoping guard classifies as firm-scoped. Moving a firm read
into it fails at the first call rather than leaking quietly for months.

If a screen is slow because it re-reads a firm's matters, the answer is a better
query or an index — not a cache.

## Consequences

Measured, same instrument as before:

| Page | Before | After |
| ---- | ------ | ----- |
| Dashboard | 23 queries | **17** |
| Onboarding step 3, catalogue warm | 7 queries | **6** |

- `tests/unit/cache.test.ts` asserts the refusal against **every** firm-scoped
  model in the schema, so the cacheable list and the firm-scoped list cannot
  drift apart as models are added.
- Request-scoped memoisation changes nothing about session validity: React's
  `cache()` dies with the request, so a revoked session still stops working on
  the very next one.
- The catalogue TTL is short on purpose. Practice areas change when one is added
  — a deployment event, not a user action — so a minute of staleness costs
  nothing.
- Every signed-in route stays `dynamic = "force-dynamic"` and always will.

## See also

- [Harness §4 — Caching](../HARNESS.md)
- [ADR-0005 — Firm scoping is enforced in three layers](ADR-0005-firm-scoping-in-three-layers.md)
