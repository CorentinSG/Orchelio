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
npm run verify        # lint + typecheck + unit and integration tests  (~15 s)
npm run verify:full   # the above, plus the production build and browser tests (~2 min)
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
```

**A test that passes on retry is a bug you have not understood yet.** Two real
defects in this codebase were first seen as flakiness. When one appears, run the
suite with `--retries=0` and reproduce it deliberately before changing anything.

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
tells whether it is current without rebuilding it. Expect it to lag by one
commit: the graph is rebuilt before a commit, so it names the commit before
that. That is a one-commit lag, not staleness — rebuild when the doctor says the
gap is wider.

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

Neither index answers "why". Ten decision records do, and several of them exist
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
