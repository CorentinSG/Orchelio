# Orchelio — working notes for coding agents

Read this once at the start of a session. It exists so you do not have to
rediscover the project by grepping: everything below is either a rule that will
bite you if you break it, or a shortcut that saves a hundred tool calls.

---

## What this is

Orchelio is a configurable SaaS for law firms. **One codebase, many firms.** A
seven-step onboarding questionnaire writes a `FirmConfiguration`, and that
record — not the code — is what makes one firm's Orchelio different from
another's.

Built in nine phases; see `docs/ROADMAP.md` for what is done and what is next.
`src/lib/roadmap.ts` is the machine-readable copy the home page renders, so
**update both** when a phase lands.

---

## Navigate cheaply

Do not start by grepping. In order of cost:

| Question | Use | Cost |
| -------- | --- | ---- |
| "Where does X live? What does this module export?" | `docs/CODEMAP.md` | one file |
| "How does X reach Y? What calls this?" | `npm run graph:explain -- "currentSession()"` | ~300 tokens |
| "What are the hubs of this codebase?" | `graphify-out/GRAPH_REPORT.md` | one file |
| "Exact string or regex in source" | `Grep` — but scope it to the directory the map named | small |
| "**Why** is it like this?" | `docs/decisions/` — seventeen ADRs, linked from `docs/INDEX.md` | one note |

Both indexes are generated and can go stale. Refresh with `npm run codemap` and
`npm run graph:update` (neither needs an API key or a network).

Before changing something that looks odd, check `docs/decisions/` — several
oddities in this codebase are deliberate, measured, and were paid for once
already.

---

## Rules that will bite you

### 1. Every firm-scoped query names its firm

`getMatter({ matterId, firmId })`, never `getMatter(matterId)`. This is enforced
three times over, so breaking it fails loudly rather than leaking:

- **Types** — every function in `src/lib/data/` takes a `FirmScope` first.
- **The database client** — `src/lib/data/firm-scope.ts` wraps Prisma and throws
  `FirmScopeError` on an unscoped query against a firm-scoped model.
- **The guards** — `requireFirmAccess` / `requirePermission` check membership
  before a page renders, and log every refusal.

`AND` and `OR` are treated **oppositely**: one scoped branch satisfies an `AND`,
but *every* branch of an `OR` must be scoped, because
`OR: [{ firmId }, { status }]` returns the whole database.

### 2. Firm data is never cached across requests

`src/lib/cache.ts` allows exactly two kinds of cache:

- `requestScoped` (React `cache()`) — dies with the request, safe for anything.
- `platformCatalogue` — only `PracticeArea`, `MatterType`, `WorkflowTemplate`,
  checked at the call site. Anything else throws.

There is no third kind. A slow firm query wants a better query or an index, not
a cache.

### 3. Consequential forms POST to a route handler, not a Server Action

Switching firm, saving an onboarding step, confirming a configuration: all are
plain form POSTs answered with an HTTP 303 (`src/lib/http/form-post.ts`).

This is not a style preference. Twice, a Server Action's own re-render did not
reflect what the action had just done — the firm switcher showed the *previous*
firm about half the time, and confirming the configuration navigated nowhere.
Both times the server was right and the browser was wrong, which is the worst
combination because nothing looks broken.

Related traps, both already paid for:

- Never `revalidatePath("/", "layout")` in an action that redirects across
  routes — the client router discards the navigation.
- Never build a redirect URL from `request.url`; Next reconstructs it and the
  host can differ from the browser's, which drops host-scoped cookies. Use
  relative `Location`, and compare `Origin` against the `Host` header.

### 4. Nine approval rules cannot be switched off

`LOCKED_APPROVALS` in `src/lib/constants.ts`. They render with a padlock, are
submitted by nothing, and are written in by the server whatever arrived. No
automatic filing, no permanent deletion, no settlement or opposing-counsel
communication, no final deadline or eligibility conclusion without a person.

`requiresApproval` (`src/lib/approvals/actions.ts`) checks the lock **first** and
never reads the firm's configuration for a locked rule — there is no ordering of
checks and no configuration value that changes the answer.

### 5. A sensitive action has no function of its own

There is no `closeMatter()` to call. A sensitive action calls `raiseApproval`,
which either creates a request — and the effect is applied later by
`decideApproval` and by nothing else — or, for a configurable rule the firm
switched off, applies it immediately through the *same* `applySensitiveEffect`.
One implementation, two callers, so the approved and unapproved routes cannot
drift. See ADR-0014.

`decideApproval` also reads the firm's separation-of-duties setting **itself**
rather than taking it as an argument — a caller that forgot to pass it would
silently get the permissive answer. A decider is always told when the request is
their own, whether or not the firm refuses it, and every audit entry carries
`decidedOwnRequest`. See ADR-0019.

### 6. The product is named Orchelio, everywhere

`src/lib/app-config.ts` is the only place the name appears. A unit test fails if
a generic name ("Legal AI Platform", "JurisFlow", …) ever appears in a
user-visible surface.

### 7. An analysis may describe, never conclude

`src/lib/ai/reviewer.ts` scans Orchelio's own prose for eligibility findings,
recommendations, predictions and confirmed deadlines, and fails the analysis if
it finds one. That check has never fired in normal operation — it is a
regression guard, and `tests/unit/ai-reviewer.test.ts` proves it can fail.

It scans only text Orchelio wrote. A recorded field's *value* is what the firm
wrote down about the client; flagging it would be flagging the client.

### 8. Say less than you know, not more

A widget whose data does not exist yet shows a dash, not a zero — a zero is a
claim ("there is nothing to do"). A widget depending on an AI feature the firm
switched off is omitted, not shown empty. Refusals are worded identically
whether a record is missing or forbidden, so a refusal never confirms existence.

### 9. Cross-firm reads live in one module

`src/lib/data/platform.ts` is the only place allowed to look across tenants —
the firm list, the instance counts, creating a firm. Nothing it returns names a
matter, a client or a document, because the query does not ask.

Instance totals are summed from each firm's own `_count`. Do **not** satisfy the
scoping guard with a filter that matches every firm (`where: { firm: { is: {} } }`
and friends): it reads as scoped and is not, which is worse than the count being
awkward.

### 10. Destructive things are commands, not buttons

Adding fictional data is offered in the interface and is additive — a matter
whose reference exists is skipped, and nothing is deleted. Erasing is
`npm run reset-demo`, typed by a person. Two browser tests assert that no button
matching `/delete|erase|reset|wipe/i` exists on those pages, so adding one fails
a test rather than shipping. See ADR-0016.

A firm also cannot demote or suspend its **last** administrator: a platform
administrator holds no membership, so nobody would be left able to undo it.

### 11. A claim about a test is checked, not written down

`docs/ACCEPTANCE.md` names, for every phase, the tests that prove its acceptance
criterion. `npm run acceptance:check` verifies each one still exists, by file and
by title, and runs inside `npm run verify`. Rename a test and the build fails —
which is the point, because a document full of claims about tests that no longer
exist goes on reading like evidence.

### 12bis. Confidentiality is checked, not promised

`src/lib/confidentiality/classification.ts` classifies every model into five
sensitivity classes. `npm run confidentiality:check` enforces four properties
and fails the build on each: every schema model is classified, the cross-tenant
module `src/lib/data/platform.ts` names no client-confidential or privileged
model, **nothing in `src/` can make an outbound request**, and nothing writes a
file.

The egress allow-list is **empty**. Adding to it is a decision to send client
material somewhere and belongs in a review, not in a commit nobody reads.

Settings → Confidentiality shows the firm the whole register, including the
promises nothing enforces yet. Never add a row there without its limitation.
See ADR-0018.

### 12. Accessibility is audited in both themes, and the claim is bounded

`npm run test:a11y` runs axe-core over every principal page in light *and* dark.
A contrast token can pass in one palette and fail in the other, so testing the
default only would report the product as fine while half its users saw the
failure.

Say what it does not cover, every time: automated rules catch roughly a third of
WCAG, and nothing here has been tested with a screen reader or by anybody with a
disability. See ADR-0017.

---

## Constraints from the specification

- **Fictional data only.** Demonstration warnings on every principal page.
- **No cost to run.** No paid hosting, no cloud database, no API key. If a
  change would require one, it is the wrong change.
- **AI is simulated** (`AI_PROVIDER=mock`). `ANTHROPIC_API_KEY` is server-only
  and absent; selecting the Anthropic provider without it throws at startup
  rather than silently falling back. The simulation *derives* its output from
  each matter's fields, intake answers and document **names** — it never opens a
  document, and every analysis says so. An analysis has no field for a
  conclusion, a recommendation or an eligibility finding: absent from the type,
  not left empty. See ADR-0012 and ADR-0013.
- **Orchelio never sends anything.** `DraftCommunication` is `"draft"` or
  `"approved_for_use"` — there is no "sent" status and no transport. Approving a
  draft means a person has read the exact words and is content for them to leave
  the firm; somebody then copies them out and sends them themselves.

---

## Commands

```bash
npm run verify          # lint + typecheck + docs + acceptance + skills + confidentiality + tests
npm run verify:full     # the above, plus build and browser tests
npm run dev             # http://localhost:3000
npm run seed            # fictional data, safe to re-run
npm run codemap         # regenerate docs/CODEMAP.md
npm run docs:check      # every internal link resolves, no orphaned note
npm run acceptance:check    # every test named in docs/ACCEPTANCE.md still exists
npm run test:a11y       # axe-core over every page, both themes
npm run confidentiality:check   # classification, egress, storage, cross-tenant reads
npm run skills:check    # .claude/skills frontmatter, and everything they point at
npm run skills:firm-scope   # no new route to Prisma outside the data layer
npm run graph:update    # refresh the knowledge graph (local, no API key)
```

`npm run reset-demo` **erases the database**. Prisma refuses to run it from an
AI assistant without explicit human consent — ask, do not work around it.

Browser tests need `PLAYWRIGHT_CHROMIUM_EXECUTABLE` set, or a browser installed
with `npx playwright install chromium`.

---

## Skills

`.claude/skills/` holds five, loaded when the situation calls for them rather
than read up front:

| Skill | Loaded when |
| ----- | ----------- |
| `orchelio-phase` | Starting or finishing a numbered build phase |
| `orchelio-firm-scope` | Touching anything that reads or writes firm data |
| `orchelio-honest-ui` | Adding or changing a user-facing surface |
| `orchelio-verify` | About to claim something is finished or passing |
| `orchelio-flaky-test` | A test fails intermittently or passes on a retry |

They restate rules from this file with the detail a rule cannot carry — the
commands that prove a claim, the three defects a retry would have hidden, the
audit script. `npm run skills:check` keeps them from going stale, and runs
inside `npm run verify`.

---

## Working style for this project

- **One phase at a time.** Finish it, test it, commit it, explain it. Do not
  start the next phase unasked.
- **Measure, do not guess.** The caching work came from counting SQL statements
  with `ORCHELIO_LOG_QUERIES=1`, and the redirect bugs from reading response
  headers. Both looked like something else until they were measured.
- **A flaky test is a bug you have not understood yet.** Two real defects in
  this codebase were first seen as tests that passed on retry.
- **Comments explain why, not what.** The codebase is written to be read by
  someone who was not here; keep that.
- **The user is not a developer.** Explain in plain language, give exact
  commands, and state limitations plainly rather than implying completeness.
