---
adr: 2
title: Strings instead of enums, text instead of Json
status: accepted
phase: 2
tags: [decision, database, portability]
---

# ADR-0002 — Strings instead of enums, text instead of Json

## Context

Two things Prisma cannot do on SQLite, which the demonstration runs on because
it must cost nothing: native enums, and the `Json` column type. Both are
available on PostgreSQL, which the specification names as the eventual target.

## Decision

**Enum-like columns are plain strings.** The allowed values live in
`src/lib/constants.ts` and are the single source of truth. Every write path
validates against them.

**Structured payloads are JSON text.** Firm configuration, matter fields and AI
results are stored as text and parsed by `src/lib/json-field.ts`, which degrades
to a documented default rather than throwing inside a page render.

On PostgreSQL these become real enums and `jsonb` columns with no application
change.

## Consequences

- A malformed payload produces an empty object, not a broken page.
  `tests/unit/json-field.test.ts` covers every way a column can be unusable.
- The validation that a database enum would give for free is the application's
  job, so it must not be skipped on a write path.
- `Matter.fields` is deliberately a JSON column rather than a set of columns:
  which fields are visible comes from the firm's configuration, so a fixed
  schema would mean one table per practice area — exactly the fork Orchelio
  exists to avoid.
- `UsageRecord.isRealCharge` defaults to false, so "simulated" is a property of
  the data rather than a label painted on a screen.

## See also

- [Architecture §7 — Data model](../ARCHITECTURE.md)
