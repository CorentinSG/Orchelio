# ADR-0012 — The simulated analysis derives its output rather than looking it up

**Status:** accepted · **Phase:** 6

## Context

Phase 6 needed Claude Analyst and Claude Reviewer without an API key, without a
network call and without a charge. The architecture note written in Phase 1
described `MockAIProvider` as holding "pre-written results for the fictional
matters", which is the obvious reading and the obvious way to build it.

Two things are wrong with it.

**It proves nothing.** The phase's acceptance criterion is that the Moreau
matter surfaces its date contradiction. If the contradiction is in a table
somebody typed, the test asserts that the table was typed correctly. The
mechanism that would find such a contradiction is exactly what is not built.

**It breaks the moment a firm uses the product.** A firm creating its own matter
— which Phase 5 made possible — gets an empty page, and the demonstration
becomes a demonstration of six specific rows rather than of a product.

## Decision

The Analyst is a set of deterministic rules over what the matter actually holds:
its recorded fields, its intake answers, and its document *names*. The Reviewer
is given the same input, re-derives what the Analyst should have found, and
reports the difference.

The rule that finds Moreau's contradiction is general: a date carried in a
document's filename that disagrees with the date recorded on the matter, for the
same subject. The subjects are declared — date of last entry against an I-94,
date of termination against a termination letter, and so on — because a
termination date and a complaint date are *supposed* to differ, and comparing
every date to every other date would produce noise.

## Consequences

- The Vasquez matter became the interesting test. Its filenames carry dates too
  (`internal-complaint-2026-04-28.pdf`), and they agree with the record, so the
  rule that fires on Moreau must stay silent. A lookup table could not have a
  meaningful negative case.
- A firm's own matter gets a real analysis.
- The output is reproducible, so the acceptance tests can assert on it exactly.
  A language model would not give that.
- The rules are visible and arguable, which is appropriate: they encode claims
  about how immigration and employment files are usually kept, and somebody who
  knows better can read `src/lib/ai/analyst.ts` and disagree.

## What this forced us to be honest about

**No document is ever opened.** There is no upload and no OCR (Phase 5), so
every fact sourced to a document comes from its name and kind. Every analysis
carries that as a standing warning, and the Reviewer fails an analysis that has
lost it.

This changed the confidence model mid-phase. The first version called a fact
`corroborated` when two documents of a plausible kind were on file — which is
not two sources agreeing, it is two unopened documents existing. Rendered as
"Two sources agree · 90%", it would have been the most misleading thing in the
product. The support levels now say what is actually true:

| Level | What it means |
| ----- | ------------- |
| `document_agrees` | A document's *filename* carries this value and it matches the record |
| `document_on_file_checked` | A checked document of the kind this is usually read from is attached |
| `document_on_file` | The same, unchecked |
| `stated_twice` | The record and the intake agree — both came from the client |
| `stated_only` | Said once, nothing on file bears on it |
| `disputed` | The sources disagree |

The simulated percentage is derived from the band by a fixed table. It is shown
small, beside the band, always labelled "simulated", and nothing is decided on
it.

## Alternatives considered

**A language model behind a flag.** Rejected for this build: it needs a key, it
costs money, and the specification forbids both. The seam exists —
`AI_PROVIDER=anthropic` — and asking for it throws with the reason rather than
falling back to the mock, because a silent fallback would let a firm believe it
was getting a real analysis when it was not.

**A lookup table plus derivation as a fallback.** Rejected: the interesting
matters would take the table path and never exercise the rules, which is the
same problem with an extra branch.
