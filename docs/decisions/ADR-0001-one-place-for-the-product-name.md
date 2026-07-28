---
adr: 1
title: The product name lives in one module
status: accepted
phase: 1
tags: [decision, product]
---

# ADR-0001 — The product name lives in one module

## Context

The specification is unusually firm about naming: the product is Orchelio, in
the code, the interface, the metadata, the README, the documentation and the
demonstration data — and explicitly **not** "Legal AI Platform", "Law Firm
SaaS", "JurisFlow" or any other generic name.

Naming drifts silently. One placeholder left in an error screen, one page title
copied from a template, and the product is inconsistent in exactly the places a
visitor notices first.

## Decision

`src/lib/app-config.ts` is the only place the name appears. Page metadata, the
sidebar, the sign-in page, the loading screen, the error screen, the footer
signature and the demonstration warnings all import from it.

`tests/unit/app-identity.test.ts` fails the build if the name drifts, or if any
of the forbidden generic names appears in a user-visible surface.

## Consequences

- Renaming, white-labelling or adding an edition suffix is a one-file change.
- The module reads only `NEXT_PUBLIC_*` variables, so it is safe to import from
  both server and client components — which is what makes "one place" achievable
  rather than aspirational.
- A test guards a property that is otherwise invisible until someone complains.

## See also

- [Architecture §3 — Naming and identity](../ARCHITECTURE.md)
