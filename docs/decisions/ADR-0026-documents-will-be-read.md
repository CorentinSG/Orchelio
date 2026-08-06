# ADR-0026 — Documents will be read

**Status:** accepted · **Phase:** V1-1, applied in V1-2

## Context

The demonstration never opened a document: it stored a name, a type and a
size, and said so on every screen that could have implied otherwise
(ADR-0012, ADR-0013). That refusal was the honest answer for a product whose
analysis was simulated — an analysis that cannot read should not pretend to
have read.

Version 1's core promise is the opposite: open a matter, understand it in
thirty seconds, click any statement and land on the page of the document
that supports it. There is no way to cite a page without having read it. The
owner's specification makes document understanding — extraction, OCR,
classification, deduplication, indexing — the centre of the product.

## Decision

**The pipeline reads document content, and the licence to read is paid for
in sources: nothing extracted may be shown without the address of where it
came from.**

- Reading arrives in phase V1-2, not before, and with it the first real file
  storage this codebase has had. The `confidentiality:check` rule "nothing
  in src/ writes a file" is not deleted in advance: it stands until V1-2
  replaces it with the same named-module mechanism as egress — a storage
  module, listed, with what it stores, where, and under which decision.
- Every extracted fact carries `documentId`, page and character range. A
  fact whose origin was lost in processing is downgraded to an inference and
  displayed as one — losing the address costs the claim its status, not the
  reader their trust.
- Content lives in the same confidentiality class as the document it came
  from: `privileged`. Extraction does not launder sensitivity — an index
  built from privileged text is privileged, and the platform operator can
  read neither.
- What a model is shown from a document is decided per task and recorded in
  the run, so "what left the machine for this analysis" is a question the
  audit log can answer.

## Consequences

- Encryption at rest stops being a footnote and becomes a requirement the
  moment V1-2 stores its first byte — scheduled with the hosting work in
  ADR-0028, and stated in the register until then.
- Screens that said "no document is ever opened" must change in the same
  release that makes them false. The sentence becomes: "documents are read
  on this machine, and every statement shows its page."
- The old behaviour remains available as a fact about the past: analyses
  produced before V1-2 read nothing, and their records say so.
