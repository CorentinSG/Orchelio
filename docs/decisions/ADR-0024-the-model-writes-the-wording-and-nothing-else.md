# ADR-0024 — The model writes the wording, and nothing else

**Status:** accepted · **Phase:** post-9 · **Follows:**
[ADR-0023](ADR-0023-a-local-model-is-a-checked-exception.md)

## Context

ADR-0023 settled the shape a local model would have to take and enforced it
before anything used it. This is the thing that uses it.

The firms this is for are small, have no IT department, want an answer for a
client who asks where the file went, and want to spend as little as possible. A
model on the firm's own machine answers all four — nothing leaves, and the
marginal cost is electricity. What it does not answer is quality: a small
open-weight model is materially worse than a hosted one, and worst at the thing
that matters most here, which is refusing to conclude.

So the question was not "can we run a local model" — ADR-0023 answered that —
but **what may it be allowed to decide**, given that it will sometimes be wrong
and nobody in the firm is in a position to notice.

## Decision

**The model writes one paragraph. That is the whole of its authority.**

Everything else in an analysis — the facts, the timeline, the disagreements, the
missing documents, the questions, the sufficiency judgement — is derived by
`analyseMatter`, the same deterministic code the simulation uses, *before* the
model is contacted. The model is then handed those derived figures and asked to
restate them in plainer words.

This is not a first step towards giving it more. The parts of an analysis a firm
would be harmed by getting wrong are exactly the parts that need no model: a
disagreement between two dates is a comparison, the missing documents are a set
difference, the timeline is a sort. Handing any of them to a model trades
something that cannot be wrong for something that can, and buys nothing.

### It is not told whose file it is

The message carries counts, the *subject* of each disagreement, the *kinds* of
missing document, the matter's reference, and Orchelio's own summary. No client
name, no matter title, no field value, no date, no filename.

The material never leaves the machine either way, so this is not defence in
depth. It is that the smallest thing that does the job is the right thing to
send, and a client's name in a model server's log buys nothing at all. A unit
test fails if any of it appears in what is sent.

### What comes back is checked before it is stored

A small model will, sooner or later, conclude. `judgeSummary` refuses a
paragraph that:

- asserts an outcome — against `assertsAnOutcome`, the reviewer's own list, so
  the two cannot drift apart;
- uses a **figure that was not in what it was sent** — the allowed numbers are
  exactly the digits in the facts message, which is why the instruction is
  written without digits in it;
- contains a link or an address, which the record does not;
- does not name the matter it was asked about;
- is empty, or is an essay.

A refused paragraph is dropped, Orchelio's derived summary is used, and the
analysis says which of the two the reader is looking at. Both cases are stated,
not only the failure: "a model wrote this wording" and "Orchelio wrote this
wording" are different claims and a reader is entitled to know which one is on
the screen.

**The refused text is never quoted into the analysis.** A model that wrote "the
client is eligible" would otherwise have that sentence copied into a warning,
where the reviewer would find it and fail the analysis for containing the very
thing the check removed. The reason is named; the words go to the server console
and no further.

### The reviewer is deliberately not the model

`reviewAnalysis` stays deterministic. A reviewer that is the same model as the
analyst agrees with itself, which makes an unchecked analysis look checked —
the exact failure the reviewer exists to prevent. It also means the model's
paragraph is scanned twice against the same list: once before it is stored, and
once by a reviewer that does not know a model wrote it.

### `simulated` and `billable` are different questions

`AIProvider` gained `billable`. The two agree for the simulation (no model, no
charge) and would agree for a hosted API (both), and a local model is the case
that separates them: a real model runs and nobody is invoiced.
`UsageRecord.isRealCharge` now reads `billable`; deriving it from `!simulated`
would have printed **real charge** beside a run that cost nothing.

For the same reason a run now reports what it used rather than the runner
looking it up in a table: the simulation invents plausible figures, a local
server reports what it counted, and one set of numbers on the provider would
have had to be a guess for at least one of them.

### Three screens stopped asserting what the provider does

The usage page, the AI workspace and the system status each said "no request
leaves this machine" and "the figures are simulated" in their own words. True of
the only provider that existed, and displayed unchanged and wrong the moment
there was a second. Those sentences now live in `src/lib/ai/notice.ts`, one set
per provider, and a test fails if a fourth provider is added without deciding
what each of them becomes.

## Consequences

- **A firm gets a plainer summary and gives up nothing to get it.** If the model
  is slow, absent, wrong or absurd, the analysis is the one it would have had
  anyway, with a sentence saying why.
- **The cost is zero and the screens say so honestly.** Not "simulated cost" —
  a real run that nobody invoices. What Orchelio cannot see, and now says it
  cannot see, is the electricity and the machine.
- **It does not make a small model good.** It makes the blast radius of a bad
  one a paragraph, which is a different claim. The reason this is defensible at
  all is that `MatterAnalysisResult` has no field for a conclusion — a model has
  nowhere to put one even if it writes one.
- **It is not measured against a real model.** No model is installed in this
  repository, so what is proved is everything around the model: what it is sent,
  what is done with what comes back, and what the analysis says in each case.
  How often a given 7B model trips `judgeSummary` is unknown, and a firm should
  expect to find out on its own machine.
- **The check catches digits, not words.** "Nineteen documents" passes where
  "19 documents" does not. A test asserts the gap rather than leaving it to be
  discovered, and the defence against it is that the model is only ever
  restating a paragraph it was handed.
- **`localhost` is still refused**, which will surprise somebody. The refusal
  says to write `127.0.0.1`, because a refusal without an instruction is a
  puzzle.

## See also

- [ADR-0023 — A local model is a checked exception](ADR-0023-a-local-model-is-a-checked-exception.md)
- [ADR-0013 — A conclusion has nowhere to live](ADR-0013-a-conclusion-has-nowhere-to-live.md)
- [ADR-0021 — A setting that changes nothing is a claim](ADR-0021-a-setting-that-changes-nothing-is-a-claim.md)
- [ADR-0018 — Confidentiality by construction](ADR-0018-confidentiality-by-construction.md)
