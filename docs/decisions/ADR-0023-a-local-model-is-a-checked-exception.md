# ADR-0023 — A local model is a checked exception, not a trusted one

**Status:** accepted · **Phase:** post-9

## Context

The firms this product is for are small, have no IT department, and want two
things that usually pull against each other: a tool that helps, and an answer
they can give a client who asks where the file went.

A hosted model answers the first and complicates the second — the material
reaches a third party, and it costs money per token for ever. A model running on
the firm's own machine answers both: nothing leaves, and the marginal cost is
electricity.

Except that Orchelio could not run one. `npm run confidentiality:check` enforces
that **no module in `src/` can open a socket**, against an allow-list that is
empty, and that check is the strongest promise the product makes. A local model
needs a socket.

The lazy resolution is to widen the allow-list with a comment saying the address
is local. That is worthless. A static check cannot tell
`fetch("http://127.0.0.1:11434")` from `fetch("https://api.example.com")` — both
are `fetch(`. An allow-list widened on trust is a hole with a comment beside it,
and the comment is what somebody reads instead of the code.

## Decision

**Loopback is a different promise from egress, and it is admitted only because
it can be checked.**

### The guarantee is structural

`src/lib/ai/loopback.ts` exposes `assertLoopback`, which returns a URL or throws.
It **cannot return anything outside 127.0.0.0/8 and ::1**. A module allowed to
talk to a local model takes its address from that function and has no other way
to obtain one.

The promise moves from *"we only call localhost"* to *"there is no code path by
which a different address could be reached"* — which is the only form of that
sentence worth telling a client.

### A hostname is refused, `localhost` included

A name is resolved by the machine. `/etc/hosts`, a DNS search domain or a
captive network can point `localhost` somewhere else and nothing in the process
would notice. The value of the check is that it does not depend on the machine's
configuration being benign, so only a literal address is accepted.

The refusal says what to write instead. "localhost is refused" without
"use 127.0.0.1" is a puzzle, not an instruction.

Two more refusals worth naming, because both look local and are not: a private
network address (`192.168.x.x`, `10.x.x.x`) crosses a network and can be
captured on it; and `http://127.0.0.1@evil.com/` parses to the host `evil.com` —
the part before the `@` is a username. Parsing before judging is what catches
the second.

### The allowance is verified, not recorded

`EGRESS_ALLOWED` entries may be marked `loopbackOnly`. The check then requires
two things of that module, and fails the build without either:

1. it calls `assertLoopback(`, and
2. it contains **no address literal of its own** — even a loopback one, because
   a literal is an address the guard never sees, and the next edit to it would
   be checked by nothing.

Both were proved by planting: a module allowed as loopback that never calls the
guard fails; one that calls the guard but writes `http://127.0.0.1:11434` into
its source fails; one that takes its address from outside passes.

### The list is still empty

Nothing uses this. The analysis in this build is a deterministic simulation,
`AI_PROVIDER=mock`, and no module opens a socket. What has changed is that the
shape a local model would have to take is settled and enforced *before* anybody
writes one, rather than argued about in the review that lands it.

## Consequences

- **A firm can be told where the material goes, in one sentence that is true.**
  `LOOPBACK_PROMISE` is on the confidentiality register: the request never
  reaches a network card, and the build fails if that stops being so.
- **The register gained a row that says nothing uses it yet.** A rule with an
  enforcement and no subject is still worth showing — the alternative is a firm
  discovering the shape of the thing after it ships.
- **It does not make a local model good.** A small open-weight model is
  materially worse at the tasks that matter here, and worst at the one that
  matters most: refusing to conclude. Orchelio's architecture is unusually
  robust to that — `MatterAnalysisResult` has no field for a conclusion, so a
  model has nowhere to put one, and the reviewer fails an analysis that
  overstates. That is a reason it is *safer here than elsewhere*, not a reason
  to expect it to be as good.
- **It does not write the provider.** The socket is now permitted in a shape
  that can be checked; a working `AI_PROVIDER=local` still has to be built and
  measured against a real model, which cannot be done in this repository
  because no model is installed in it.
- **Most of the analysis needs no model at all.** The disagreement between two
  dates is a comparison, the missing documents are a set difference, the
  timeline is a sort. Those are built, deterministic, free, and more reliable
  than any model because they cannot confabulate. A local model is for the two
  things rules genuinely cannot do — reading unstructured document text, and
  writing prose.

## See also

- [ADR-0012 — The simulation derives rather than looks up](ADR-0012-the-simulation-derives-rather-than-looks-up.md)
- [ADR-0013 — A conclusion has nowhere to live](ADR-0013-a-conclusion-has-nowhere-to-live.md)
- [ADR-0018 — Confidentiality by construction](ADR-0018-confidentiality-by-construction.md)
