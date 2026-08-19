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
   volume-independent screens by `tests/e2e/efficiency.spec.ts` — which since
   L-1 includes both queues, whose length is now a design property rather than
   a data accident. Extended to every remaining working screen in L-4.
2. **Any queue that can exceed twenty items paginates, filters server-side,
   and renders one expanded card at a time.** The approvals queue (11 136
   words) and the matter list (162 links) were the debt. **L-1 paid it**: both
   page at twenty, the approval cards fold into native `<details>` with an
   exclusive accordion, and the numbers are now ceilings in
   `tests/e2e/efficiency.spec.ts` rather than obligations in this document —
   approvals at 1 400 words (measured 1 261, from 11 136) and the matter list
   at 900 (measured 564, from 3 579). Both are asserted against the loaded
   database the browser suite leaves behind, which is the only way the claim
   means anything.
3. **Every tile that shows a count is a link to exactly what it counts.**
   The dashboard's zero links are the debt; L-2 pays it.

And one ratchet: the six most frequent journeys are pinned, in actions, at
today's cost — find by reference (4), find by client (4), run an analysis
(6), decide an approval (3, see below), add a document (8), switch firm (1) —
by `tests/e2e/efficiency.spec.ts`. A ceiling is lowered by lowering the real
cost. Raising one requires editing this ADR with the reason.

### The one ceiling that has been raised, and why

Deciding an approval cost two actions and now costs three. The card folds, so
the question being asked and the effect of answering it are read *before* the
four buttons appear, instead of sitting open on a screen with forty-nine other
open cards.

Putting the buttons on the summary line would have kept the two — and broken
the older rule they exist under: every card states what approving causes
before the buttons, never in a dialogue afterwards. Four buttons above a
folded explanation is that rule inverted.

So one action was traded for a screen that went from 11 136 words to 1 261.
The person who decides ten requests in a sitting pays ten extra clicks and
stops scrolling past nine thousand words they were never going to read.

An "action" is one thing a person does: a click, a filled field, a chosen
file. Signing in is the shared price of every journey and counted in none.
Reading is costed separately, in words, because a queue can be cheap to click
and ruinous to scan — which the approvals screen was exactly, at two clicks
and eleven thousand words.

## Consequences

- The next phases have numbers to beat instead of adjectives to claim.
- A regression in journey cost or screen weight fails the build rather than
  accumulating quietly.
- The two queue numbers have moved into the test file as ceilings, as this
  decision required. What remains of the approvals screen's weight is the two
  reference cards at its foot — what raises an approval, and which rules this
  build does not yet raise — which L-4 folds; the queue itself can no longer
  grow.
- Nothing in this decision permits removing a warning, replacing a dash with
  a zero, or changing how a refusal is worded. Weight moves; honesty does
  not.
