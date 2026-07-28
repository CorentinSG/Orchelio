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
| "**Why** is it like this?" | `docs/decisions/` — ten ADRs, linked from `docs/INDEX.md` | one note |

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

### 5. The product is named Orchelio, everywhere

`src/lib/app-config.ts` is the only place the name appears. A unit test fails if
a generic name ("Legal AI Platform", "JurisFlow", …) ever appears in a
user-visible surface.

### 6. An analysis may describe, never conclude

`src/lib/ai/reviewer.ts` scans Orchelio's own prose for eligibility findings,
recommendations, predictions and confirmed deadlines, and fails the analysis if
it finds one. That check has never fired in normal operation — it is a
regression guard, and `tests/unit/ai-reviewer.test.ts` proves it can fail.

It scans only text Orchelio wrote. A recorded field's *value* is what the firm
wrote down about the client; flagging it would be flagging the client.

### 7. Say less than you know, not more

A widget whose data does not exist yet shows a dash, not a zero — a zero is a
claim ("there is nothing to do"). A widget depending on an AI feature the firm
switched off is omitted, not shown empty. Refusals are worded identically
whether a record is missing or forbidden, so a refusal never confirms existence.

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
- **Orchelio never sends anything.** `DraftCommunication` has no "sent" status
  and there is no transport.

---

## Commands

```bash
npm run verify          # lint + typecheck + unit/integration tests — run before every commit
npm run verify:full     # the above, plus build and browser tests
npm run dev             # http://localhost:3000
npm run seed            # fictional data, safe to re-run
npm run codemap         # regenerate docs/CODEMAP.md
npm run docs:check      # every internal link resolves, no orphaned note
npm run graph:update    # refresh the knowledge graph (local, no API key)
```

`npm run reset-demo` **erases the database**. Prisma refuses to run it from an
AI assistant without explicit human consent — ask, do not work around it.

Browser tests need `PLAYWRIGHT_CHROMIUM_EXECUTABLE` set, or a browser installed
with `npx playwright install chromium`.

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
