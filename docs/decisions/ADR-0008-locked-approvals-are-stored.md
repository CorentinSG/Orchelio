---
adr: 8
title: Locked approvals are stored, not merely enforced
status: accepted
phase: 4
tags: [decision, safety, configuration]
---

# ADR-0008 — Locked approvals are stored, not merely enforced

## Context

Nine approval rules cannot be switched off by anyone: no automatic filing, no
permanent deletion, no legal advice delivered automatically, no final deadline
or eligibility conclusion without a person, no settlement proposal or
opposing-counsel communication without explicit approval.

These are safety properties of the product, not preferences. The question was
whether to store them with each firm's configuration, or leave them implicit and
enforce them in code.

## Decision

Both. They are enforced on the server whatever arrives, **and** written into the
stored configuration.

In the questionnaire they render with a padlock, are disabled, and are submitted
by nothing — `buildApprovals()` writes them in regardless of what the browser
sent, so tampering with the form achieves nothing.

## Consequences

- The guarantee is auditable in the data. Someone reviewing a firm's
  configuration can see that the rule is required, rather than having to trust a
  comment in a source file.
- The stored `approvals` object is a superset of the specification's published
  examples. Every key those examples list is present and required; Orchelio adds
  the locked rules the examples omit. Stated in
  [ADR-0007](ADR-0007-practice-area-vocabulary.md) rather than glossed over.
- `tests/unit/onboarding-config.test.ts` asserts that an empty selection still
  produces every locked rule, and that no locked rule also appears as
  configurable.
- Unknown approval keys are ignored rather than stored, so a hand-crafted
  submission cannot invent a rule.

## See also

- [Architecture §6 — Human approvals](../ARCHITECTURE.md)
