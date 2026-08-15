---
title: Acceptance criteria and what proves them
tags: [reference, testing]
---

# Orchelio — every acceptance criterion, and the test that proves it

Each of the nine build phases ends with one acceptance criterion. This note
maps every criterion to the tests that prove it, by name.

It exists because a claim in a roadmap is a claim, and a claim in a roadmap
about a test that has since been renamed is worse than no claim at all. So this
file is **checked**: `npm run acceptance:check` verifies that every test named
below exists, in the file named beside it, and fails the build if one has moved.
It runs inside `npm run verify`.

**What this is not.** A criterion with a test beside it is a criterion somebody
wrote a test for. It is not a proof that the criterion is the right one, and
covering every criterion is not covering every behaviour. The three test levels
each answer a different question, and the level matters:

| Level | Answers |
| ----- | ------- |
| Unit | Is the rule right, in isolation and deterministically? |
| Integration | Does it hold against a real migrated database, inside and across the firm boundary? |
| Browser | Does the honesty survive being rendered, and do refusals refuse? |

---

## Phase 1 — Initialisation

**Criterion:** the home page reports the state of the running system rather than
a fixed picture of it — a broken install is visible immediately, with the exact
command that fixes it.

Recorded retroactively: Phase 1 predates the practice of writing the criterion
down, and saying so is more useful than pretending otherwise.

Proved by:

- `tests/e2e/home.spec.ts` — "reports live database status"
- `tests/e2e/home.spec.ts` — "renders under the Orchelio identity"
- `tests/e2e/home.spec.ts` — "states that no live AI call is made"
- `tests/unit/app-identity.test.ts` — "never uses a generic product name"
- `tests/unit/env.test.ts` — "rejects an unknown AI provider instead of guessing"

---

## Phase 2 — Data and authentication

**Criterion:** each demonstration account lands in its own workspace; a firm
user is refused platform administration; a signed-out request for a protected
page never receives workspace content.

Proved by:

- `tests/e2e/auth.spec.ts` — "an immigration attorney lands in the immigration firm"
- `tests/e2e/auth.spec.ts` — "an employment paralegal lands in the employment firm with paralegal rights"
- `tests/e2e/auth.spec.ts` — "a firm user is refused platform administration"
- `tests/e2e/auth.spec.ts` — "never sends workspace content to a signed-out visitor"
- `tests/e2e/auth.spec.ts` — "never sends platform administration content to a signed-out visitor"
- `tests/e2e/auth.spec.ts` — "gives an unknown address exactly the same message as a wrong password"
- `tests/unit/permissions.test.ts` — "cannot approve an analysis, confirm a deadline, close a matter or draft a communication"
- `tests/unit/permissions.test.ts` — "cannot read matter or document content by default"
- `tests/unit/password.test.ts` — "never stores the password itself"
- `tests/unit/rate-limit.test.ts` — "allows the first ten attempts and refuses the eleventh"

---

## Phase 3 — Multi-firm

**Criterion:** an immigration user cannot open an employment matter by any
route — through the data layer, through a copied identifier, through search,
through a forged cookie or through a tampered form — and every refusal is
recorded.

This is the criterion the whole product rests on, so it is the one with the most
tests, at every level.

Proved by:

- `tests/integration/isolation.test.ts` — "an immigration user cannot open an employment matter"
- `tests/integration/isolation.test.ts` — "a URL copied from the other firm resolves to nothing, not to a record"
- `tests/integration/isolation.test.ts` — "a matter title shared by both firms still returns only one"
- `tests/integration/isolation.test.ts` — "an identical filename in both firms never crosses over"
- `tests/integration/isolation.test.ts` — "refuses a read of matters with no firm named"
- `tests/integration/isolation.test.ts` — "still allows queries against platform-wide catalogues"
- `tests/e2e/firm-isolation.spec.ts` — "a forged active-firm cookie does not open the other firm"
- `tests/e2e/firm-isolation.spec.ts` — "submitting another firm's identifier to the switcher is refused"
- `tests/e2e/firm-isolation.spec.ts` — "an employment user never sees the immigration firm anywhere on the page"
- `tests/unit/firm-scope.test.ts` — "refuses OR unless every branch names the firm"
- `tests/unit/firm-scope.test.ts` — "classifies every model in the schema as either firm-scoped or platform-wide"
- `tests/unit/firm-context.test.ts` — "ignores a preference for a firm the user does not belong to"

---

## Phase 4 — Onboarding

**Criterion:** answering the questionnaire reproduces both configurations
printed in the specification, and the same answers given at the two
demonstration firms produce two different dashboards.

Proved by:

- `tests/unit/onboarding-config.test.ts` — "produces the published workflows"
- `tests/unit/onboarding-config.test.ts` — "produces the published workflows, in employment vocabulary"
- `tests/unit/onboarding-config.test.ts` — "gives identical answers different meanings per practice area"
- `tests/unit/onboarding-config.test.ts` — "cannot be switched off by omitting them"
- `tests/e2e/onboarding.spec.ts` — "reproduces the published immigration configuration"
- `tests/e2e/onboarding.spec.ts` — "gives the same answers a different meaning at an employment firm"
- `tests/e2e/onboarding.spec.ts` — "and so does the server, when the browser is bypassed"
- `tests/unit/dashboard-widgets.test.ts` — "gives each practice area its own questions"

---

## Phase 5 — Matters and documents

**Criterion:** the six fictional matters exist with their twenty-two documents
under the right firm, each demonstrating what the simulated analysis will need —
including the matter whose intake says the last entry was 11 February 2024 while
the residence permit on file is dated 4 March 2024.

Proved by:

- `tests/integration/matters.test.ts` — "creates it in the caller's firm and nowhere else"
- `tests/integration/matters.test.ts` — "reuses a client of the same name within the firm, and never the other firm's"
- `tests/integration/matters.test.ts` — "counts a matter as missing an identity document until one is filed"
- `tests/e2e/matters.spec.ts` — "shows the immigration fields, and none of the employment ones"
- `tests/e2e/matters.spec.ts` — "refuses another firm's matter as though it did not exist"
- `tests/e2e/matters.spec.ts` — "refuses a hand-crafted post that skips the browser's checks"
- `tests/unit/matter-fields.test.ts` — "never offers immigration fields to an employment firm, or the reverse"
- `tests/unit/matter-fields.test.ts` — "is never copied into the JSON blob, even when posted"

---

## Phase 6 — Simulated AI

**Criterion:** the Daniel Moreau matter surfaces the disagreement between the
entry date on the record and the date in the residence permit's own filename, shows both
with their sources, and refuses to resolve it. The Amira Hassan matter reaches
"more information required" and states no conclusion.

Proved by:

- `tests/unit/ai-analyst.test.ts` — "surfaces the disagreement over the date of entry"
- `tests/unit/ai-analyst.test.ts` — "shows both dates, and says where each came from"
- `tests/unit/ai-analyst.test.ts` — "refuses to resolve it"
- `tests/unit/ai-analyst.test.ts` — "reaches 'more information required'"
- `tests/unit/ai-analyst.test.ts` — "reaches no conclusion of any kind"
- `tests/unit/ai-analyst.test.ts` — "has nowhere to put a conclusion"
- `tests/unit/ai-analyst.test.ts` — "is deterministic"
- `tests/unit/ai-reviewer.test.ts` — "does not call itself an approval"
- `tests/unit/ai-reviewer.test.ts` — "still requires a human"
- `tests/integration/analyses.test.ts` — "never stores humanReviewRequired as false"
- `tests/e2e/analysis.spec.ts` — "shows both dates side by side, with where each came from"
- `tests/e2e/analysis.spec.ts` — "refuses to say which is right"

---

## Phase 7 — Approvals and audit

**Criterion:** the two effects that change anything — closing a matter and
approving a draft for use — are applied by `decideApproval` and by nothing else,
and every decision appears in the log with its note, its decider and whether
anything took effect.

The interesting case is not "approving works". It is "the effect had not already
happened before anybody approved", so these assert the state *before* each
decision as well as after it.

Proved by:

- `tests/integration/approvals.test.ts` — "raises a request even with every configurable rule switched off"
- `tests/integration/approvals.test.ts` — "leaves the draft unusable until somebody decides"
- `tests/integration/approvals.test.ts` — "needs a decision when the firm asked for one, and closes nothing before it"
- `tests/integration/approvals.test.ts` — "takes effect immediately when the firm did not ask for one"
- `tests/integration/approvals.test.ts` — "records that nobody had to approve it, which is what an audit is for"
- `tests/integration/approvals.test.ts` — "is refused, and does not overwrite the first decision"
- `tests/integration/approvals.test.ts` — "logs a decision that changed nothing just as loudly"
- `tests/unit/approval-rules.test.ts` — "requires a decision even when its own rule is set to false"
- `tests/unit/approval-rules.test.ts` — "requires a decision whatever nonsense the configuration holds"
- `tests/e2e/approvals.spec.ts` — "states what approving will cause, above the buttons"
- `tests/e2e/approvals.spec.ts` — "refuses a rejection with no note, on the server"

---

## Phase 8 — Usage and administration

**Criterion:** a third firm can be created entirely through the interface, with
no code change.

Proved by:

- `tests/e2e/admin.spec.ts` — "a third firm can be created entirely through the interface"
- `tests/integration/platform.test.ts` — "creates the firm, its configuration and its first administrator"
- `tests/integration/platform.test.ts` — "carries all nine locked approval rules from the first second"
- `tests/integration/platform.test.ts` — "leaves the new firm empty, and blind to the firms that already existed"
- `tests/integration/platform.test.ts` — "names no matter, client or document"
- `tests/integration/settings.test.ts` — "survive a request that tries to switch every one of them off"
- `tests/e2e/settings.spec.ts` — "the nine locked rules are shown with no way to switch them off"
- `tests/e2e/admin.spec.ts` — "names no matter, client or document anywhere"
- `tests/unit/new-firm.test.ts` — "refuses a practice area with no template"
- `tests/unit/guide.test.ts` — "sends every step to a route that exists"

---

## Phase 9 — Tests and documentation

**Criterion:** every earlier criterion is named here with the test that proves
it, and that mapping is checked rather than asserted; no page in the product has
a machine-detectable accessibility violation in either theme; and every
procedure a reader would need is written down.

Proved by:

- `tests/e2e/accessibility.spec.ts` — "every settings section has no detectable violation"
- `tests/e2e/accessibility.spec.ts` — "the refusal page has no detectable violation"
- `tests/e2e/accessibility.spec.ts` — "the not-found page has no detectable violation"
- `tests/e2e/accessibility.spec.ts` — "the first tab reaches a skip link that works"
- `tests/e2e/accessibility.spec.ts` — "focus is visible on every interactive element it lands on"
- `tests/e2e/accessibility.spec.ts` — "the sign-in form can be completed and submitted by keyboard alone"
- `tests/e2e/accessibility.spec.ts` — "a refused save is announced, not merely displayed"
- `tests/e2e/accessibility.spec.ts` — "every page has exactly one first-level heading"
- `tests/integration/approvals.test.ts` — "counts every request, not the ones that happened to be fetched"

The mapping itself is checked by `scripts/acceptance-check.mjs`.

---

## Beyond the nine phases — confidentiality

Not a phase criterion; recorded here because it is the same kind of claim and
carries the same risk of becoming prose nobody checks. See
[ADR-0018](decisions/ADR-0018-confidentiality-by-construction.md).

**Claim:** every record is classified by sensitivity; the one module allowed to
read across firms touches no client material; nothing can leave the machine;
nothing writes a file; and the firm is shown the promises nothing enforces yet,
not only the ones something does.

Proved by:

- `tests/unit/confidentiality.test.ts` — "classifies every model in the schema"
- `tests/unit/confidentiality.test.ts` — "makes every client-confidential and privileged model firm-scoped"
- `tests/unit/confidentiality.test.ts` — "lets nothing leave the machine, in any class"
- `tests/unit/confidentiality.test.ts` — "admits at least one promise that nothing enforces"
- `tests/unit/confidentiality.test.ts` — "points every enforced promise at something a reader can open"
- `tests/e2e/settings.spec.ts` — "the confidentiality report states what nothing enforces yet"
- `tests/e2e/settings.spec.ts` — "the confidentiality report offers nothing to change"

The four source-level properties are enforced by `scripts/confidentiality-check.mjs`,
which runs in `npm run verify` and in CI, and was made to fail on each of them
before being trusted.

---

## Beyond the nine phases — separation of duties

**Claim:** a decider is always told when the request is their own; a firm may
refuse such decisions outright; and a firm too small for that rule is refused
the setting rather than warned about it. See
[ADR-0019](decisions/ADR-0019-separation-of-duties-is-offered-not-imposed.md).

Proved by:

- `tests/unit/separation-of-duties.test.ts` — "refuses a self-decision when the firm has"
- `tests/unit/separation-of-duties.test.ts` — "allows a self-decision when the firm has not switched the rule on"
- `tests/unit/separation-of-duties.test.ts` — "treats an unknown requester as somebody else"
- `tests/unit/separation-of-duties.test.ts` — "warns a firm with one decider that the rule would stop its work"
- `tests/integration/approvals.test.ts` — "refuses the same decision once the firm has"
- `tests/integration/approvals.test.ts` — "refuses a rejection by the requester too, not only an approval"
- `tests/integration/approvals.test.ts` — "keeps a request decidable when its requester no longer has an account"
- `tests/integration/approvals.test.ts` — "is decided per firm, not for the instance"
- `tests/integration/settings.test.ts` — "is refused while only one person may decide"
- `tests/integration/settings.test.ts` — "does not silently save the other approval rules when it refuses"
- `tests/integration/settings.test.ts` — "counts only people who may actually decide"
- `tests/e2e/approvals.spec.ts` — "names the requester when they are the one about to decide"
- `tests/e2e/approvals.spec.ts` — "refuses to switch the rule on at a firm with one decider"

**Not proved in a browser:** no seeded firm has two people who may decide, so
the block itself cannot be exercised through the interface. It is proved at the
integration level, where the fixture is controlled.

---

## Beyond the nine phases — a superseded request

**Claim:** re-running an analysis retires the request the previous one left
waiting, and a retired request is never counted, listed or worded as one a
person decided. See
[ADR-0020](decisions/ADR-0020-a-superseded-request-is-not-a-decision.md).

Proved by:

- `tests/unit/approval-status.test.ts` — "is not one of the four"
- `tests/unit/approval-status.test.ts` — "says on screen that nobody decided it"
- `tests/unit/approval-status.test.ts` — "puts a status nobody declared in none of them"
- `tests/unit/approval-status.test.ts` — "never borrows the word 'decided' for its own refusal"
- `tests/integration/analyses.test.ts` — "retires the request the previous analysis left waiting"
- `tests/integration/analyses.test.ts` — "leaves exactly one request waiting however many times it is run"
- `tests/integration/analyses.test.ts` — "does not bury a request of another kind under the analysis ones"
- `tests/integration/approvals.test.ts` — "records that nobody decided it"
- `tests/integration/approvals.test.ts` — "is never counted as decided"
- `tests/integration/approvals.test.ts` — "cannot then be decided, and is not reported as already decided"
- `tests/integration/approvals.test.ts` — "appears in the log as superseded, not as a decision"
- `tests/integration/approvals.test.ts` — "leaves another firm's requests alone"
- `tests/e2e/approvals.spec.ts` — "leaves one request waiting, not one per run"
- `tests/e2e/approvals.spec.ts` — "says nobody decided it, rather than showing it as decided"
- `tests/e2e/approvals.spec.ts` — "is refused by the server when the post is built by hand"

**The partition test is the load-bearing one.** "Every status belongs to exactly
one of pending, decided and superseded" is what stops a seventh value being
added later and quietly counted as a decision, which is precisely how this
defect existed in the first place.

---

## Beyond the nine phases — a setting that changes something

**Claim:** the time zone a firm chose is what every date and time on every
screen is named in, and the screens say which zone that is. The one setting that
still changes nothing says so beside its own control. See
[ADR-0021](decisions/ADR-0021-a-setting-that-changes-nothing-is-a-claim.md).

Proved by:

- `tests/unit/format-dates.test.ts` — "names the firm's day, not the UTC one"
- `tests/unit/format-dates.test.ts` — "falls back to UTC rather than to the server's zone"
- `tests/unit/format-dates.test.ts` — "has no default zone, so no call site can forget one"
- `tests/unit/format-dates.test.ts` — "counts calendar days, not multiples of twenty-four hours"
- `tests/unit/format-dates.test.ts` — "is not thrown off by a daylight-saving change"
- `tests/e2e/settings.spec.ts` — "moves the clock on the activity log by the difference between the zones"
- `tests/e2e/settings.spec.ts` — "names itself, so nobody has to guess which zone a date is in"
- `tests/e2e/settings.spec.ts` — "says plainly that the language setting changes nothing"

**The browser test proves the setting, not the wording.** One event is read
twice, in two zones, and the two displayed clocks must differ by exactly three
hours — an assertion no amount of copy could satisfy.

---

## Beyond the nine phases — the short way in

**Claim:** a firm can open a matter, list its files and have Orchelio read it in
one screen — and the screen says which of those steps will run, and which will
not and why, *before* the button is pressed. See
[ADR-0022](decisions/ADR-0022-the-short-way-in.md).

Proved by:

- `tests/unit/guided-start.test.ts` — "lists four steps, all of which will run"
- `tests/unit/guided-start.test.ts` — "keeps the documents step when the role may not add them"
- `tests/unit/guided-start.test.ts` — "keeps the analysis step when the firm switched every feature off"
- `tests/unit/guided-start.test.ts` — "tells a role that cannot run one apart from a firm that switched them off"
- `tests/unit/guided-start.test.ts` — "files a document as unsorted rather than guessing what it is"
- `tests/unit/guided-start.test.ts` — "refuses somebody who may not open a matter, and says who can"
- `tests/e2e/start.spec.ts` — "says what each of the four steps will do"
- `tests/e2e/start.spec.ts` — "opens the matter, lists the files and reads it, then says so"
- `tests/e2e/start.spec.ts` — "leaves the analysis waiting for a person, like any other"
- `tests/e2e/start.spec.ts` — "refuses that reviewer on the server, not only on the screen"
- `tests/e2e/start.spec.ts` — "refuses a kind of matter this firm does not handle"

**The load-bearing one is the third-from-last.** Three steps sharing one button
is exactly where a shortcut past the approval queue would hide, so the browser
checks that a matter opened this way is waiting for a person like any other.

---

## Beyond the nine phases — a local model, admitted only where it can be checked

**Claim:** a module may talk to a model on the firm's own machine, and that
allowance is enforced rather than trusted — it must take its address from a
function that cannot return anything outside 127.0.0.0/8 and ::1, and may write
no address of its own. See
[ADR-0023](decisions/ADR-0023-a-local-model-is-a-checked-exception.md).

Proved by:

- `tests/unit/loopback.test.ts` — "refuses a private network address, which is not the same as this machine"
- `tests/unit/loopback.test.ts` — "refuses localhost, and says what to write instead"
- `tests/unit/loopback.test.ts` — "refuses credentials smuggled into the address"
- `tests/unit/loopback.test.ts` — "refuses a scheme that is not a request to this machine"
- `tests/unit/loopback.test.ts` — "refuses nothing at all, rather than defaulting to something"
- `tests/unit/loopback.test.ts` — "says the promise is checked rather than given"
- `tests/unit/confidentiality.test.ts` — "says, for every promise, what makes it true or that nothing does"
- `tests/unit/confidentiality.test.ts` — "points every enforced promise at something a reader can open"

**The enforcement itself was proved by planting**, not by a test file: a module
allowed as loopback that never calls the guard fails the build; one that calls
the guard but writes an address into its own source fails; one that takes its
address from outside passes. Since `src/lib/ai/local-provider.ts` was written,
the plant was repeated on the real module — removing its `assertLoopback` call
fails the build with the same message. Recorded here because a check nobody has
seen fail is a check nobody should believe.

---

## Beyond the nine phases — the model writes the wording and nothing else

**Claim:** with `AI_PROVIDER=local`, a model on the firm's own machine rewords
the summary and decides nothing else. Every fact, date, disagreement and gap is
derived by Orchelio; the model is told no client name; what it returns is
refused if it concludes, invents a figure, adds a link or names the wrong
matter; and the analysis says which of the two summaries is on the screen. See
[ADR-0024](decisions/ADR-0024-the-model-writes-the-wording-and-nothing-else.md).

Proved by:

- `tests/unit/local-provider.test.ts` — "keeps every derived part of the analysis whatever the model says"
- `tests/unit/local-provider.test.ts` — "tells it no client name, no title, no date and no filename"
- `tests/unit/local-provider.test.ts` — "refuses to exist at an address that is not this machine"
- `tests/unit/local-provider.test.ts` — "refuses one that concludes, and names what it read as"
- `tests/unit/local-provider.test.ts` — "refuses a figure it was not given"
- `tests/unit/local-provider.test.ts` — "never quotes a refused answer into the analysis"
- `tests/unit/local-provider.test.ts` — "falls back to Orchelio's summary when nothing is listening"
- `tests/unit/local-provider.test.ts` — "consults no model at all"
- `tests/unit/local-provider.test.ts` — "is not billable, though it is not simulated either"
- `tests/unit/local-provider.test.ts` — "records what a refused answer cost, because writing it was still work"
- `tests/unit/local-provider.test.ts` — "says what it cannot catch, by failing to catch it"
- `tests/unit/env.test.ts` — "refuses an address that is not on this machine, at startup"
- `tests/unit/env.test.ts` — "refuses it without a model name, which is what explains a past analysis"
- `tests/unit/provider-notice.test.ts` — "answers for all of them, with nothing left blank"
- `tests/unit/provider-notice.test.ts` — "never calls a real run simulated"
- `tests/unit/provider-notice.test.ts` — "reads the row rather than today's setting"
- `tests/integration/local-model.test.ts` — "is reached at the address the guard produced, with the request a runner expects"
- `tests/integration/local-model.test.ts` — "makes one request for a whole analysis, and none for the review"
- `tests/integration/local-model.test.ts` — "gives up on a server that never answers, and calls it slow rather than absent"
- `tests/integration/local-model.test.ts` — "keeps the analysis whole when the server answers with nonsense"

**The load-bearing one is the first.** Everything else in this section limits
what a bad answer can do; that one asserts a bad answer can do nothing at all to
any fact, by running the same matter twice — once with a paragraph that is
accepted, once with one that is refused — and requiring the derived parts to be
identical both times.

Four of these were proved by planting: removing the outcome check fails three
tests, letting the model's answer clear a derived field fails the first one,
putting the client's name back into the message fails the second, and collapsing
"slow" into "absent" fails the two that tell them apart.

The socket tests are separate from the rest on purpose. What `fetch` throws when
a request times out is a fact about the runtime, not about this code — measured
as a bare `TimeoutError` on Node 22 — so the provider asks the abort signal
instead of reading the error, and `tests/integration/local-model.test.ts` runs
that path against a server which genuinely never answers.

**What no test here proves:** how a real model behaves. None is installed in
this repository, so how often a given 7B model trips these checks is unknown,
and a firm should expect to find out on its own machine.

---

## V1-1 — real AI behind the same gate, governed and counted

**Criterion.** A hosted Mistral model may write the summary's wording under
exactly the discipline the local model works under (one shared
implementation), the only path to it is the one reviewed module, every call is
counted to the fraction of a cent and marked as an estimate, and every screen
that describes the provider tells the truth about this one. See
[ADR-0025](decisions/ADR-0025-egress-is-governed-not-forbidden.md) and
[ADR-0027](decisions/ADR-0027-real-ai-behind-the-same-gate.md).

Proved by:

- `tests/unit/mistral-provider.test.ts` — "goes to api.mistral.ai with the key in the header, and nowhere in the body"
- `tests/unit/mistral-provider.test.ts` — "sends the same figures message the local provider sends — one implementation"
- `tests/unit/mistral-provider.test.ts` — "tells the model no name, no title, no field value and no filename"
- `tests/unit/mistral-provider.test.ts` — "drops a paragraph that concludes, and never quotes it"
- `tests/unit/mistral-provider.test.ts` — "falls back to the derived summary when Mistral cannot be reached"
- `tests/unit/mistral-provider.test.ts` — "names the key as the problem on a 401, without quoting the response"
- `tests/unit/mistral-provider.test.ts` — "estimates from the price table, in micro-euros, and says it is an estimate"
- `tests/unit/mistral-provider.test.ts` — "records what a refused answer cost — the invoice does not care that it was refused"
- `tests/unit/mistral-provider.test.ts` — "a fraction of a cent is not rounded into a free-looking zero"
- `tests/unit/mistral-provider.test.ts` — "every routed model has a price, so no estimate can silently be a guess"
- `tests/unit/mistral-provider.test.ts` — "an unpriced model is recorded as unknown, never invented"
- `tests/unit/mistral-provider.test.ts` — "consults no model at all — a model must not mark its own work"
- `tests/unit/mistral-provider.test.ts` — "is real, billable, and routed as intermediate"
- `tests/unit/env.test.ts` — "refuses the Mistral provider without its key, at startup and by name"
- `tests/unit/provider-notice.test.ts` — "says where the material goes, and exactly what the material is"
- `tests/unit/provider-notice.test.ts` — "calls its cost an estimate, never an invoice"
- `tests/unit/provider-notice.test.ts` — "never claims nothing leaves the machine — something now does"

**What no test here proves:** that Mistral's models behave well, or what an
invoice will actually say. The build never touches the network; the live path
is proved by a human running `npm run ai:smoke`, and the estimates follow a
price table whose date is printed beside every figure derived from it. The
governed egress itself — module confined to its hosts, hosts unnameable
elsewhere, register row mandatory — is enforced by
`npm run confidentiality:check`, whose failure branches were proved by
planting rather than by a test file this document could name.

---

## What no test here proves

Stated because a coverage document that only lists what is covered is the same
shape of lie as a zero where a dash belongs.

- **That the criteria are the right criteria.** They come from the
  specification; nobody has re-derived them.
- **That the product is accessible.** Automated rules catch roughly a third of
  WCAG. Nothing here has been tested with a real screen reader, by a keyboard-only
  user, or by anybody with a disability.
- **That isolation holds against a compromised process.** All three enforcement
  layers run inside the application. See
  [Production readiness](PRODUCTION_READINESS.md).
- **That the simulated analysis resembles a real model's output.** It is a
  different mechanism producing the same *shape* of result. See
  [ADR-0012](decisions/ADR-0012-the-simulation-derives-rather-than-looks-up.md).

## See also

- [Roadmap](ROADMAP.md) — what each phase delivered
- [Development harness](HARNESS.md) — how to run each suite
- [Production readiness](PRODUCTION_READINESS.md) — what is not done
