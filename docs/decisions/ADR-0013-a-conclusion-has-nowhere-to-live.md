# ADR-0013 — A conclusion has nowhere to live

**Status:** accepted · **Phase:** 6

## Context

Four of the nine locked approval rules exist to stop Orchelio reaching a legal
conclusion on its own: no eligibility conclusion, no legal advice delivery, no
deadline confirmation, no settlement communication — each requires a person.

Phase 6 is where that stops being a rule about approvals and starts being a
question about output. An analysis that says "the client entered on 11 February,
their status expires on 30 September, and the extension window is 45 days" has
not stated a conclusion. Add one more sentence and it has. The sentence is easy
to write, reads helpfully, and is the thing a busy reader would quote.

## Decision

Three layers, arranged so that the cheap one catches carelessness and the
expensive one catches intent.

### 1. The type has no field for it

`MatterAnalysisResult` has no `conclusion`, `recommendation`, `eligibility` or
`advice`. Not empty — absent. Adding one is a deliberate act with a diff, not a
line somebody slips into a template. `tests/unit/ai-analyst.test.ts` asserts the
absence, so the shape cannot quietly grow one.

### 2. The Reviewer scans the prose

Ten patterns over the text Orchelio itself wrote — the summary, the warnings,
the contradiction notes, the questions: eligibility findings, findings of
unlawfulness, recommendations, advice to act, predictions of outcome, legal
characterisations, assessments of merits, confirmed deadlines and limitation
dates. A match is a `premature_legal_conclusion` issue and the review returns
`corrections_required`.

It scans only Orchelio's own prose. A key fact's *value* is what the firm
recorded about the client; flagging "the client says the treatment was
discriminatory" would be flagging the client, not the product.

### 3. Nothing is ever approved

`humanReviewRequired` is `true` in every result the Reviewer can produce, and it
is stored on the row rather than assumed by a screen. `approved_for_human_review`
means "ready to be read by a person" — it is the reviewer clearing an analysis
for a human, not approving anything.

## Consequences

- The conclusion scan has never fired in normal operation, and that is what it
  is for. It is a regression guard, and a guard nobody has seen fail is not a
  guard — so `tests/unit/ai-reviewer.test.ts` hands it eight sentences that
  should trip it and asserts each one does.
- A real provider inherits the same contract. `prompts/analyst.v1.md` states the
  rule; `prompts/reviewer.v1.md` states the check. The shapes are unchanged, so
  the scan runs over a model's output exactly as it runs over the simulation's.
- The analysis is less immediately satisfying to read. That is correct. The
  sentence a reader wants is the one a lawyer is paid to write.

## A note on what "more information required" means

`insufficient_information` is a judgement about the **file**, not the matter. An
analysis that reaches it is saying Orchelio could not describe much, not that
the client has a weak case — and the wording says so, in the result and on the
screen. Getting this backwards would turn a thin file into an implied opinion,
which is the same failure in a quieter voice.
