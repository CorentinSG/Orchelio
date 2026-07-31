# ADR-0022 — The short way in

**Status:** accepted · **Phase:** post-9

## Context

Orchelio could already do everything a small firm needs on its first morning.
It took ten steps: create a matter, fill eight fields, find the documents tab,
add each file one at a time with a category chosen for each, find the AI tab,
press run.

Every one of those steps is defensible on its own. The sum of them is where a
solicitor who does not think of themselves as a computer person gives up — and
that person is the target. A two-partner firm has no IT department, no
onboarding week, and no patience for a product that feels like data entry
before it has been useful once.

The competing pressure is that this product's entire value is that it does not
overstate what it knows. A screen that quietly does three things on one button
press is a screen nobody can predict, and **a lawyer who cannot predict a tool
will not put a client's file in it.** Simplicity bought by hiding what happens
would cost more than it saved.

## Decision

**One screen, four answers — and the steps are listed before the button, not
reported after it.**

### The composition adds no new power

`/api/start` calls `createMatter`, `addDocument` and `runAnalysis`, in that
order, each behind the same permission check it has on its own screen. There is
no shortcut through any of them. In particular the analysis still goes through
`raiseApproval`, so a matter opened this way waits for a person exactly as one
opened the long way does — proved in the browser rather than asserted.

Holding `matter.create` does not grant `document.upload`. Somebody with one and
not the other opens the matter and is told the files were not recorded, rather
than having the rule quietly relaxed because three steps now share a button.

### A later step failing does not undo an earlier one

If the analysis cannot run, the matter and its documents are still real and the
person is taken to them. Rolling back a matter somebody has just described, to
protect a step they did not ask about, would lose their work to tidy up ours.

### Predictability is the feature, not the cost of it

`guidedReadiness` computes, before anything is submitted, which of the four
steps will run and which will not — and the page shows **all four either way**,
with the reason beside the ones that will not. Dropping a step from the list
would let somebody believe their files were recorded.

The two unavailable-analysis cases are told apart deliberately: *this firm
switched the features off* and *your role does not run one* have different
remedies, and one message for both would send half its readers to a settings
page they cannot change.

### Files land unsorted

The long form asks what each document is. This one does not, and that is the
single biggest saving — classifying a document before reading it is what makes
the long route feel like data entry.

They are filed as `other`. **A wrong category is worse than none**: the
missing-documents check would then believe something is on file that is not.
Unsorted is the honest state until a person looks, and the matter's documents
tab is where they say.

### The arrival says what each part did

*"IMM-2026-004 exists, 2 files are listed on it. Nothing has been decided."*
Counts rather than a checkmark, because three things happened on one press and
a person who cannot see what each one did has to go and check — which is the
work the screen was meant to remove.

## Consequences

- **`/matters/new` stays, unchanged.** It is the screen for somebody who already
  knows the dates, the status and the rest. Two doors, and each page links to
  the other.
- **`/start` sits above Matters in the sidebar**, because a menu is read from
  the top and this is the item a firm needs in its first week.
- **Nothing about confidentiality is relaxed.** The file is still never posted —
  the browser reads name, type and size and sends those as text, and there is
  no code path here that could receive the bytes. The sentence saying so now
  appears beside the drop zone, where the decision to drag a client's file is
  actually made, rather than only on a settings page.
- **It does not fix onboarding.** A firm still completes a seven-step
  questionnaire before any of this is reachable, and for the target user that
  remains the first cliff. Named here rather than left implied.
- **It does not translate anything.** The interface is still English only — see
  [ADR-0021](ADR-0021-a-setting-that-changes-nothing-is-a-claim.md). Plain
  English is not the same as the firm's own language.

## See also

- [ADR-0009 — A dash, not a zero](ADR-0009-a-dash-not-a-zero.md)
- [ADR-0014 — The effect lives behind the decision](ADR-0014-the-effect-lives-behind-the-decision.md)
- [ADR-0021 — A setting that changes nothing is a claim](ADR-0021-a-setting-that-changes-nothing-is-a-claim.md)
