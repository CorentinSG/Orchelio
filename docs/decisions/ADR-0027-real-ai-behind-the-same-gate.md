# ADR-0027 — Real AI behind the same gate, routed by cost

**Status:** accepted · **Phase:** V1-1

## Context

The demonstration's AI was simulated by specification, and the simulation was
built to be worth keeping: it derives every figure from the matter's own
fields (ADR-0012), has no field in which a conclusion could live (ADR-0013),
and the one real model admitted — local — was allowed to write the wording
and nothing else (ADR-0024).

Version 1 needs real intelligence at a price a one-to-ten-lawyer firm can
pay. The owner's requirements: one API key, the cheapest capable model per
task, European processing, contractual confidentiality, and no model name,
token count or prompt ever shown to a lawyer.

## Decision

**One provider contract, four engines, and a router that chooses by task
class — never the user.**

- **Mistral is the hosted provider.** French company, European processing,
  paid tier contractually excluded from training on API traffic, and one key
  spans the whole range — tiny models for classing and extraction, mid-size
  for summaries and drafting, large for cross-document analysis. The
  routing the specification demands works without a second vendor. The
  adapter (`src/lib/ai/mistral-provider.ts`) is the only module allowed to
  name `api.mistral.ai`, under ADR-0025 terms.
- **The mock stays, as the test engine.** Every automated test runs against
  the simulation: deterministic, free, offline. A test that needs a paid API
  to pass is a test that stops running. `AI_PROVIDER=mock` remains the
  default; `mistral` is selected explicitly, and selecting it without
  `MISTRAL_API_KEY` fails at startup rather than falling back silently —
  the same refusal ADR-0012 established for the Anthropic provider.
- **Tasks carry a class, the router maps class to model.** `light`
  (classify, extract, file, deduplicate), `intermediate` (summarise,
  timeline, compare, draft), `advanced` (whole-matter analysis). The
  mapping lives in one module with the prices beside it. Nothing outside
  the gateway may name a model.
- **Every run is counted.** Provider, model, task class, input and output
  tokens, and an estimated cost computed from a price table that carries its
  own as-of date — an estimate labelled as one, per ADR-0021's rule that a
  number must not claim more than it knows. `billable` stays a separate
  question from `simulated` (ADR-0024): mistral runs are both real and
  billable; local runs real and free.
- **What the hosted model is sent in V1-1 is what the local model was sent**
  (ADR-0024): derived figures, disagreement subjects, missing-document
  kinds, the matter reference. No client name, no field value, no date, no
  filename, no document content — content only arrives with V1-2/V1-3, per
  task, recorded per run. The same refusal checks apply unchanged to what
  comes back: no outcome, no foreign figure, no link, or the paragraph is
  dropped and the derived summary is shown instead.

## Consequences

- The per-provider notices (`src/lib/ai/notice.ts`) gain a fourth set — the
  guard that fails the build until every screen's sentence is decided is
  doing exactly its job.
- Real money now moves, in centimes. The usage screen stops simulating and
  the caps arrive in V1-7; until then the ledger records and the register
  says caps are not yet enforced.
- The environment this project is developed in blocks `api.mistral.ai` at
  its network policy; live verification runs from the owner's machine or
  after the owner allows the domain. The build must therefore never require
  the network: `npm run ai:smoke` exists for a human to prove the key works,
  and nothing else touches the API.
- Prices drift. The table's as-of date is printed wherever an estimate is,
  and comparing an estimate to Mistral's invoice is listed as an owner
  action before pilots.
