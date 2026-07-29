---
name: orchelio-firm-scope
description: This skill should be used when reviewing or writing any code in Orchelio that reads or writes firm data — a data-access function, a route handler, a page, a Prisma query, a new model — or when the user asks about multi-tenant isolation, firm scoping, data leaking between firms, or FirmScope. It gives the three enforcement layers, the AND/OR trap, the audit script, and what each layer does and does not prove.
---

# Firm scoping in Orchelio

One codebase, many firms. Every firm's data is invisible to every other firm,
and that is the property the whole product rests on: a leak here is not a bug
report, it is a professional-conduct incident for a law firm.

## The Iron Law

```
EVERY FIRM-SCOPED QUERY NAMES ITS FIRM
```

`getMatter({ matterId, firmId })`, never `getMatter(matterId)`. If you are
writing a query and the firm is not in it, stop — you are about to write the
one bug this product cannot have.

## Three layers, and what each actually proves

Never rely on one. They fail differently, which is the point.

| Layer | Where | Proves | Does **not** prove |
| ----- | ----- | ------ | ------------------ |
| Types | `src/lib/data/*.ts` — every function takes a `FirmScope` first | Omitting the firm is a compile error | That the firm passed is the right one |
| Runtime guard | `src/lib/data/firm-scope.ts` wraps Prisma | A query against a firm-scoped model that names no firm throws `FirmScopeError` | That the firm named is the caller's |
| Guards | `requireFirmAccess` / `requirePermission` | The signed-in user belongs to this firm, and every refusal is logged | Anything about the queries underneath |

The guard checks that a firm is **named**, not that it is named *correctly*.
It defends against omission, not against sabotage.

## The trap that has bitten before

`AND` and `OR` are treated **oppositely**:

- one scoped branch satisfies an `AND`;
- **every** branch of an `OR` must be scoped.

Because `OR: [{ firmId }, { status: "active" }]` returns the whole database —
every firm's rows, silently, with no error. An `OR` in a data-layer function is
worth reading twice.

## Before you claim a change is safe

Run the audit:

```bash
npm run skills:firm-scope
```

(which runs `.claude/skills/orchelio-firm-scope/scripts/audit.mjs`)

It is a **ratchet, not a proof**. It lists every file that reaches Prisma from
outside the data layer and every unscoped data-layer export, each with the
reason it is allowed. A new one fails the run. Adding to the allow-list is
meant to be a deliberate act somebody justifies in writing — if the reason is
"it was quicker", that is not a reason.

Then run the suite that actually proves isolation:

```bash
npx vitest run tests/integration/isolation.test.ts tests/integration/matters.test.ts
```

Those build a throwaway database with two firms holding **deliberately similar**
records — same client name, same document filename, same matter title — and ask
whether one firm can reach the other's copy. Similar data is the point: it is
how a query that matches on title and forgets the firm gets caught.

## Writing a new data-access function

1. `FirmScope` first, and required.
2. `findFirst` with the firm in the `where`, never `findUnique`. `findUnique`
   accepts only unique fields, so the firm check would have to happen *after*
   the row is loaded, in a caller that might forget.
3. A write re-reads its parent inside the scope first. `addDocument` re-reads
   the matter, so a real identifier belonging to another firm records nothing.
4. `updateMany` / `deleteMany` with the firm in the `where`, and check the
   returned count. A count of zero is the refusal.

## Writing a screen or a route handler

- Never import `prisma` — go through `src/lib/data`. The audit script fails on
  a new import, with the reason.
- A route handler that acts on an identifier from a form re-reads it in scope
  and answers **the same way** for "does not exist" and "not yours". A distinct
  message confirms the other firm's record exists.
- Refusals are logged: `recordAuditEvent` with `status: "denied"`.

## Testing a change

Every write path gets tested twice: once inside the firm that owns the record,
once with a **real identifier borrowed from the other firm**. That second case
is the whole test — a fabricated identifier proves nothing, because the failure
mode being guarded against is a genuine id used from the wrong place.

## Further reading

- `docs/decisions/ADR-0005-firm-scoping-in-three-layers.md` — why three.
- `docs/PRODUCTION_READINESS.md` — the honest gap: all three layers run inside
  the application, so they protect against a programming mistake, not a
  compromised process. Production needs row-level security.
