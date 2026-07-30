# ADR-0020 — A superseded request is not a decision

**Status:** accepted · **Phase:** post-9

## Context

Every analysis run raises one request: *may we rely on this analysis?* It is
raised against the analysis, because that is what somebody is being asked to
take responsibility for.

Nothing retired the previous one. Run an analysis twice and both requests sit in
the queue; run it thirty times and thirty sit there. A demonstration matter had
accumulated **113 pending requests** this way, and the damage was not the
untidiness. Underneath them was a *confirm a recorded date* request that a
person did need to see, pushed outside every window a screen could show. A queue
that says a hundred things need attention when one does is worse than a queue
that says nothing, because the one thing is now hidden by the ninety-nine.

`PRODUCTION_READINESS` carried it as ⛔, with the reason it had not been fixed:
a fifth status would touch the invariant that there are exactly four decisions.

That invariant turned out to be the fix rather than the obstacle.

## Decision

**Supersession is a state of its own, and its defining property is that it is
not a decision.**

### The vocabulary is single-sourced and partitioned

`src/lib/approvals/status.ts` holds all six statuses and three predicates —
pending, decided, superseded — that partition them. `tests/unit/approval-status.test.ts`
fails if any status matches none or more than one.

This is the part that matters, and it is worth being explicit about why. The
defect was never "there is no superseded state". It was
`status: { not: "pending" }` — a query that was a true statement about the world
while every exit from the queue was a decision, and became a false one the
moment that stopped being so. Adding a status without fixing that query would
have turned 113 requests nobody read into 113 requests the screen said a person
had decided. **Over-reporting decisions is the one error this codebase cannot
tolerate**, so the check that stops a status being added without a home is not
housekeeping; it is the safety property.

`approvalCounts` buckets the same way and counts an unrecognised status in
*none* of the three. Failing closed here means failing towards "no decision was
taken".

### The row is kept, and says what happened to it

Not deleted, not hidden, not merged into the decided list. It keeps its summary,
its requester, its date, and gains `supersededAt` — a separate column from
`decidedAt`, because `decidedAt` means a person acted and no person acted here.
The card says *"Superseded on … — nobody decided it"*, and then, in full: a
newer analysis was run, nobody decided this, and nothing was approved.

Three sentences where one would do, because a reader who takes only the first
away must not be left thinking the request was dealt with.

### It is refused, distinctly, if anybody tries to decide one anyway

`decideApproval` tells `superseded` apart from `already_decided`. The second
message would be a lie in the first case, and a lie that sends somebody hunting
through a log for a decision nobody took.

### It is logged, under its own action

One `approval.superseded` entry per request, attributed to the person whose new
analysis caused it — and never `approval.decided`. A request that vanished from
a queue with no trace is one somebody will later swear they never saw.

### The rule is narrow

One caller: `runAnalysis`, after the new request exists, for
`legal_analysis` on that matter only. A draft communication is *not* superseded
by a later draft — each is a separate set of words somebody may want to approve,
and no analogous argument holds. Widening this needs the argument made again for
the new case, which is why the function takes the action explicitly rather than
guessing.

## Consequences

- **A matter now has at most one analysis request waiting**, however many times
  it has been analysed, and requests of other kinds are no longer buried.
- **The history is longer, not shorter.** Five runs leave five rows; four say
  plainly that nobody decided them. That is the point — the alternative is a
  product that quietly forgets what it asked for.
- **The migration backfills.** One `UPDATE` marks pending analysis requests
  whose analysis a later one overtook: the steady state of the rule the
  application now applies as each run finishes. It writes no audit entries, and
  that gap is deliberate — a schema migration is not a user action, and
  inventing somebody to attribute it to would be worse than the silence. It
  moved 312 rows in this build's demonstration database.
- **`decideApproval` gained a refusal reason**, so every caller had to say what
  it means. That is three lines of switch and the reason the distinction cannot
  quietly disappear.
- One migration, one nullable column. No existing row changes meaning; the ones
  the backfill touches were already wrong.

## See also

- [ADR-0014 — The effect lives behind the decision](ADR-0014-the-effect-lives-behind-the-decision.md)
- [ADR-0019 — Separation of duties is offered, not imposed](ADR-0019-separation-of-duties-is-offered-not-imposed.md)
- [Production readiness](../PRODUCTION_READINESS.md)
