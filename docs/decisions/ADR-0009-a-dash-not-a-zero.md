---
adr: 9
title: A dash, not a zero
status: accepted
phase: 4
tags: [decision, honesty, interface]
---

# ADR-0009 — A dash, not a zero

## Context

The dashboard is assembled from each firm's configuration, and several of its
cards count things that do not exist yet — matters arrive in Phase 5, analyses
in Phase 6, approvals in Phase 7.

The easy choice is to show `0`. It looks finished and it renders without a
special case.

It is also a lie. `0` is a claim: *there is nothing to do*. For a card reading
"Status expiration dates to review", a lawyer who believes that claim has been
actively misled by the product.

## Decision

A widget whose data does not exist yet shows **a dash**, with the phase that
will fill it. A dash says "not known"; a zero says "none".

Related, same principle:

- A widget that depends on an AI feature the firm switched off is **omitted**,
  not shown empty. A card reading "0 missing documents" at a firm that never
  asked Orchelio to look for missing documents is not information — it is noise
  that reads like reassurance.
- Refusals are worded identically whether a record is missing, belongs to
  another firm, or is beyond the caller's role. A refusal that distinguishes
  them confirms that the other firm's record exists.

## Consequences

- `widgetValue()` in `src/lib/dashboard/widgets.ts` compares each widget's
  `availableFrom` against the current phase. The comparison must be updated as
  phases land, which is deliberate: it is one line, and it forces the question
  "is this figure real now?".
- The dashboard looks less finished than it could. That is the correct
  appearance for a product that is four phases into nine.

## See also

- [Architecture §4bis — Dashboard composition](../ARCHITECTURE.md)
