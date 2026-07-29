---
name: orchelio-honest-ui
description: This skill should be used when adding or changing any user-facing surface in Orchelio — a dashboard widget, a matter tab, an analysis panel, an approval card, an empty state, a refusal, an error message — or when the user asks about what a screen may claim, showing a dash instead of a zero, wording a refusal, or whether the interface is overstating what the product knows. It gives the rules that stop a screen claiming more than the product can support.
---

# What a screen may claim

Orchelio is read by lawyers making decisions about other people's immigration
status and livelihoods. The failure mode that matters is not a crash — it is a
screen that looks fine and says something the product cannot support.

## The Iron Law

```
SAY LESS THAN YOU KNOW, NEVER MORE
```

## The five rules, and the failure each prevents

### 1. A dash, not a zero

A figure that is **not known** shows `—`. A figure that is **known to be zero**
shows `0`.

`0` is a claim: *there is nothing to do*. A widget whose data does not exist yet
showing `0` tells a lawyer their inbox is clear when nobody has looked.

In practice: `widgetValue` returns `"—"` when the count is absent from the map,
and the count itself when present — including a genuine `0`. Never fill a gap
with a zero to make a grid look tidy.

See `docs/decisions/ADR-0009-a-dash-not-a-zero.md`.

### 2. A feature the firm switched off is omitted, not shown empty

A card reading "0 missing documents" at a firm that never asked Orchelio to look
for missing documents is not information — it reads as reassurance.

But there is a second case, and it is the opposite: on a page where somebody is
**looking for** the output of a feature, saying "not asked for, and so not
produced" with a link to change it is the honest answer. A dashboard tile is
noise; an explanation on the analysis page is help.

The distinction: is the reader wondering *whether anything is wrong*, or
*where a section went*?

### 3. An enabled feature that found nothing says so

"Nothing disagreed" and "it never ran" are different answers, and a blank
section is indistinguishable between them. `featuresQuiet` exists for this.

### 4. A refusal is worded identically whether a record is missing or forbidden

Another firm's matter answers `notFound()` — the same page, the same words, the
same status as an identifier that exists nowhere. A distinct message would
confirm the other firm's matter exists.

Same rule in a route handler: "does not exist" and "not yours" both redirect to
`/403`.

### 5. No conclusion, no confirmed date

An analysis may describe what a file contains, where each thing came from, what
disagrees, what is absent and what to ask. It may not say what any of it
*means*. `MatterAnalysisResult` has no `conclusion`, `recommendation`,
`eligibility` or `advice` field — absent from the type, not left empty.

No date is ever presented as confirmed. `UnconfirmedDate` carries the caveat
with it; the only thing that makes a date confirmed is a person approving a
`deadline_confirmation`.

See `docs/decisions/ADR-0013-a-conclusion-has-nowhere-to-live.md`.

## Before the buttons, not after

When a screen asks somebody to take responsibility — approving an analysis, a
draft, a closure — what approving **causes** is stated above the buttons, not in
a confirmation dialogue afterwards. And approving is one option among four of
equal visual weight, not a primary action with alternatives hidden behind a
menu. Making the safe choice effortless and the careful one fiddly is how a
review becomes a rubber stamp.

## Words to avoid, and what to write instead

| Avoid | Because | Write |
| ----- | ------- | ----- |
| "verified" | Nothing is verified unless a person checked it | "checked by a person", or "not verified" |
| "deadline" | Orchelio never confirms one | "date recorded", "date to review" |
| "the analysis found" | Implies a finding | "the record shows", "two sources disagree" |
| "0" for unknown | A claim | `—` |
| "eligible", "we recommend", "likely to succeed" | A legal conclusion — the reviewer fails on these | a question in `attorneyQuestions` |
| "will fail", "fatal", "cannot succeed" | A conclusion about a gap | what the document establishes |

## Accessibility is part of honesty

A `Card` renders `<section aria-labelledby>` so it is a real landmark — that
change was made for a test and turned out to be a genuine improvement. Every
`Field` requires `htmlFor`. An error uses `role="alert"`; the standing
demonstration notice does not, so a screen reader is not interrupted by it on
every page.

## Verifying

A claim about a screen needs the screen. Run the browser tests:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium npx playwright test --retries=0
```

`--retries=0` deliberately: a retry hides exactly the intermittent behaviour
this project has twice found to be a real defect.

Watch for the JSX whitespace trap while you are there — `{count} items` across
JSX children renders `9items`. It has been paid for three times. Put the space
inside a single string.
