---
title: Development harness
tags: [reference, tooling]
---

# Orchelio — the development harness

Tooling around the project: how to verify a change, how to navigate the code
without reading all of it, and what is cached where.

Nothing here is required to *run* Orchelio — `npm run dev` still works with none
of it. It exists to make working on Orchelio faster and harder to get wrong.

---

## 1. Is this checkout ready?

```bash
npm run harness:doctor
```

Checks the things that actually go wrong — a missing `.env`, an un-migrated
database, a database with no demonstration data, a stale index, no browser for
the end-to-end tests — and prints the exact command to fix each one.

It exits non-zero only for problems that stop the application running. A stale
index is reported and does not fail: it slows work down, it does not break it.

In Claude Code the same script runs automatically at the start of every session
(`.claude/hooks/session-start.sh`), which also installs dependencies, applies
migrations and seeds if needed. It never resets or drops anything.

---

## 2. Verifying a change

```bash
npm run verify        # lint + typecheck + docs + acceptance + skills + unit and integration tests  (~25 s)
npm run verify:full   # the above, plus the production build and browser tests (~3 min)
```

Run `verify` before every commit and `verify:full` before every push. CI
(`.github/workflows/verify.yml`) runs both, split into two jobs so a typo fails
in a minute rather than in five.

Narrower runs when you know what you touched:

```bash
npm run test:unit           # pure logic and components
npm run test:integration    # firm isolation, against a throwaway database
npm run test:e2e            # a real browser
npm run test:e2e:ui         # the same, with Playwright's inspector
npm run test:a11y           # axe-core over every page, in both themes
```

## 2a. Acceptance coverage

```bash
npm run acceptance:check
```

`docs/ACCEPTANCE.md` names, for every phase, the tests that prove its acceptance
criterion — by file and by title. This verifies that each one still exists.

It is the same failure mode the documentation check exists for, one level up: a
renamed test turns that document into a list of claims about nothing, while it
goes on reading like evidence. It runs inside `npm run verify`, in CI, and is
reported by the doctor.

Proved to fail before being trusted, on a renamed test, a moved file, and a
phase whose criterion had no test beneath it.

## 2b. Accessibility

```bash
npm run test:a11y
```

axe-core against every principal page, in **both** themes, over WCAG 2.1 A and
AA plus best-practice — and alongside it, ordinary browser tests for what an
automated audit cannot judge: the skip link, focus visibility, keyboard-only
sign-in, `aria-current` on the open tab, and which announcements are alerts.

Both themes is not a formality. The palettes are separate, and a colour token
can clear 4.5:1 in one and fail in the other.

**Passing means no machine-detectable violation.** Automated rules cover roughly
a third of WCAG, and not the hard third — see
[ADR-0017](decisions/ADR-0017-the-accessibility-claim-is-bounded.md).

**A test that passes on retry is a bug you have not understood yet.** Two real
defects in this codebase were first seen as flakiness. When one appears, run the
suite with `--retries=0` and reproduce it deliberately before changing anything.

---

## 2c. Skills

`.claude/skills/` holds five skills — instructions an assistant loads when it
recognises the situation they describe, rather than re-deriving a rule that was
paid for once already.

| Skill | Loaded when |
| ----- | ----------- |
| `orchelio-phase` | Starting or finishing a numbered build phase |
| `orchelio-firm-scope` | Touching anything that reads or writes firm data |
| `orchelio-honest-ui` | Adding or changing a user-facing surface |
| `orchelio-verify` | About to claim something is finished or passing |
| `orchelio-flaky-test` | A test fails intermittently or passes on a retry |

They are written for this project, not copied from a catalogue: a generic
"verify before completion" skill restates what everybody already believes,
while one naming *this* project's commands and *this* project's three
retry-hidden defects is worth loading. Where the shape was borrowed —
[obra/superpowers](https://github.com/obra/superpowers) for the Iron-Law and
gate-function form — the skill says so at the bottom.

### They are checked like the documentation

```bash
npm run skills:check
```

A skill is prose that goes stale silently while continuing to look
authoritative, which is exactly the failure `npm run docs:check` exists to
prevent for `docs/`. So the same treatment: frontmatter present, `name`
matching the folder, a description that says *when* to use it, no duplicate
names, every file path and every `npm run` it mentions actually existing, every
bundled `references/` and `scripts/` file referenced from the SKILL.md, and
every bundled script parsing.

It runs inside `npm run verify` and is reported by the doctor.

### The one skill with teeth

```bash
npm run skills:firm-scope
```

`orchelio-firm-scope` bundles an audit that lists every file reaching Prisma
from outside `src/lib/data`, and every unscoped data-layer export, each with the
reason it is allowed. A new one fails the run.

It is a **ratchet, not a proof** — and the script says so in its own output. A
grep cannot know whether `where: { firmId }` names the *right* firm; that is
what the runtime guard and `tests/integration/isolation.test.ts` are for. What
the ratchet buys is that adding an exception is a deliberate act somebody has
to justify in writing, rather than a line that slips in.

The allow-list was built by measuring rather than guessing: a naive version
flagged nine legitimate cases — platform catalogues shared by every firm, pure
helpers that touch no database, and the guard itself.

---

## 3. Navigating without reading everything

Reading a codebase by grepping costs tokens proportional to the number of files.
Two generated indexes replace most of that, and neither needs an API key or a
network.

### `docs/CODEMAP.md` — where things live

Every module, one sentence on what it is for, and its exported symbols. One file
instead of eighty.

```bash
npm run codemap    # regenerate
```

Covers `prisma/schema.prisma` and the scripts, which the graph below skips.
CI fails if it is stale, so it can be trusted.

### The knowledge graph — how things connect

Built by [Graphify](https://graphify.net) from a local AST pass. It answers the
questions a flat index cannot: what calls this, what would break, where the hubs
are.

```bash
npm run graph                              # build from scratch
npm run graph:update                       # after code changes
npm run graph:explain -- "currentSession()"  # everything known about one symbol
npm run graph:query -- "how does auth reach the database?" --budget 1500
```

`graphify-out/GRAPH_REPORT.md` is committed — a fresh session gets the map of
hubs and communities for free. The heavy artefacts (`graph.json`, `graph.html`)
are rebuilt on demand and are not in Git.

The report records the commit it was built from, which is how `harness:doctor`
tells whether it is current without rebuilding it.

That check used to compare the recorded commit against `HEAD`, and so reported
a perfectly current graph as stale after every commit — including the commit
that added the graph itself. The advice in this file was to expect a one-commit
lag and ignore it, which is the wrong shape of answer: a check nobody believes
is a check nobody reads.

It now asks the question that was meant all along — *has anything the graph
indexes changed since it was built?* — by diffing the recorded commit against
the **working tree** and keeping only `src/`, `prisma/`, `scripts/` and `tests/`
source files. So an uncommitted edit counts, a documentation change does not,
and a warning means rebuild.

Two limitations, stated so they are not rediscovered:

- Orchelio runs Graphify in `--code-only` mode. Full mode sends semantic
  extraction of Markdown and PDFs to an LLM and needs an API key; the project's
  rule is that it costs nothing to run and nothing leaves the machine, so the
  local AST pass is what is used. `docs/CODEMAP.md` covers the gap.
- Community names are placeholders (`Community 7`, or the hub's filename) for
  the same reason — naming them is the part that would call a model.

### When to grep anyway

An exact string or regex, or a file too new to be indexed. Scope it to the
directory the code map named rather than the whole repository.

### `docs/decisions/` — why things are the way they are

Neither index answers "why". Seventeen decision records do, and several of them exist
because a reasonable person would otherwise change something back: the 303
redirects, the caching rule, the practice-area vocabulary, the middleware that
is deliberately not a security boundary.

Each note says what the problem was, what was decided, and what it cost —
including the limitations. [`docs/INDEX.md`](INDEX.md) lists them.

### Obsidian

`docs/` is also an [Obsidian](https://obsidian.md) vault: open the folder as a
vault and you get linked navigation, backlinks, tag filtering and a graph of how
the notes relate. `docs/INDEX.md` is the entry point.

Deliberately *not* done: nothing is duplicated (the vault is the folder), and no
`[[wikilink]]` syntax is used. Wikilinks would break rendering on GitHub, which
is where these documents are mostly read. Ordinary relative links work in both.

`npm run docs:check` is what keeps it honest: every internal link must resolve,
and every note must be reachable from the index. A note nothing links to is a
note nobody finds — the exact failure a knowledge base is meant to prevent. It
runs in `npm run verify` and in CI.

Obsidian is a convenience for reading, not a dependency. Nothing in the project
needs it installed.

---

## 4. Caching

### The rule

**Firm-scoped data is never cached across requests.** A cache hands one
request's answer to another; in a multi-tenant product that is the same shape as
the bug the architecture exists to prevent, and worse, because no query is
involved and the firm scoping guard never sees it.

`src/lib/cache.ts` therefore allows exactly two kinds of cache, different in
kind and not merely in duration:

| Kind | Lifetime | May hold firm data? |
| ---- | -------- | ------------------- |
| `requestScoped` — React `cache()` | one server request | yes, it cannot outlive the request |
| `platformCatalogue` — practice areas, matter types, workflow templates | 60 seconds | **no**, checked at the call site |

`platformCatalogue` takes the model name and throws `UncacheableModelError` for
anything the firm scoping guard classifies as firm-scoped, so moving a firm read
into it fails at the first call rather than leaking quietly.
`tests/unit/cache.test.ts` asserts this against every firm-scoped model in the
schema, so the two lists cannot drift apart.

There is no third kind. If a screen is slow because it re-reads a firm's
matters, the answer is a better query or an index.

### What it bought, measured

`ORCHELIO_LOG_QUERIES=1` prints every SQL statement, which is how these numbers
were obtained rather than estimated:

```bash
ORCHELIO_LOG_QUERIES=1 npm run dev
```

| Page | Before | After |
| ---- | ------ | ----- |
| Dashboard | 23 queries | **17** |
| Onboarding step 3, catalogue warm | 7 queries | **6** |

Where it came from:

- `currentSession()` is the most connected function in the codebase — the graph
  puts it at 19 edges — and was called from the layout, the page and each access
  guard. Each call meant a session lookup plus its user, memberships and firms.
  Request-scoped memoisation collapses them to one.
- `usageSummary` did four queries: one aggregate and three counts. It now does
  two, by grouping. The dashboard reads it on every load, so that is paid on
  every page view.
- The catalogues are identical for every firm, so the questionnaire no longer
  re-reads them on every step.

### Build and test caches

| Cache | Where | Effect |
| ----- | ----- | ------ |
| `.next/cache` | local and CI | roughly halves a rebuild |
| TypeScript incremental | `tsconfig.json` | `typecheck` re-checks only what changed |
| npm | CI, `actions/setup-node` | `npm ci` in seconds |
| Playwright browsers | CI | avoids a browser download per run |
| `prisma generate` | `postinstall` | the client is present after `npm install` |

Playwright reuses a running dev server locally (`reuseExistingServer`), so
repeated `npm run test:e2e` runs skip the build.

---

## 5. Where the harness lives

| Path | What it is |
| ---- | ---------- |
| `CLAUDE.md` | Project rules and shortcuts for coding agents. Read first. |
| `.claude/settings.json` | Permission allowlist and the session hook |
| `.claude/hooks/session-start.sh` | Makes a fresh checkout workable, unattended |
| `scripts/doctor.mjs` | The environment check |
| `scripts/codemap.mjs` | Generates `docs/CODEMAP.md` |
| `scripts/docs-check.mjs` | Verifies every internal link and finds orphaned notes |
| `scripts/acceptance-check.mjs` | Verifies every test named in `docs/ACCEPTANCE.md` still exists |
| `scripts/skills-check.mjs` | Verifies the skills' frontmatter and everything they point at |
| `docs/ACCEPTANCE.md` | Every acceptance criterion, and the tests that prove it |
| `docs/DEMONSTRATION.md` | How to give a demonstration, and what to say about the limits |
| `docs/INDEX.md` | Entry point of the documentation, and of the Obsidian vault |
| `docs/decisions/` | Why things are the way they are |
| `.github/workflows/verify.yml` | CI |
| `src/lib/cache.ts` | The caching rule, and the two caches it permits |

---

## 6. Adding to the harness

Two things to keep true, because they are what makes it worth having:

1. **It must work with no API key and no network.** Everything above runs
   locally. A tool that needs credentials is optional at best.
2. **An index that can go stale must be checkable.** The code map is verified in
   CI (`node scripts/codemap.mjs --check`) and the doctor checks both. An index
   nobody can tell is wrong is worse than none.

   Check *content or commit*, never modification times. The first version of the
   doctor compared mtimes and reported a perfectly current index as stale on
   every fresh clone, because `git clone` stamps every file with the same time.
