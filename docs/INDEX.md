---
title: Orchelio — documentation
tags: [index]
---

# Orchelio — documentation

Start here. This folder is also an [Obsidian](https://obsidian.md) vault: open
`docs/` as a vault and you get linked navigation, backlinks and a graph of how
these notes relate. Nothing is duplicated — the vault *is* this folder, and every
file renders identically on GitHub.

> **Orchelio Demo — Do not upload real client information or confidential
> documents.** Every firm, person, matter and document is fictional and the AI
> is simulated.

---

## If you are here to…

| … | Read |
| - | ---- |
| Install and run it | [README](../README.md) |
| Understand how it is built | [Architecture](ARCHITECTURE.md) |
| Know what is done and what is next | [Roadmap](ROADMAP.md) |
| Find out **why** something is the way it is | [Decisions](#decisions) |
| Work on the code as an assistant | [CLAUDE.md](../CLAUDE.md) |
| Find where a module lives | [Code map](CODEMAP.md) |
| Verify, navigate or profile the project | [Harness](HARNESS.md) |
| Know what is missing before production | [Production readiness](PRODUCTION_READINESS.md) |

---

## The one-paragraph version

Orchelio is a configurable platform for law firms. **One codebase, many firms.**
A seven-step questionnaire writes a `FirmConfiguration`, and that record — not
the code — is what makes one firm's Orchelio different from another's. Each
firm's data is isolated from every other firm's, enforced in three independent
layers and proved by tests.

Built in nine phases. Six are delivered; see [Roadmap](ROADMAP.md).

---

## Decisions

The reasoning behind the choices that are not obvious, and would otherwise
survive only in commit messages. Each note says what the problem was, what was
decided, and what it cost.

| # | Decision | Phase |
| - | -------- | ----- |
| 1 | [The product name lives in one module](decisions/ADR-0001-one-place-for-the-product-name.md) | 1 |
| 2 | [Strings instead of enums, text instead of Json](decisions/ADR-0002-strings-not-enums-text-not-json.md) | 2 |
| 3 | [Server-side sessions, with only the token hash stored](decisions/ADR-0003-server-side-sessions.md) | 2 |
| 4 | [Middleware is not the security boundary](decisions/ADR-0004-middleware-is-not-the-boundary.md) | 2 |
| 5 | [Firm scoping is enforced in three layers](decisions/ADR-0005-firm-scoping-in-three-layers.md) | 3 |
| 6 | [Consequential forms POST to a route handler](decisions/ADR-0006-forms-post-to-route-handlers.md) | 3 |
| 7 | [One question, two answers — practice-area vocabulary](decisions/ADR-0007-practice-area-vocabulary.md) | 4 |
| 8 | [Locked approvals are stored, not merely enforced](decisions/ADR-0008-locked-approvals-are-stored.md) | 4 |
| 9 | [A dash, not a zero](decisions/ADR-0009-a-dash-not-a-zero.md) | 4 |
| 10 | [Two caches, and never firm data across requests](decisions/ADR-0010-two-caches-only.md) | harness |
| 11 | [Loading boundaries are placed per segment](decisions/ADR-0011-loading-boundaries-are-placed-per-segment.md) | 5 |
| 12 | [The simulated analysis derives rather than looks up](decisions/ADR-0012-the-simulation-derives-rather-than-looks-up.md) | 6 |
| 13 | [A conclusion has nowhere to live](decisions/ADR-0013-a-conclusion-has-nowhere-to-live.md) | 6 |

Three of these exist because a test failed in a way that looked like flakiness
and turned out to be a real defect: [6](decisions/ADR-0006-forms-post-to-route-handlers.md)
twice, and [5](decisions/ADR-0005-firm-scoping-in-three-layers.md) once.

### Adding one

Copy the shape of any note above: frontmatter, then **Context** (what problem
forced a choice), **Decision** (what was chosen), **Consequences** (what it cost,
including the limitations). Number it sequentially, link it from this table, and
run `npm run docs:check` — every internal link is verified and every note must be
reachable from here.

A decision worth recording is one where a reasonable person would choose
differently without knowing what you knew. Preferences do not need a note.

---

## Reference

- [Architecture](ARCHITECTURE.md) — how it is put together, and the procedures
  for adding a practice area, a workflow, a firm, or the Anthropic API.
- [Roadmap](ROADMAP.md) — the nine phases, what each delivered, and the defects
  found on the way.
- [Harness](HARNESS.md) — verification, navigation, caching, CI.
- [Code map](CODEMAP.md) — generated index of every module. Do not edit.
- [Production readiness](PRODUCTION_READINESS.md) — what must happen before this
  could hold a real client file. Written to be honest, not reassuring.
- [Phase 1 plan](PLAN_PHASE_1.md) — the analysis that opened the project.
- [Prompts](../prompts/README.md) — the instructions a real Anthropic provider
  would be given. Nothing in this build sends them anywhere.
