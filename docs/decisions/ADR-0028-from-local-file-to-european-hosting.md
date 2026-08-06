# ADR-0028 — From a local file to European hosting, without a rewrite

**Status:** accepted · **Phase:** V1-1, applied after V1

## Context

The demonstration ran at zero cost by specification: SQLite in a file, no
object storage, no hosting, no accounts. Version 1 keeps that posture for
development and demonstrations — the V1 runs on a laptop — but it is built
for a product that will hold real client files on infrastructure a French
firm can point at, under GDPR and professional secrecy.

The owner's specification asks for European processing throughout, hesitates
between Switzerland and the EU, and requires that a cabinet always be able to
answer: where is the data, who can touch it, how is it deleted.

## Decision

**Every V1 choice is made so that the move to European hosting is a
deployment, not a rewrite. The hosting choice itself is deferred to the
pilots, and France is the recommendation.**

- **Database:** the schema stays Prisma-managed and portable; nothing may
  depend on SQLite-only behaviour. The production target is PostgreSQL. The
  search index is written behind an interface whose first implementation is
  local, so swapping in a server-side index changes one module.
- **Files (from V1-2):** stored behind a storage interface whose first
  implementation is a local directory; the production implementation is
  S3-compatible object storage, encrypted, in the chosen region. No code
  outside the storage module may touch a path.
- **Secrets:** server-side environment only, never in the repository, never
  shown to a user below the administration space. Already true; stays true.
- **Recommendation, to be decided at pilot time:** French hosting (Scaleway
  or OVH) rather than Swiss — simpler to explain to a French firm, no
  transfer analysis, GDPR direct. Switzerland remains possible; the
  specification's own complement prefers the EU.
- **What hosting alone does not give,** recorded so nobody mistakes the
  invoice for compliance: a legal basis for processing, subcontractor
  contracts, retention and deletion procedures, a specialist GDPR and
  professional-conduct review before any real client data. These are owner
  actions, listed in docs/PLAN-V1.md, and the fictional-data rule holds
  until they are done.

## Consequences

- Development remains free and offline; nothing in the build process may
  require a hosted service. The cost ceiling the owner accepted for V1 is a
  single AI key.
- Some work is deliberately paid twice-lightly rather than once-heavily: a
  local storage implementation now and an object-store one later is cheaper
  than either hosting during development or rewriting storage at pilot
  time.
- `docs/PRODUCTION_READINESS.md` stays the honest ledger of the distance
  between the V1 and production; each phase that closes an item updates it.
