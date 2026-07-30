# ADR-0021 — A setting that changes nothing is a claim

**Status:** accepted · **Phase:** post-9

## Context

Orchelio's whole thesis is that the configuration, not the code, is what makes
one firm's Orchelio different from another's. The seven-step questionnaire asks
a firm which time zone it works in and offers four real answers.

Nothing read the reply. Every date on every screen was the UTC calendar date,
produced by `toISOString().slice(0, 10)`. For a firm in Los Angeles that meant a
decision recorded at half past six on a Tuesday evening appeared as Wednesday —
and nothing on the page said which zone it was in, so there was no way to notice.

The interface language is the same shape and a different case: the questionnaire
asks, stores the answer, and the interface is English only. There is nothing to
implement short of translating the product.

Both are the failure this codebase spends most of its effort avoiding, wearing
different clothes. A dashboard tile showing zero when it means "unknown" and a
select box that configures nothing are the same lie: the screen claims more than
the product supports.

## Decision

**A setting either changes what the product does, or says on screen that it does
not.**

### The time zone changes what the product does

`src/lib/format/dates.ts` renders every date and time in the firm's chosen zone.
Three properties, each with a reason:

**The zone is passed in, never read.** Same argument as `now`, already settled
in `relativeDays`: a function that reaches for ambient state renders differently
on two calls with identical arguments, and no test can pin down what it will
say. The firm's zone comes from the page, which has the configuration in hand.

**The argument is required.** This is the part that mattered. A default of UTC
would have let all twenty-four existing call sites keep compiling untouched —
which is precisely how the setting came to be ignored in the first place. Making
it required turned the compiler into the audit: it listed every place a date is
rendered, and each had to be visited before the build would pass.

**The fallback is UTC, not the server's zone.** A server's zone is an accident
of where the process runs, and a date that changes meaning when the deployment
moves is worse than one that is merely unfamiliar.

Day counting moved with it. `daysBetween` counts calendar days in the firm's
zone rather than dividing elapsed milliseconds by 86,400,000: something
twenty-three hours away is "in 0 days" by the old arithmetic even when it falls
tomorrow, and a person reading a date wants to know which day it lands on.

### The language says it changes nothing

Beside the control, in the questionnaire and in settings: *"English is the only
interface language Orchelio has. The choice is stored and nothing reads it yet."*

Removing the control would have been the other honest answer. It is kept because
the questionnaire is also a record of what the firm told us, and a firm that says
"we work in French" has said something worth storing even while nothing acts on
it. What is not acceptable is storing it silently behind a control that looks
like it works.

### The zone is named wherever dates are dense

The activity log, the approvals queue and the matter record each carry one line:
*"Dates and times are shown in Pacific (Los Angeles)."* Not on every date — that
would be noise — but on every screen where getting the day wrong would matter,
so nobody has to guess or go looking in settings.

## Consequences

- **The activity log stopped saying "UTC".** It was honest and it was wrong for
  every firm that is not in UTC. It now shows the firm's own clock, and says so.
- **`formatDate` moved out of a component file.** A route handler was importing
  it from `src/components/matter-ui.tsx` to build a stored summary, which is the
  sort of thing that only looks odd once somebody writes it down.
- **A stored approval summary now carries the firm's day**, because it is read
  back months later on a card and the date in it must not be the server's.
- **Not fixed: a deadline is a day, not a moment.** A legal deadline is "the
  15th", whoever is reading. Orchelio stores an instant, which is right for
  every value this build actually holds — every one comes from a clock, because
  no form lets a person type a date. A product that added such a form would need
  the schema to say "this is a day", and rendering it in any zone would then be
  wrong. Named in `docs/PRODUCTION_READINESS.md` rather than left to be
  discovered.
- The browser suite proves the setting rather than the wording: one event is
  read twice, in two zones, and the displayed clocks must differ by exactly
  three hours.

## See also

- [ADR-0017 — The accessibility claim is bounded](ADR-0017-the-accessibility-claim-is-bounded.md)
- [ADR-0020 — A superseded request is not a decision](ADR-0020-a-superseded-request-is-not-a-decision.md)
- [Production readiness](../PRODUCTION_READINESS.md)
