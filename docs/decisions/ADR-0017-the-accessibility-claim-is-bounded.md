# ADR-0017 — The accessibility claim is bounded, and the bound is stated

**Status:** accepted · **Phase:** 9

## Context

Phase 9 asks for an accessibility pass: keyboard, contrast, screen-reader
labels, focus order. There are two ways to deliver that, and they produce very
different documents.

The first is to run an automated audit, fix what it reports, and write
"accessible" in the README. It is fast, it produces a green tick, and it is
misleading: automated rules detect roughly a third of WCAG, and none of the
third they miss is the easy third. A keyboard trap, an illogical focus order, a
label that is present but wrong, an announcement that fires at the wrong
moment — all pass an automated audit.

The second is to claim only what was actually tested, and say what was not. That
produces a weaker-sounding document. It is also the only version that survives
contact with somebody who uses a screen reader.

There is a related question about what to test *with*. axe-core is the standard,
it is MIT-licensed, and it runs inside the browser: no API key, no network, no
account. That fits the project's rule that it must cost nothing to run and that
nothing leaves the machine. A hosted audit service would not.

## Decision

**Audit automatically, fix everything it finds, and state the bound in the same
breath as the result.**

Concretely:

- `tests/e2e/accessibility.spec.ts` runs axe-core against every principal page,
  in **both themes**, against `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa` and
  `best-practice`. A violation fails the run.
- Alongside it, ordinary browser tests for what axe cannot judge: that the skip
  link moves focus, that focus is visible on everything it lands on, that the
  sign-in form can be completed by keyboard alone, that a matter's open tab is
  announced with `aria-current`, that a refusal is announced with `role="alert"`
  and the standing demonstration banner is *not*.
- The README, `docs/ACCEPTANCE.md` and the test file itself all say that
  automated coverage is about a third of WCAG, and that nothing has been tested
  with a real screen reader or by anybody with a disability.

Both themes, and that is not a formality. Contrast is the rule that fails most
often and the two palettes are separate; a token can clear 4.5:1 in one and fail
in the other. Testing only the default would have reported the product as fine
while half its users saw the failure.

## Consequences

- Two development dependencies, `axe-core` and `@axe-core/playwright`. They run
  locally and are not needed to *run* Orchelio.
- The audit found four rules failing across twenty-two pages, and every one was
  a real defect rather than a false positive. See the roadmap for the list; the
  most consequential was `--color-ink-subtle`, which measured 3.18:1 against the
  AI panel's background where 4.5:1 was needed — it was used for hints, counts
  and timestamps on nearly every screen.
- Fixing that contrast compressed the three-level text hierarchy: `ink-muted`
  and `ink-subtle` are now closer together than they were designed to be. That
  is the correct trade. Unreadable is not a hierarchy.
- A page that renders an unbounded list will eventually time the audit out. When
  `/approvals` did, the cause was that it rendered up to a hundred cards — and
  investigating it turned up a false count on the same screen. An audit that
  gets slower as the data grows is a useful alarm, so the timeout was not
  raised.
- The claim in the documentation is weaker than a competitor's would be. That is
  the point of it.

## See also

- [ADR-0009 — A dash, not a zero](ADR-0009-a-dash-not-a-zero.md)
- [Acceptance criteria](../ACCEPTANCE.md)
