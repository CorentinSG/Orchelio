---
title: Roadmap
tags: [reference, planning]
---

# Orchelio — Roadmap

Orchelio is built in nine phases. Each phase ends with: tests run, errors fixed, a summary of what
changed, the main files listed, a commit, and instructions for testing it.

The application shows this progress on its home page, read from `src/lib/roadmap.ts`. Update that
file when a phase status changes, so the product and the documentation cannot disagree.

---

## Phase 1 — Initialisation ✅ Delivered


**Goal:** a real, running foundation — not a static mock-up.

Delivered:

- Next.js 16 (App Router) + React 19 + TypeScript in strict mode.
- Tailwind CSS 4 with the Orchelio design tokens, light and dark themes.
- Prisma 7 + SQLite, first migration, `Firm` model, seed for the two demonstration firms.
- Environment layer with validation (`src/lib/env.ts`) and the public identity module
  (`src/lib/app-config.ts`).
- Home page rendering live platform status from the database, plus loading, error and 404 screens.
- Vitest (16 unit and component tests) and Playwright (5 browser tests).
- `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PRODUCTION_READINESS.md`,
  `docs/PLAN_PHASE_1.md`, `.env.example`.

Not in this phase: sign-in, firm workspaces, onboarding, matters, documents, AI, approvals,
audit log, cost screens.

---

## Phase 2 — Data and authentication ✅ Delivered

Delivered:

- Complete data model — 22 models, one migration, indexes on every `firmId`.
- Extended seed: 8 practice areas, 20 matter types, 4 workflow templates, 2 firms with their
  configurations, 5 demonstration users and their memberships. Idempotent.
- Local sign-in at `/login`: server-side sessions (random token, only its hash stored), scrypt
  password hashing, constant-time comparison, identical failure message for an unknown address and
  a wrong password, and in-memory attempt throttling.
- Four firm roles plus the platform role, and a permission matrix enforced on the server.
- Guards (`requireSession`, `requireFirmAccess`, `requirePermission`, `requirePlatformAdmin`) that
  record every refusal to the activity log.
- Firm dashboard and platform firm list, both reading real data.
- 50 unit tests and 19 browser tests.

**Acceptance met:** each demonstration account lands in its own workspace; a firm user is refused
platform administration; a signed-out request for a protected page never receives workspace
content.

Not in this phase: the onboarding questionnaire, matters, documents, AI, approvals, the activity
log screen, the cost screens.

---

## Phase 3 — Multi-firm ✅ Delivered

Delivered:

- **Scoping guard.** The Prisma client itself refuses any query against a firm-scoped model that
  does not name a firm (`src/lib/data/firm-scope.ts`). `AND` and `OR` are treated oppositely:
  one scoped branch satisfies an `AND`, but every branch of an `OR` must be scoped, because
  `OR: [{ firmId }, { status }]` would return the whole database.
- **Data-access layer** (`src/lib/data`): matters, documents, analyses, usage, activity, search
  and statistics — each function takes the firm as a required first argument.
- **Firm switcher** for users who belong to more than one firm, plus the `reviewer@demo.local`
  account that belongs to both demonstration firms.
- **Active firm resolution**: the cookie is a preference, not a credential. An identifier that
  does not match a membership is ignored.
- **40 integration tests** against a real migrated database with two firms holding deliberately
  similar records, and **7 browser tests** covering the switcher and cross-firm access.

**Acceptance met:** an immigration user cannot open an employment matter by any route — through
the data layer, through a copied identifier, through search, through a forged cookie or through a
tampered form — and every refusal is recorded.

Two defects were found by the tests and fixed:

1. Switching firms left the browser showing the **previous** firm's dashboard about half the time.
   The server was always right; the render returned inside the Server Action's response was not.
   Switching is now a plain form POST answered with an HTTP 303, which has no such ambiguity.
2. Redirects built from `request.url` pointed at a different host than the browser was using
   (`localhost` instead of `127.0.0.1`), which silently dropped the session cookie. Redirects are
   now relative, and the cross-site check compares `Origin` against the real `Host` header.

---

## Phase 4 — Onboarding ✅ Delivered

Delivered:

- Seven-step questionnaire with a progress bar: firm details, practice areas, matter types,
  workflow steps, AI features, human approvals, summary.
- Every answer saved as it is given, so "Save as draft" is not a separate feature — leaving
  halfway through and coming back is simply what the questionnaire does.
- Locked approval rules shown with a padlock, submitted by nothing, and written in by the server
  regardless of what was sent.
- **Practice-area vocabulary**: the same question produces a different configuration depending on
  the firm's main area. "Document collection" becomes `document_collection` at an immigration firm
  and `evidence_collection` at an employment firm; "Create a factual timeline" becomes `timeline`
  or `employment_timeline`. This is what makes the two published configurations reproducible from
  one questionnaire, and it is the mechanism behind the specification's promise that Orchelio
  adapts a firm's vocabulary.
- Dashboard assembled from the configuration: an immigration firm sees status expiration dates and
  missing identity documents; an employment firm sees termination letters and missing wage records.
  A widget that depends on an AI feature the firm switched off is omitted rather than shown empty.
- Restart the questionnaire without discarding an answer.

**Acceptance met:** answering the questionnaire reproduces both configurations printed in the
specification, asserted literally in `tests/unit/onboarding-config.test.ts`, and the same answers
given at the two demonstration firms produce two different dashboards.

### An inconsistency in the specification, and how it was resolved

The specification's step 4 offers fourteen generic workflow steps, but its example configurations
contain keys that are not among them — `consultation_preparation` and `document_collection` for
immigration, `employment_case_assessment` and `evidence_collection` for employment. Taken
literally, no set of answers produces the published output.

Reading §2, which promises that the configuration determines "the vocabulary used", resolves it:
these are the *same* four steps, named in each practice area's own language. Orchelio implements
that as a per-area key mapping, which reproduces both examples exactly and delivers a feature the
specification asked for. The alternative — declaring the criterion unreachable — would have been
easier and less useful.

One further deviation, stated rather than hidden: the published `approvals` objects list a subset
of the rules. Orchelio stores every locked rule as well, so the guarantee is auditable in the data
rather than merely asserted in a comment. Every key in each published example is present and
required.

### A defect found and fixed

Confirming the configuration navigated nowhere, silently: the server completed the work and
redirected, and the browser stayed on the summary page. The cause was `revalidatePath("/", "layout")`
inside an action that then redirects across routes — the client router discards the navigation.
The onboarding submissions are now plain form POSTs answered with an HTTP 303, the same mechanism
adopted for the firm switcher in Phase 3, and both now share `src/lib/http/form-post.ts`.

---

## Phase 5 — Matters and documents ✅ Delivered

Delivered:

- Matter list with server-side filters — free text across reference, title and client; status;
  matter type; and, at an employment firm only, the side represented. Every filter is applied in
  the query, so a filtered list is a filtered *query*, not a filtered render.
- Matter record with four working tabs (Overview, Intake, Documents, Tasks) and the five the
  specification requires later, shown by name with the phase that fills them.
- **Practice-area fields**: seventeen immigration fields (status, expiry, entry, parties, history)
  and thirty employment fields (representation, pay and hours, complaint and action, evidence,
  agency, severance), grouped into sections, some offered only for certain matter types — a
  petitioner belongs on a family-based petition, not on an asylum claim.
- Matter creation, with a reference assigned by the server and sequential within the firm and the
  year. The practice area comes from the firm, never from the form.
- **Simulated document upload**: drag and drop or choose, extension allow-list, size limit,
  practice-area categories, attachment to a matter, and a human "Mark as checked". The file itself
  never leaves the browser — see below.
- Expected-document checklist per matter type: what this kind of matter usually needs and does not
  have, presented as a checklist and not as a judgement.
- Firm-wide Documents, Tasks and Intake screens.

**Acceptance met:** the six fictional matters exist with their twenty-two documents under the
right firm, each demonstrating what Phase 6 will need — including the Daniel Moreau matter, whose
intake says the last entry was 11 February 2024 while the I-94 on file is dated 4 March 2024.

The dashboard's practice-area widgets now hold real figures — leads, consultations scheduled,
recorded expiry dates within ninety days, matters missing an expected document, the two
representation sides, unchecked termination letters. A widget whose meaning needs the analysis
("discrimination matters awaiting assessment") was moved to Phase 6 rather than given an invented
one, and any widget whose count is not supplied still shows a dash rather than a zero.

Tested by **36 unit tests** on the field catalogue, the category catalogue and the widget rules,
**28 integration tests** on the paths that write (creating a matter, attaching a document, marking
one checked, the dashboard counts — each tried once inside the owning firm and once with an
identifier borrowed from the other), and **31 browser tests** covering the list, the filters, the
record, creation, upload, the dashboard figures, and what each role may do.

### The file is never uploaded, structurally

The browser reads the chosen file's name, type and size and posts those three values as text. The
bytes are never read and never sent, and the route handler has no code path that could receive
them. This makes "no real upload, no OCR" a property of the design rather than a promise in the
documentation — and it is why the size shown is the browser's report of the file, not a
measurement of anything stored.

Everything the browser checks, the server checks again: extension, size, MIME type, and that the
category belongs to this firm's practice area. The browser's copy runs on a machine the user
controls, so it is a courtesy, not a control. `tests/e2e/matters.spec.ts` submits a hand-crafted
post that skips the browser's checks and asserts the server refuses it.

### One answer, one place

The side an employment firm represents is a column on the matter, because the list filters on it.
It was also being written into the JSON field blob, and the creation form asked for it twice —
once in the basics and once among the practice-area fields. Two places holding the same answer is
two places that can disagree, so the field is now marked as living on the matter row: forms do not
ask for it a second time, `sanitiseFieldValues` refuses to copy it into the JSON, and the record
page reads it from the column.

### A defect found and fixed

Refusing another firm's matter rendered "Page not found" correctly but answered HTTP **200**. The
cause was the root `loading.tsx`: a Suspense boundary above a page makes Next commit the response
status before the page has run. Measured both ways — with the boundary, 200; without it, 404, and
identical for a matter that exists in another firm and one that exists nowhere, so isolation never
depended on it. The loading screen is now placed per segment and deliberately not above
`/matters/[id]`. See `docs/decisions/ADR-0011-loading-boundaries-are-placed-per-segment.md`.

---

## Phase 6 — Simulated AI ✅ Delivered

Delivered:

- **The `AIProvider` interface** (`src/lib/ai/provider.ts`) — two methods, one seam. Selection is
  by `AI_PROVIDER` and nothing else. Asking for `anthropic` throws with the reason rather than
  quietly behaving like the mock, because a silent fallback would let a firm believe it was
  getting a real analysis when it was not.
- **Claude Analyst**: summary, key facts with their sources and a simulated confidence, timeline,
  missing documents, contradictions, attorney questions, client questions, warnings.
- **Claude Reviewer**: an independent pass with five issue categories, every check reported
  whether it passed or failed, and `humanReviewRequired` always true.
- The **AI Analysis** and **Timeline** tabs on a matter, and the **AI Workspace** listing every
  analysis a firm has run alongside its simulated usage.
- Honest states throughout: a run that fails says so and keeps nothing partial; a firm with no AI
  features switched on is refused rather than shown a page of empty sections.
- `prompts/analyst.v1.md` and `prompts/reviewer.v1.md`, written for the future Anthropic provider,
  including the prompt-injection defence.

**Acceptance met:** the Daniel Moreau matter surfaces the disagreement between the entry date on
the record (11 February 2024) and the date in the I-94's own filename (4 March 2024), shows both
with their sources, and refuses to resolve it. The Amira Hassan matter reaches "more information
required" and states no conclusion. Both are asserted in `tests/unit/ai-analyst.test.ts` against
the same data the seed writes.

### Derived, not looked up

The obvious way to build this phase was a table of hand-written results for the six fictional
matters. That would have demonstrated nothing: the Moreau contradiction would have been "found"
because somebody typed it in, and a firm creating its own matter would have got an empty page.

Instead the Analyst is a set of deterministic rules over the matter's recorded fields, its intake
answers and its document *names*. The rule that finds Moreau's contradiction — a date carried in a
document's filename disagreeing with the date on the record — is a general one, which is why the
Vasquez matter is the more interesting test: its filenames carry dates too
(`internal-complaint-2026-04-28.pdf`), and they agree, so the same rule stays silent.

### It never opens a document

There is no upload and no OCR (Phase 5), so nothing here can read a file. Every fact sourced to a
document comes from that document's name and kind. Every analysis says so in its own warnings, and
the Reviewer fails an analysis that has lost that caveat.

This shaped the confidence model. An early version called a fact "corroborated" when two documents
of a plausible kind were on file — which is not two sources agreeing, it is two unopened documents
existing. The support levels now say exactly what is true: a document's *name* agrees; a document
of the right kind is on file, checked or not; the client said it twice; the client said it once;
the sources disagree.

### A conclusion has nowhere to live

`MatterAnalysisResult` has no `conclusion`, `recommendation`, `eligibility` or `advice` field —
absent from the shape, not merely left empty, so filling one in would take a deliberate decision
rather than a careless line. The Reviewer scans the Analyst's own prose against ten patterns for
eligibility findings, recommendations, predictions and confirmed deadlines. That check has never
fired in normal operation, which is the point: it is a regression guard, and
`tests/unit/ai-reviewer.test.ts` proves it fires by handing it eight sentences that should trip it.

Tested by **101 unit tests** across the date parser, the Analyst against all six fictional matters,
and the Reviewer against deliberately damaged analyses; **14 integration tests** on the runner
(isolation, failure handling, simulated charges, determinism); and **23 browser tests**.

---

## Phase 7 — Approvals and audit ✅ Delivered

Delivered:

- **The approval centre** (`/approvals`): everything waiting for a person, with the matter, the
  action, who asked, when, the risk and a summary — and, below it, everything already decided.
  Filters by status, action and risk, applied on the server.
- **Four decisions** — Approve, Approve with edits, Request new analysis, Reject — with a note
  required for the last three, checked on the server as well as in the browser. Asking for a new
  analysis creates a task on the matter, so the request lands somewhere rather than being a
  message nobody receives.
- **The activity log** (`/activity`): every recorded event for this firm, filtered by action,
  person, outcome and time, with the stored payload rendered in words.
- **Three new matter tabs**: Communications, Approvals and Activity. All nine tabs the
  specification names now exist.
- **Draft communications**: prepare an email, letter or note — pre-filled from the analysis's
  client questions where there are any — which is then unusable until a person approves the exact
  words.

**Acceptance met:** the two effects that change anything (closing a matter, approving a draft for
use) are applied by `decideApproval` and by nothing else, and
`tests/integration/approvals.test.ts` asserts the state *before* each decision as well as after
it. Every decision is written to the log with its note, its decider and whether anything took
effect — including decisions that changed nothing.

### The rule that had to be structural

There is no `closeMatter()` to call by accident. A sensitive action calls `raiseApproval`, which
either creates a request or — for a configurable rule the firm switched off — applies the effect
through `applySensitiveEffect`, the same function the approval path uses. One implementation, two
callers, so the approved and unapproved routes cannot drift apart.

`requiresApproval` checks the lock **first** and never consults the configuration for a locked
rule. `tests/unit/approval-rules.test.ts` attacks that from every angle it can reach: every
configurable rule off, an empty configuration, the locked rule named in the configuration and set
to `false`, and set to `0`, `null`, `"no"` and `undefined`. All still require a decision.

### What the log records that it did not have to

Two things, both because an audit that only records the interesting cases is not an audit.

A decision that changed nothing — a rejection, or an approval of something with no effect to
apply — is logged exactly as loudly as one that did, with `effectApplied: false`.

And when a firm has *not* switched a configurable rule on, the action proceeds without a decision
and that fact is written down: `required: "not_required"`, with the rule named. "Nobody had to
approve this" is precisely what somebody reading a log six months later needs to be able to find.

### Said plainly rather than left implied

The onboarding questionnaire offers eighteen approval rules; this build raises four of them. The
approval centre lists the rest by name, under a heading that says a rule nobody raises protects
nobody. Several are unreachable rather than unimplemented — Orchelio has no transport, so nothing
can be submitted, shared or sent, and nothing is ever permanently deleted — but a firm that
switched one on should be told, not left to assume.

### A defect found and fixed

Pressing "Ask a person to confirm this date" on a matter's Approvals tab returned to the
Overview tab. The request had been raised correctly and the confirmation was on a screen the user
was no longer looking at, which reads as nothing having happened — the same failure the Phase 4
redirect bug produced by a different route. The handler now returns to the tab the request came
from.

Tested by **31 unit tests** on the rules, **20 integration tests** on the effects and the
boundary, and **23 browser tests**.

---

## Phase 8 — Usage and administration ✅ Delivered

Delivered:

- **Usage and costs** (`/usage`): analyses, reviews, tokens and simulated cost for the open firm,
  broken down by operation and by matter, with the most recent records. Behind `firm.costs.view`,
  so a paralegal does not see it.
- **Firm settings** (`/settings`), seven sections: profile, matter types, AI features, approval
  rules, people and roles, branding, and demonstration data. Each saves on its own, so a stale tab
  cannot revert what somebody changed in another one.
- **Platform administration**: firm creation (`/admin/firms`), technical status (`/admin/system`)
  and a demonstration-data inventory (`/admin/demo`).
- **The guided demonstration** (`/guide`): twenty-one steps, public and readable before signing
  in, each naming the account to use, the screen to open and what to look for once there.

**Acceptance met:** `tests/e2e/admin.spec.ts` creates a third firm through the interface, signs in
as its new administrator, answers the seven questions and lands on a working dashboard carrying
that firm's own name — with nothing edited, seeded or run from a terminal.
`tests/integration/platform.test.ts` then asserts what the new firm actually holds: all nine
locked approval rules from its first second, and not one row belonging to the firms that already
existed.

### Settings and the questionnaire cannot disagree

They write the same record, through the same pure builders. `buildApprovals` is used unchanged, so
there is no code path in settings that could switch a locked rule off — a submission naming one is
not rejected, it simply has no effect, because there is no state in which it could.

One answer is deliberately absent from settings: the main practice area. Changing it re-derives
the matter types, the workflow vocabulary, the AI feature keys and the dashboard widgets, and a
settings tab that silently rewrote four other tabs would be the wrong shape for that. The page
links to the questionnaire instead, which keeps every answer already given.

### The platform administrator still cannot read a firm's files

Every cross-tenant query now lives in one module, `src/lib/data/platform.ts`, so what can see
across firms is one file to audit rather than queries spread through administration pages.
`tests/integration/platform.test.ts` serialises its output and asserts that no client name, matter
title or document filename appears in it; `tests/e2e/admin.spec.ts` does the same against the
rendered pages.

The instance totals are summed from each firm's own `_count` rather than read with a cross-firm
query. The scoping guard refuses `prisma.matter.count()` with no firm, and the way to satisfy it —
a filter matching every firm — would be a query that *looks* scoped and is not. Addition is
uglier and honest.

### Erasing demonstration data has no button — ADR-0016

Adding fictional matters is offered, in the firm's own settings, and is additive: a matter whose
reference already exists is skipped, and nothing is ever deleted. Erasing stays `npm run
reset-demo`, a command a person types on purpose. One of the nine locked rules says nothing is
permanently deleted without a person, and a button in a web page is a weaker form of consent than
that rule deserves.

### Branding names the firm, not the product — ADR-0015

A firm chooses its display name and an accent colour from a fixed palette. It cannot rename
Orchelio, remove the demonstration banner or restyle the interface, and the branding tab says so.
The accent is a palette rather than a colour picker because the value reaches a `style` attribute
and an arbitrary colour can fail contrast in one theme while passing in the other.

### Two things found by writing the tests

`addSampleMatters` trusted the firm's configured matter types without checking the platform
catalogue still listed them. A matter row has a foreign key to that catalogue, so a stale key gave
a constraint violation — a 500 — where a skipped matter and a sentence were wanted. It now reads
the catalogue and reports what it did not offer.

A firm could lock itself out by demoting or suspending its last administrator. Because a platform
administrator holds no membership by design, nobody would have been left able to undo it. Both
changes are now refused, with a message saying why.

### Said plainly

The sidebar's "Integrations" entry, listed as Phase 8 since Phase 3, has been **removed rather
than deferred**: an integration means sending something somewhere, and Orchelio has no transport
at all. Workflow management is not offered either — a firm's workflows are derived from its
practice area, and the settings page says so rather than showing a tab that does nothing.

---

## Phase 9 — Tests and documentation ✅ Delivered

Delivered:

- **[`docs/ACCEPTANCE.md`](ACCEPTANCE.md)** — every phase's acceptance criterion with the tests
  that prove it, named individually. Eighty-five named tests across thirty-one files.
- **`npm run acceptance:check`** — verifies that every test named there still exists, in the file
  named beside it. A renamed test fails the build rather than turning the document into a list of
  claims about nothing. It runs inside `npm run verify`, in CI, and is reported by the doctor.
- **The accessibility pass** — axe-core against every principal page in **both themes**, plus
  browser tests for what an automated audit cannot judge: the skip link, focus visibility,
  keyboard-only sign-in, `aria-current` on the open tab, and which announcements are alerts.
- **[`docs/DEMONSTRATION.md`](DEMONSTRATION.md)** — how to give a demonstration: the setup, the
  ten-minute version, what to say about the limits *before* being asked, and honest answers to
  the five questions that come up.
- **Rewritten procedures** in [Architecture §8](ARCHITECTURE.md) for adding a practice area and a
  workflow, naming the actual files rather than the phase that built them.

**Acceptance met:** `npm run acceptance:check` reports nine phases and eighty-five named tests,
all present; `npm run test:a11y` reports no machine-detectable violation on any page in either
theme; and every procedure the specification asks for is written down.

Both checks were proved to fail before being trusted. The acceptance check was given a renamed
test, a moved file and a phase whose criterion had no test beneath it; each produced a finding
and exit code 1.

### The audit found four rules failing, on twenty-two pages

Every one was a real defect. None was a false positive.

**Contrast.** `--color-ink-subtle` measured 3.18:1 against the AI panel's background and 3.75:1
against white, where 4.5:1 is required for text that size — and it is the token used for hints,
counts, timestamps and captions on nearly every screen. Darkened to `#61697c`, which clears 4.5
on all seven light surfaces. The dark palette already passed. The cost is that the three-level
text hierarchy is now compressed; unreadable is not a hierarchy.

**The demonstration banner belonged to no landmark.** It sits above every landmark on the page,
so a screen-reader user navigating by landmark skipped the one notice the specification requires
on every screen. It is now a named region — not an alert, because a standing notice that
interrupts every page is a notice people learn to ignore.

**The skip link pointed at nothing.** The root layout renders "Skip to main content" on every
page, and four screens had no `<main>` at all: the refusal, the 404, the error screen and the
loading screen — exactly the screens where somebody is most likely to be lost. All four now carry
one, and every `<main>` gained `tabIndex={-1}`, because a fragment link moves the reading position
but not focus unless the target can hold it.

**A definition row outside a definition list.** One `<dt>`/`<dd>` pair on the branding tab was
read as ordinary text.

### And a false count, found by an audit timing out

The dark-theme audit of `/approvals` exceeded thirty seconds. The cause was not the theme: the
page fetched a hundred requests and rendered all of them. Investigating it turned up something
worse than slowness — the page derived both its numbers from that hundred-row window, so a firm
with 172 requests waiting was told that 100 were.

A number on a screen is a claim, and that one was false. The counts now come from their own
query, the lists are bounded at fifty and twenty-five, and the page says "showing the N most
recent" whenever there is more than fits. `tests/integration/approvals.test.ts` asserts the count
against a window deliberately smaller than the queue.

The timeout was not raised. An audit that gets slower as the data grows is a useful alarm.

### What the accessibility claim does not cover — ADR-0017

Automated rules detect roughly a third of WCAG, and not the hard third. Nothing in this build has
been tested with a real screen reader, by a keyboard-only user, or by anybody with a disability.
That sentence is in the README, in `docs/ACCEPTANCE.md` and at the top of the test file, because
a bounded claim stated once is a bounded claim nobody reads.

---

## Explicitly out of scope

Real email sending, payments, electronic signature, court filing, court connections, Clio
integration, advanced OCR, automated legal research, direct legal advice, an autonomous client
chatbot, real billing, Stripe, production hosting, a mobile application, a complex workflow
editor, full conflict management, definitive deadline calculation, importing real matters,
definitive damages calculation, automated negotiation, and automated communication with opposing
counsel.

Simulated interfaces for some of these may be shown, always labelled as simulated.
