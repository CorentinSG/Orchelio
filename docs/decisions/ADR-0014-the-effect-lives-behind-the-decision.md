# ADR-0014 — The effect lives behind the decision

**Status:** accepted · **Phase:** 7

## Context

Phase 7's acceptance criterion is that no sensitive action can complete without
an explicit human decision. The obvious way to build that is a check:

```ts
if (await requiresApproval("close_matter", firm)) {
  await createApprovalRequest(...);
  return;
}
await closeMatter(matterId);   // ← and here it is
```

This works, and it is wrong in a way that only shows up later. `closeMatter` is
now a function that closes a matter, callable from anywhere, whose relationship
to the approval rule is a convention. The second caller — a bulk action, a
cleanup script, a well-meaning refactor — will not have the check, and nothing
will fail. The rule holds because everybody remembered.

There is a second, quieter version of the same problem. Because a configurable
rule can be switched off, there are genuinely two routes by which a matter
closes: with a decision and without one. Written separately, they drift. The
approved route grows a status change or an audit line that the unapproved route
does not, and the difference is invisible until somebody notices that closing a
matter does different things at two firms.

## Decision

There is no `closeMatter()` to call.

A sensitive action calls `raiseApproval`, which does one of two things:

- **a decision is needed** — it creates the request and returns. Nothing else
  happens. The effect is applied later by `decideApproval`, and by nothing else;
- **no decision is needed** — the firm has not switched the rule on and it is
  not one of the nine locked ones — it applies the effect immediately, through
  `applySensitiveEffect`, and records that nobody had to approve it.

`applySensitiveEffect` is exported for exactly that reason: one implementation,
two callers, so the approved and unapproved routes cannot come apart.

`requiresApproval` reads the lock **first** and never consults the firm's
configuration for a locked rule. There is no ordering of checks, and no
configuration value — `false`, `0`, `null`, `"no"`, absent — that reaches the
second half of the function.

## Consequences

- The interesting test is not "approving works". It is that the effect had
  **not already happened** before anybody approved, so
  `tests/integration/approvals.test.ts` asserts the state before each decision
  as well as after it.
- Two decisions racing cannot both win: the decision is written with an update
  filtered on `status: "pending"`, so the second gets `already_decided` rather
  than overwriting the first, and the effect applies exactly once.
- An action nobody declared throws instead of being quietly permitted. Failing
  closed costs a crash in development and prevents a silent gap in production.
- Adding a sensitive action means adding an entry to `APPROVABLE_ACTIONS` and a
  case to `applySensitiveEffect`. Forgetting the second gives a decision that
  changes nothing and logs `effectApplied: false` — visible, rather than a
  matter that quietly never closes.

## Where the state of an approved thing lives

For two of the four actions, approving changes something: a matter closes, a
draft becomes usable. For the other two — relying on an analysis, confirming a
recorded date — there is nothing to change, and the temptation is to add a flag:
`analysis.approved`, `matter.deadlineConfirmed`.

Rejected. The approval row already carries who decided, when, with what note.
A flag beside it is a second copy of the same answer, and two copies can
disagree — which is the same reasoning that removed the duplicated
`representation_side` in Phase 5 (see `docs/ROADMAP.md`). The screens read the
approval.

## What is not solved

**Nothing stops the person who asked from being the person who decides.** With
five demonstration accounts, separating them would make the demonstration
unusable, and the specification does not ask for it. A real deployment handling
a real file would want at least an option to require a different decider, and
`PRODUCTION_READINESS.md` records that.

**Four rules of eighteen are raised.** The approval centre lists the rest by
name rather than leaving a firm to assume a rule it switched on is protecting
it. Several are unreachable rather than unimplemented — Orchelio has no
transport, so nothing can be submitted, shared or sent — but "unreachable" and
"not built" are different claims and the screen makes both.
