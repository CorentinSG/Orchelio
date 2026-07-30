# ADR-0019 — Separation of duties is offered, not imposed

**Status:** accepted · **Phase:** post-9

## Context

Every sensitive action in Orchelio needs a person's decision. Until now nothing
stopped that person being the same one who asked for it. `PRODUCTION_READINESS`
had it as ⛔: *"Nothing prevents the person who asked from being the person who
approves. Acceptable for a demonstration with five accounts; not for a real
file."*

It is worth naming why this matters more here than in most products. An approval
you grant yourself still produces a record, a timestamp and a name — it looks
exactly like a control. What it does not produce is a second person's judgement,
which is the entire reason the approval exists. A control that leaves the same
artefact whether or not it worked is the most dangerous kind.

The obvious fix — always refuse a self-decision — is wrong, and the reason is
not a compromise. **A sole practitioner is a legitimate law firm.** Refuse
unconditionally and their queue becomes undecidable: every request they raise
can never be approved *or rejected*, so it sits there for ever. A safety control
that stops the work is one somebody switches off permanently, and then it
protects nobody at all.

## Decision

**Naming the requester is unconditional. Refusing them is the firm's choice —
and the firm cannot make that choice until it can survive it.**

Three parts.

### The information is always given

Whenever somebody is about to decide a request they raised, the card says so, in
those words: *"You raised this request. Deciding it yourself records that a
person looked, and that person is you."* This appears whether or not the firm
has the rule switched on. Only the refusal is configurable; the fact never is.

The audit entry carries `decidedOwnRequest` on **every** decision, including the
ones the firm permits. A log that recorded only the refused cases would record
the wrong half — "this person approved their own request" is precisely what
somebody reading it a year later is looking for.

### The refusal is enforced where it cannot be skipped

Inside `decideApproval`, which is the only function that records a decision, and
which reads the firm's setting itself rather than accepting it as an argument. A
caller that forgot to pass it would silently get the permissive answer.

It refuses a **rejection** by the requester as well as an approval. The rule is
about who decides, not which way — a requester quietly rejecting their own
request is the same failure wearing different clothes.

One case is deliberately allowed: a request whose `requestedById` is null,
because the account was deleted. Refusing there would make the request
permanently undecidable for a reason unrelated to who is deciding it, and an
undecidable request is worse than a self-decided one — it cannot even be
rejected.

### Switching it on is refused when the firm is too small

This is the part a warning would have got wrong. Both demonstration firms have
exactly **one** person who may decide — the paralegal and the read-only reviewer
do not hold `approval.decide` — so switching the rule on would jam their queues
immediately.

So `updateApprovals` refuses, in the same shape as the existing refusal to
demote a firm's last administrator, and the message names the consequence rather
than the rule: *"Only one person here may decide. Switching this on would make
every request they raise undecidable — including by them. Give a second person
the attorney or administrator role first."*

A warning beside a control that still works is a warning people click past.

## Consequences

- **Default off.** For a safety control that is uncomfortable, and it is the
  only defensible default given the paragraph above. The discomfort is answered
  by the information always being shown, and by the setting being visible rather
  than buried.
- The demonstration keeps working. The guided walkthrough has one attorney
  raising and deciding, and step 11 still runs — with the notice now visible,
  which arguably improves it.
- **This build cannot demonstrate the rule in a browser**, because no seeded firm
  has two deciders. The block is proved at the integration level, where the
  fixture is controlled; the browser proves the notice, the refusal to enable,
  and that the refusal explains itself. Said here rather than left as a gap
  somebody notices in the test file.
- `updateApprovals` now returns a result instead of `void`, and refuses the
  whole form rather than saving the other rules and dropping this one. A partial
  save would be worse than a refusal: the administrator would believe it applied.
- One migration, one boolean column with a default. No existing row changes
  meaning.

## See also

- [ADR-0008 — Locked approvals are stored, not merely enforced](ADR-0008-locked-approvals-are-stored.md)
- [ADR-0014 — The effect lives behind the decision](ADR-0014-the-effect-lives-behind-the-decision.md)
- [Production readiness](../PRODUCTION_READINESS.md)
