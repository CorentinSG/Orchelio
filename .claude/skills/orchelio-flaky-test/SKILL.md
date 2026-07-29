---
name: orchelio-flaky-test
description: This skill should be used when any Orchelio test fails intermittently, passes on a retry, behaves differently under parallel workers, or when the user calls a test flaky, unstable or racy. It gives the rule that a flaky test is an unexplained bug, the three real defects in this codebase that first appeared as flakiness, and how to find the cause instead of hiding it.
---

# A flaky test is a bug you have not understood yet

## The Iron Law

```
NEVER ADD A RETRY, A SLEEP OR A LONGER TIMEOUT TO MAKE A TEST GREEN
```

Not until you can say, in one sentence, what the cause was. A retry does not fix
the test — it removes your only evidence.

## Why this project is strict about it

Three real defects here were first seen as a test that passed on the second run.

| Looked like | Actually was |
| ----------- | ------------ |
| The firm switcher test failing about half the time | A Server Action's own re-render did not reflect what the action had just done. The server was right; the browser showed the previous firm. Fixed by a form POST answered with a 303 — ADR-0006. |
| A sign-in test failing intermittently | A redirect built from `request.url`: Next reconstructed it as `localhost` while the browser used `127.0.0.1`, so the host-scoped session cookie was dropped. Fixed with a relative `Location`. |
| Approval tests failing under parallel workers | Each test picked "the first pending approval", and deciding one is not repeatable. The card is now located by its matter's reference, and the file runs serial. |

Every one of them was a genuine defect a user would have hit. A retry would have
shipped all three.

## How to find the cause

**1. Reproduce it deliberately.** Do not wait for it to happen again.

```bash
npx vitest run tests/integration/approvals.test.ts --repeat 20
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium \
  npx playwright test tests/e2e/approvals.spec.ts --retries=0 --repeat-each 5
```

Then change one variable at a time: `--workers=1` versus the default, a fresh
database versus the seeded one, a second consecutive run.

**2. Name which kind it is.** In this codebase there are four:

- **Shared state between tests.** The commonest by far. A test decides an
  approval, verifies a document, closes a matter — none of which is repeatable.
  *Tell*: passes alone, fails in the suite; passes on a fresh database, fails on
  the second run.
- **Ordering assumed but not enforced.** A test relies on something an earlier
  test did. *Tell*: passes in file order, fails with `--workers=4`.
- **A race in the product, not the test.** *Tell*: the server log and the screen
  disagree. This is the valuable case — all three defects above were this.
- **Waiting on the wrong thing.** `await expect(heading).toBeVisible()` when
  both the old and the new page have a heading. *Tell*: the assertion reads a
  page that has not navigated yet. Wait on the URL.

**3. Fix the cause, not the symptom.**

| Cause | Fix | Not |
| ----- | --- | --- |
| Shared state | Each test creates what it consumes, or targets by a unique reference | `--workers=1` alone |
| Ordering | Make the test self-contained | `test.describe.configure({ mode: "serial" })` alone |
| Product race | Fix the product | Wait longer |
| Wrong wait | Wait on the thing that actually changes | `waitForTimeout` |

Serial mode and reference-scoped selectors are legitimate — the approvals suite
uses both — but only *after* you can say why, and written down in the file so the
next reader is not left guessing.

## Never

- `test.retry()`, or raising `retries` above 0 locally.
- `page.waitForTimeout(...)` as a fix. Wait for a condition.
- `test.skip` on an intermittent test. A skipped test is a defect with the
  evidence deleted.
- Widening an assertion until it stops failing.

## Before you say it is fixed

Run it at least ten times, and run the whole suite twice:

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium \
  npx playwright test --retries=0
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium \
  npx playwright test --retries=0
```

Twice, because these tests run against a database that is **not** reset between
runs. A suite that passes once and fails the second time is consuming something.

Then say what the cause was. If you cannot, it is not fixed.

---

*The root-cause-first shape is adapted from
[obra/superpowers](https://github.com/obra/superpowers)'
`systematic-debugging`.*
