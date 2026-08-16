---
title: "ADR-0029 — Reading budgets and journey ceilings"
tags: [decision, v1, lisibilite]
---

# ADR-0029 — Reading budgets and journey ceilings

**Status:** accepted (owner approval, 16 August 2026 — « lance L-0 »)
**Context:** [Plan Lisibilité](../PLAN-LISIBILITE.md), phase L-0

## Context

The owner asked for a plan to make the product faster to read and faster to
use. The project's rule is to measure rather than guess, so every principal
screen was opened in a driven browser and what a reader faces was counted.
Two numbers justified the whole undertaking:

| Screen | Words | Links | Buttons |
| ------ | ----: | ----: | ------: |
| Dashboard | 341 | **0** | 0 |
| Matter list | 3 579 | 162 | 1 |
| Matter record (summary) | 241 | 11 | 0 |
| Matter record (analysis) | 644 | 12 | 1 |
| **Approvals** | **11 136** | 76 | **201** |
| Assistant | 686 | 20 | 0 |
| Usage and costs | 664 | 10 | 0 |
| Settings (profile) | 354 | 9 | 1 |
| Confidentiality register | 1 464 | 8 | 0 |
| Open a matter | 332 | 1 | 2 |

The database at measurement time carried the rows the browser suite had
created — far more than the six seeded matters. That inflation is the finding,
not a distortion: it is what a working firm's volume does to screens that
render every row with its full card and form.

The measurement also surfaced three surfaces the French sweep had missed
(the approval card, the Validations page body, the activity log) — fixed
before this phase landed, and a lesson recorded: the sweep had audited
screens by their headings, and headings can lie.

## Decision

Three budgets, each enforced by a named phase of the plan:

1. **A working screen costs at most 600 words before the firm's own data.**
   The confidentiality register is the deliberate exception (2 000): it is a
   reference document, read once and slowly. Enforced today for the
   volume-independent screens by `tests/e2e/efficiency.spec.ts`; extended to
   every working screen in L-4, once L-1 has made queue length a design
   property rather than a data accident.
2. **Any queue that can exceed twenty items paginates, filters server-side,
   and renders one expanded card at a time.** The approvals queue (11 136
   words) and the matter list (162 links) are the debt; L-1 pays it. Until
   then their numbers live here rather than in a test, because a ceiling that
   fails when an unrelated suite adds rows would be flakiness measuring
   nothing.
3. **Every tile that shows a count is a link to exactly what it counts.**
   The dashboard's zero links are the debt; L-2 pays it.

And one ratchet: the six most frequent journeys are pinned, in actions, at
today's cost — find by reference (4), find by client (4), run an analysis
(6), decide an approval (2), add a document (8), switch firm (1) — by
`tests/e2e/efficiency.spec.ts`. A ceiling is lowered by lowering the real
cost. Raising one requires editing this ADR with the reason.

An "action" is one thing a person does: a click, a filled field, a chosen
file. Signing in is the shared price of every journey and counted in none.
Reading is costed separately, in words, because a queue can be cheap to click
and ruinous to scan — today's approvals screen is exactly that.

## Consequences

- The next phases have numbers to beat instead of adjectives to claim.
- A regression in journey cost or screen weight fails the build rather than
  accumulating quietly.
- The two queue numbers stand in this document as obligations. When L-1
  lands, they move into the test file as ceilings and this ADR gains the
  note saying so.
- Nothing in this decision permits removing a warning, replacing a dash with
  a zero, or changing how a refusal is worded. Weight moves; honesty does
  not.
