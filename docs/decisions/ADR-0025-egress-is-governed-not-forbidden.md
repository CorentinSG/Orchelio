# ADR-0025 — Egress is governed, not forbidden

**Status:** accepted · **Phase:** V1-1

## Context

The strongest promise the demonstration made was structural: `npm run
confidentiality:check` failed the build if any module in `src/` could open a
socket, against an allow-list that was empty. ADR-0023 admitted one narrow
exception — loopback, checked by a guard that cannot produce a non-local
address.

Version 1 connects the product to the outside world: a hosted model rewords
summaries today; Microsoft 365, Gmail and document stores follow after V1.
The owner approved this pivot on 6 August 2026 (docs/PLAN-V1.md). "Nothing
can reach the network" is no longer the product; deleting the check because
it no longer fits would be worse — every future connector would then be one
unreviewed `fetch` away.

## Decision

**The empty allow-list becomes a governed one. The check stays, and every
entry must carry three things: the module, the hosts, and the decision.**

An entry for a third-party destination has this shape:

```js
"src/lib/ai/mistral-provider.ts": {
  hosts: ["api.mistral.ai"],
  reason: "What is sent, to whom, under what agreement.",
  decidedIn: "ADR-0027",
},
```

And the check enforces, failing the build otherwise:

1. **Only listed modules can reach the network.** Unchanged from before.
2. **A listed module names only its listed hosts.** Every absolute URL
   written into the module must resolve to a host on its list — a second
   address in the same file is a destination the review never saw.
3. **No other module names a listed host.** The only path to a third party
   is the module that was reviewed for it. A URL constant exported from a
   helper and imported by the provider would otherwise reach the same
   destination while the provider's own source scan sees nothing.
4. **Every entry names its decision.** An entry without a `decidedIn`
   pointing at an ADR is rejected. The allow-list is a table of contents of
   arguments, not a list of permissions.

Loopback entries (ADR-0023) are unchanged: they remain checked against
`assertLoopback` and may contain no address literal at all.

## Consequences

- The register a firm reads in Settings must name every destination the
  moment one exists, with what is sent and what is not. A destination the
  check allows but the register omits would make the register a lie — the
  row lands in the same commit as the entry.
- The promise weakens, and the wording must weaken with it: "nothing leaves
  this machine" was true and is retired. The true sentence is "nothing
  leaves this machine except what is listed, to the parties listed, under
  the agreements listed" — longer, and the only honest version.
- What the check still does not prove is unchanged from before: it reads
  source, not a running process. A compromised dependency can still open a
  socket. That boundary belongs to the host's network policy and is recorded
  in docs/PRODUCTION_READINESS.md.
- Proved by planting before the first entry landed: a module fetching an
  unlisted host fails; a listed module writing a second host into its source
  fails; an unrelated module naming a listed host fails; an entry without
  `decidedIn` fails.
