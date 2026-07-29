---
name: orchelio-phase
description: This skill should be used when starting, working on or finishing a numbered build phase of Orchelio — when the user says "Phase 5", "start phase 8", "finish this phase", or asks what a phase still needs. It gives the nine-step ritual from reading the scope to explaining the result in plain language, the files that must be updated together, and the steps most often forgotten.
---

# Delivering a phase

Orchelio is built in nine phases, one at a time. A phase is not finished when
the code works — it is finished when a stranger could clone the repository,
run it, read what changed and why, and find nothing that claims more than it
delivers.

## The Iron Law

```
ONE PHASE AT A TIME. FINISH IT, TEST IT, DOCUMENT IT, COMMIT IT, EXPLAIN IT.
NEVER START THE NEXT UNASKED.
```

## The ritual

### 1. Read the scope before writing anything

`docs/ROADMAP.md`, the section for this phase. It lists the deliverables and
one **acceptance criterion**. That criterion is the contract — write it down and
come back to it.

Check the schema too: `prisma/schema.prisma` was written in full in Phase 2, so
most phases need no migration. Check before assuming one.

### 2. Build it

Follow the rules in `CLAUDE.md`. The ones most often broken by new code:

- every firm-scoped query names its firm → skill `orchelio-firm-scope`;
- a consequential form POSTs to a route handler answering 303, never a Server
  Action → ADR-0006;
- a screen says less than it knows → skill `orchelio-honest-ui`;
- no firm data cached across requests → ADR-0010.

### 3. Test the acceptance criterion directly

Not "the feature works" — the criterion, asserted against the same data the seed
writes. Three levels, and each proves something the others cannot:

| Level | Proves | Lives in |
| ----- | ------ | -------- |
| Unit | The rule, in isolation and deterministically | `tests/unit/` |
| Integration | The rule against a real migrated database, both inside and across the firm boundary | `tests/integration/` |
| Browser | That the honesty survives being rendered, and that refusals refuse | `tests/e2e/` |

A test that has never been seen to fail is not a test. When you write a guard,
write the case that trips it.

### 4. Run the gate

Skill `orchelio-verify`. In short: `npm run verify`, `npm run skills:firm-scope`, the
browser suite with `--retries=0`, twice, and `node scripts/doctor.mjs`.

### 5. Fix the checks the phase made stale

Every phase so far has invalidated assertions from earlier ones — a tab that was
a placeholder is now real, a tile that showed a dash now shows a number. That is
not a regression: update the assertion and say in the commit that it was stale.

Never weaken a check to make a run green.

### 6. Update everything that describes the phase, together

Miss one and the product and its documentation disagree. All of these:

| File | What changes |
| ---- | ------------ |
| `src/lib/roadmap.ts` | the phase's `status` → `"done"` — **the home page reads this** |
| `docs/ROADMAP.md` | the phase section → `✅ Delivered`, what was built, what was found, real test counts |
| `README.md` | the status paragraph, the phase table, the limitations list |
| `docs/decisions/ADR-00NN-*.md` | a note for each decision a reasonable person would have made differently |
| `docs/INDEX.md` | the new ADRs in the table, the "N are delivered" line |
| `docs/ARCHITECTURE.md` | if the phase changed how something is put together |
| `docs/PRODUCTION_READINESS.md` | any row this phase moved, honestly |
| `CLAUDE.md` | a rule future work must not break |

Get the test counts from the run, not from memory:

```bash
npx vitest run tests/unit/<new>.test.ts 2>&1 | grep "Tests "
npx playwright test tests/e2e/<new>.spec.ts --list 2>/dev/null | tail -1
```

An ADR is warranted when somebody reasonable would choose differently without
knowing what you knew. Preferences do not need one. See `docs/INDEX.md` for the
shape.

### 7. Regenerate the indexes

```bash
npm run codemap
npm run docs:check
npm run graph:update
```

### 8. Verify a clean clone, then commit

The fresh-clone check in `orchelio-verify`. Then commit with a message that says
what was delivered, what was decided and why, what was found and fixed, and the
real numbers.

Commit the refreshed graph separately — `graphify-out/GRAPH_REPORT.md` is the
only graph artefact in Git.

### 9. Explain it to somebody who is not a developer

The user is not a developer. The explanation is part of the deliverable, not a
courtesy after it. See `references/explaining.md`.

## The steps most often forgotten

1. `src/lib/roadmap.ts` — the home page then contradicts the documentation.
2. Stale assertions from earlier phases (step 5).
3. Test counts quoted from memory into `docs/ROADMAP.md`.
4. The fresh-clone check.
5. Saying plainly what the phase did **not** deliver.

## Do not start the next phase

When the phase is pushed, say what was delivered, how to see it, and stop. The
last line of the explanation says which phase has not been started.
