---
name: orchelio-verify
description: This skill should be used when about to claim that any Orchelio work is finished, passing, fixed or ready to commit, and before pushing or opening a pull request. It gives the exact command that proves each kind of claim, the order to run them in, and the fresh-clone check that catches what a warm working directory hides. Adapted from obra/superpowers' verification-before-completion.
---

# Evidence before claims

## The Iron Law

```
NO CLAIM WITHOUT FRESH OUTPUT FROM THE COMMAND THAT PROVES IT
```

If you have not run it in this message, you cannot say it passes. "Should
pass", "the change was small", "it passed before the last edit" are not
evidence — and on this project, twice, the thing that "obviously worked" was
the defect.

## What proves what

| Claim | Command | Not sufficient |
| ----- | ------- | -------------- |
| Types are sound | `npm run typecheck` | The editor was quiet |
| Lint is clean | `npm run lint` | Only the changed file checked |
| Unit and integration tests pass | `npm run test` | A single file passing |
| Documentation links resolve | `npm run docs:check` | The file exists |
| Every acceptance criterion still names a real test | `npm run acceptance:check` | The document looks complete |
| No page has a detectable accessibility violation | `npm run test:a11y` | It looked fine |
| No new firm-scope bypass | `npm run skills:firm-scope` | Reading the diff |
| The interface behaves | `npx playwright test --retries=0` | Unit tests passing |
| It builds | `npm run build` | `next dev` running |
| A clean checkout works | the fresh-clone check below | Your working directory works |
| The environment is sound | `node scripts/doctor.mjs` | It ran yesterday |

`npm run verify` chains lint, typecheck, docs:check, acceptance:check,
skills:check and the test suite. It does **not** run the browser tests or the
build — `npm run verify:full` does.

## The gate, in order

```
1. npm run verify                     ← lint, types, docs, acceptance, skills, tests
2. npm run skills:firm-scope          ← no new route to Prisma
3. PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium \
     npx playwright test --retries=0  ← the browser suite, accessibility included
4. node scripts/doctor.mjs            ← code map, graph and acceptance map current?
```

Read the output. Count the failures. A suite that says `174 passed` and a suite
you assume passed are different things.

Test counts move every phase. Take them from the run, never from this file.

## `--retries=0`, deliberately

Playwright retries in CI by default. Locally, never turn it on to get a green
run. Three real defects in this codebase were first seen as a test that passed
on the second attempt:

- the firm switcher showing the previous firm about half the time;
- a redirect built from `request.url` dropping the session cookie;
- approvals being consumed by whichever parallel test reached them first.

A retry would have hidden all three. See the `orchelio-flaky-test` skill.

A timeout is in the same family. When the accessibility audit of `/approvals`
exceeded thirty seconds, the cause was a page rendering a hundred cards — and
the same investigation turned up a count on that screen that was simply wrong.
Raising the timeout would have hidden both.

## The fresh-clone check

A warm working directory hides a missing file, a stale generated client, a
`.gitignore` line that excluded something needed. Before saying a phase is
finished:

```bash
D=$(mktemp -d)/clone
git clone -q --no-hardlinks . "$D"
cd "$D" && cp /path/to/.env .env
npm ci && npx prisma migrate deploy && npm run seed
npm run verify
PLAYWRIGHT_PORT=3140 PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium \
  npx playwright test --retries=0
```

If the work is not committed yet, carry it over with
`git diff --cached > p.patch` and `git apply --index p.patch`.

This has been worth it every time it was run.

## Reporting honestly

- Tests failed → say so, with the output. Never round up.
- A step was skipped → say which and why.
- Something is done and verified → say it plainly, without hedging.
- A number in a commit message or in `docs/ROADMAP.md` → get it from the run,
  not from memory. Test counts drift every phase.

## When a check is wrong rather than the code

It happens — Phase 5's assertions were correct until Phase 6 changed the
surface they described. Fix the check and say in the commit that the assertion
was stale, not that the behaviour regressed. Do not weaken a check to make a
run green.

---

*The gate-function shape is adapted from
[obra/superpowers](https://github.com/obra/superpowers)'
`verification-before-completion`, with this project's actual commands and
defects.*
