---
adr: 7
title: One question, two answers — practice-area vocabulary
status: accepted
phase: 4
tags: [decision, configuration, specification]
---

# ADR-0007 — One question, two answers: practice-area vocabulary

## Context

The specification requires that answering the onboarding questionnaire
reproduces the two firm configurations it publishes (§11). It also defines the
questionnaire's step 4 as fourteen generic workflow steps (§10).

These two requirements contradict each other. The published configurations
contain keys that appear nowhere in the fourteen options:

| Published for immigration | Published for employment |
| ------------------------- | ------------------------ |
| `consultation_preparation` | `employment_case_assessment` |
| `document_collection` | `evidence_collection` |

Taken literally, no set of answers produces the published output, and the
acceptance criterion is unreachable.

## Decision

§2 resolves it: the configuration determines *"le vocabulaire utilisé"* — the
vocabulary the firm sees and stores. These are the **same** steps, named in each
practice area's own language.

So a catalogue entry may carry a per-practice-area key
(`src/lib/onboarding/catalogue.ts`):

| The question asked | Immigration firm stores | Employment firm stores |
| ------------------ | ----------------------- | ---------------------- |
| Initial consultation | `consultation_preparation` | `employment_case_assessment` |
| Document collection | `document_collection` | `evidence_collection` |
| Create a factual timeline | `timeline` | `employment_timeline` |

Two firms tick the same four boxes and receive different configurations, because
the same step means something different in each practice area.

The alternative — declaring the acceptance criterion unreachable and picking one
of the two published examples — would have been easier and less useful. This
reading reproduces **both** examples exactly and delivers a feature the
specification asked for elsewhere.

## Consequences

- `tests/unit/onboarding-config.test.ts` asserts the produced configuration
  against the published JSON, key by key, for both firms.
- The mapping must stay **one-to-one within a practice area**. That is what lets
  a saved draft re-tick the right boxes when the questionnaire is reopened.
- Changing the main practice area re-translates the answers already given in
  steps 4 and 5. Without that, a firm that changed its mind would keep
  immigration keys in an employment configuration — answers that had silently
  stopped meaning anything.
- It is visible in the product, not just the data: the same four boxes produce
  an immigration dashboard about status expiry dates and an employment dashboard
  about termination letters.

### A second, smaller deviation

The published `approvals` objects list a subset of the rules. Orchelio stores
every locked rule as well — see
[ADR-0008](ADR-0008-locked-approvals-are-stored.md). Every key in each published
example is present and required; the stored object is a superset.

## See also

- [Roadmap — Phase 4](../ROADMAP.md)
- [Architecture §4bis — Configuration](../ARCHITECTURE.md)
