---
title: Acceptance criteria and what proves them
tags: [reference, testing]
---

# Orchelio — every acceptance criterion, and the test that proves it

Each of the nine build phases ends with one acceptance criterion. This note
maps every criterion to the tests that prove it, by name.

It exists because a claim in a roadmap is a claim, and a claim in a roadmap
about a test that has since been renamed is worse than no claim at all. So this
file is **checked**: `npm run acceptance:check` verifies that every test named
below exists, in the file named beside it, and fails the build if one has moved.
It runs inside `npm run verify`.

**What this is not.** A criterion with a test beside it is a criterion somebody
wrote a test for. It is not a proof that the criterion is the right one, and
covering every criterion is not covering every behaviour. The three test levels
each answer a different question, and the level matters:

| Level | Answers |
| ----- | ------- |
| Unit | Is the rule right, in isolation and deterministically? |
| Integration | Does it hold against a real migrated database, inside and across the firm boundary? |
| Browser | Does the honesty survive being rendered, and do refusals refuse? |

---

## Phase 1 — Initialisation

**Criterion:** the home page reports the state of the running system rather than
a fixed picture of it — a broken install is visible immediately, with the exact
command that fixes it.

Recorded retroactively: Phase 1 predates the practice of writing the criterion
down, and saying so is more useful than pretending otherwise.

Proved by:

- `tests/e2e/home.spec.ts` — "reports live database status"
- `tests/e2e/home.spec.ts` — "renders under the Orchelio identity"
- `tests/e2e/home.spec.ts` — "states that no live AI call is made"
- `tests/unit/app-identity.test.ts` — "never uses a generic product name"
- `tests/unit/env.test.ts` — "rejects an unknown AI provider instead of guessing"

---

## Phase 2 — Data and authentication

**Criterion:** each demonstration account lands in its own workspace; a firm
user is refused platform administration; a signed-out request for a protected
page never receives workspace content.

Proved by:

- `tests/e2e/auth.spec.ts` — "an immigration attorney lands in the immigration firm"
- `tests/e2e/auth.spec.ts` — "an employment paralegal lands in the employment firm with paralegal rights"
- `tests/e2e/auth.spec.ts` — "a firm user is refused platform administration"
- `tests/e2e/auth.spec.ts` — "never sends workspace content to a signed-out visitor"
- `tests/e2e/auth.spec.ts` — "never sends platform administration content to a signed-out visitor"
- `tests/e2e/auth.spec.ts` — "gives an unknown address exactly the same message as a wrong password"
- `tests/unit/permissions.test.ts` — "cannot approve an analysis, confirm a deadline, close a matter or draft a communication"
- `tests/unit/permissions.test.ts` — "cannot read matter or document content by default"
- `tests/unit/password.test.ts` — "never stores the password itself"
- `tests/unit/rate-limit.test.ts` — "allows the first ten attempts and refuses the eleventh"

---

## Phase 3 — Multi-firm

**Criterion:** an immigration user cannot open an employment matter by any
route — through the data layer, through a copied identifier, through search,
through a forged cookie or through a tampered form — and every refusal is
recorded.

This is the criterion the whole product rests on, so it is the one with the most
tests, at every level.

Proved by:

- `tests/integration/isolation.test.ts` — "an immigration user cannot open an employment matter"
- `tests/integration/isolation.test.ts` — "a URL copied from the other firm resolves to nothing, not to a record"
- `tests/integration/isolation.test.ts` — "a matter title shared by both firms still returns only one"
- `tests/integration/isolation.test.ts` — "an identical filename in both firms never crosses over"
- `tests/integration/isolation.test.ts` — "refuses a read of matters with no firm named"
- `tests/integration/isolation.test.ts` — "still allows queries against platform-wide catalogues"
- `tests/e2e/firm-isolation.spec.ts` — "a forged active-firm cookie does not open the other firm"
- `tests/e2e/firm-isolation.spec.ts` — "submitting another firm's identifier to the switcher is refused"
- `tests/e2e/firm-isolation.spec.ts` — "an employment user never sees the immigration firm anywhere on the page"
- `tests/unit/firm-scope.test.ts` — "refuses OR unless every branch names the firm"
- `tests/unit/firm-scope.test.ts` — "classifies every model in the schema as either firm-scoped or platform-wide"
- `tests/unit/firm-context.test.ts` — "ignores a preference for a firm the user does not belong to"

---

## Phase 4 — Onboarding

**Criterion:** answering the questionnaire reproduces both configurations
printed in the specification, and the same answers given at the two
demonstration firms produce two different dashboards.

Proved by:

- `tests/unit/onboarding-config.test.ts` — "produces the published workflows"
- `tests/unit/onboarding-config.test.ts` — "produces the published workflows, in employment vocabulary"
- `tests/unit/onboarding-config.test.ts` — "gives identical answers different meanings per practice area"
- `tests/unit/onboarding-config.test.ts` — "cannot be switched off by omitting them"
- `tests/e2e/onboarding.spec.ts` — "reproduces the published immigration configuration"
- `tests/e2e/onboarding.spec.ts` — "gives the same answers a different meaning at an employment firm"
- `tests/e2e/onboarding.spec.ts` — "and so does the server, when the browser is bypassed"
- `tests/unit/dashboard-widgets.test.ts` — "gives each practice area its own questions"

---

## Phase 5 — Matters and documents

**Criterion:** the six fictional matters exist with their twenty-two documents
under the right firm, each demonstrating what the simulated analysis will need —
including the matter whose intake says the last entry was 11 February 2024 while
the I-94 on file is dated 4 March 2024.

Proved by:

- `tests/integration/matters.test.ts` — "creates it in the caller's firm and nowhere else"
- `tests/integration/matters.test.ts` — "reuses a client of the same name within the firm, and never the other firm's"
- `tests/integration/matters.test.ts` — "counts a matter as missing an identity document until one is filed"
- `tests/e2e/matters.spec.ts` — "shows the immigration fields, and none of the employment ones"
- `tests/e2e/matters.spec.ts` — "refuses another firm's matter as though it did not exist"
- `tests/e2e/matters.spec.ts` — "refuses a hand-crafted post that skips the browser's checks"
- `tests/unit/matter-fields.test.ts` — "never offers immigration fields to an employment firm, or the reverse"
- `tests/unit/matter-fields.test.ts` — "is never copied into the JSON blob, even when posted"

---

## Phase 6 — Simulated AI

**Criterion:** the Daniel Moreau matter surfaces the disagreement between the
entry date on the record and the date in the I-94's own filename, shows both
with their sources, and refuses to resolve it. The Amira Hassan matter reaches
"more information required" and states no conclusion.

Proved by:

- `tests/unit/ai-analyst.test.ts` — "surfaces the disagreement over the date of entry"
- `tests/unit/ai-analyst.test.ts` — "shows both dates, and says where each came from"
- `tests/unit/ai-analyst.test.ts` — "refuses to resolve it"
- `tests/unit/ai-analyst.test.ts` — "reaches 'more information required'"
- `tests/unit/ai-analyst.test.ts` — "reaches no conclusion of any kind"
- `tests/unit/ai-analyst.test.ts` — "has nowhere to put a conclusion"
- `tests/unit/ai-analyst.test.ts` — "is deterministic"
- `tests/unit/ai-reviewer.test.ts` — "does not call itself an approval"
- `tests/unit/ai-reviewer.test.ts` — "still requires a human"
- `tests/integration/analyses.test.ts` — "never stores humanReviewRequired as false"
- `tests/e2e/analysis.spec.ts` — "shows both dates side by side, with where each came from"
- `tests/e2e/analysis.spec.ts` — "refuses to say which is right"

---

## Phase 7 — Approvals and audit

**Criterion:** the two effects that change anything — closing a matter and
approving a draft for use — are applied by `decideApproval` and by nothing else,
and every decision appears in the log with its note, its decider and whether
anything took effect.

The interesting case is not "approving works". It is "the effect had not already
happened before anybody approved", so these assert the state *before* each
decision as well as after it.

Proved by:

- `tests/integration/approvals.test.ts` — "raises a request even with every configurable rule switched off"
- `tests/integration/approvals.test.ts` — "leaves the draft unusable until somebody decides"
- `tests/integration/approvals.test.ts` — "needs a decision when the firm asked for one, and closes nothing before it"
- `tests/integration/approvals.test.ts` — "takes effect immediately when the firm did not ask for one"
- `tests/integration/approvals.test.ts` — "records that nobody had to approve it, which is what an audit is for"
- `tests/integration/approvals.test.ts` — "is refused, and does not overwrite the first decision"
- `tests/integration/approvals.test.ts` — "logs a decision that changed nothing just as loudly"
- `tests/unit/approval-rules.test.ts` — "requires a decision even when its own rule is set to false"
- `tests/unit/approval-rules.test.ts` — "requires a decision whatever nonsense the configuration holds"
- `tests/e2e/approvals.spec.ts` — "states what approving will cause, above the buttons"
- `tests/e2e/approvals.spec.ts` — "refuses a rejection with no note, on the server"

---

## Phase 8 — Usage and administration

**Criterion:** a third firm can be created entirely through the interface, with
no code change.

Proved by:

- `tests/e2e/admin.spec.ts` — "a third firm can be created entirely through the interface"
- `tests/integration/platform.test.ts` — "creates the firm, its configuration and its first administrator"
- `tests/integration/platform.test.ts` — "carries all nine locked approval rules from the first second"
- `tests/integration/platform.test.ts` — "leaves the new firm empty, and blind to the firms that already existed"
- `tests/integration/platform.test.ts` — "names no matter, client or document"
- `tests/integration/settings.test.ts` — "survive a request that tries to switch every one of them off"
- `tests/e2e/settings.spec.ts` — "the nine locked rules are shown with no way to switch them off"
- `tests/e2e/admin.spec.ts` — "names no matter, client or document anywhere"
- `tests/unit/new-firm.test.ts` — "refuses a practice area with no template"
- `tests/unit/guide.test.ts` — "sends every step to a route that exists"

---

## Phase 9 — Tests and documentation

**Criterion:** every earlier criterion is named here with the test that proves
it, and that mapping is checked rather than asserted; no page in the product has
a machine-detectable accessibility violation in either theme; and every
procedure a reader would need is written down.

Proved by:

- `tests/e2e/accessibility.spec.ts` — "every settings section has no detectable violation"
- `tests/e2e/accessibility.spec.ts` — "the refusal page has no detectable violation"
- `tests/e2e/accessibility.spec.ts` — "the not-found page has no detectable violation"
- `tests/e2e/accessibility.spec.ts` — "the first tab reaches a skip link that works"
- `tests/e2e/accessibility.spec.ts` — "focus is visible on every interactive element it lands on"
- `tests/e2e/accessibility.spec.ts` — "the sign-in form can be completed and submitted by keyboard alone"
- `tests/e2e/accessibility.spec.ts` — "a refused save is announced, not merely displayed"
- `tests/e2e/accessibility.spec.ts` — "every page has exactly one first-level heading"
- `tests/integration/approvals.test.ts` — "counts every request, not the ones that happened to be fetched"

The mapping itself is checked by `scripts/acceptance-check.mjs`.

---

## What no test here proves

Stated because a coverage document that only lists what is covered is the same
shape of lie as a zero where a dash belongs.

- **That the criteria are the right criteria.** They come from the
  specification; nobody has re-derived them.
- **That the product is accessible.** Automated rules catch roughly a third of
  WCAG. Nothing here has been tested with a real screen reader, by a keyboard-only
  user, or by anybody with a disability.
- **That isolation holds against a compromised process.** All three enforcement
  layers run inside the application. See
  [Production readiness](PRODUCTION_READINESS.md).
- **That the simulated analysis resembles a real model's output.** It is a
  different mechanism producing the same *shape* of result. See
  [ADR-0012](decisions/ADR-0012-the-simulation-derives-rather-than-looks-up.md).

## See also

- [Roadmap](ROADMAP.md) — what each phase delivered
- [Development harness](HARNESS.md) — how to run each suite
- [Production readiness](PRODUCTION_READINESS.md) — what is not done
