# ADR-0016 — Destructive demonstration controls are commands, not buttons

**Status:** accepted · **Phase:** 8

## Context

Phase 8 asks for "demo management" on the platform administration screens. The
obvious reading is a page with two buttons: *Reset demonstration data* and
*Re-seed*. Every demonstration product has them, and they are genuinely useful —
somebody who has been clicking around for twenty minutes wants the firm back
the way it started.

Three things make that the wrong shape here.

The first is one of the nine locked approval rules: **nothing is ever
permanently deleted without a person**. A reset button is permanent deletion of
every matter, document, analysis, approval and log entry on the instance. It
would be the single most destructive action in the product, offered with less
ceremony than approving a draft email.

The second is who would be pressing it. A platform administrator holds no
membership of any firm, by design, and cannot open a single matter. Giving that
role a control that erases every firm's data — data it is not allowed to
*read* — inverts the boundary the whole architecture is built around.

The third is that `npm run reset-demo` is not scoped to a firm. It erases the
instance. A button on a per-firm screen would look like it erased that firm.

## Decision

**Additive demonstration controls are offered in the interface. Destructive
ones are not.**

- *Add sample matters* lives in the firm's **own** settings, under
  Demonstration, behind `firm.settings.edit`. It adds the same fictional
  matters the seed writes, to the firm the caller is signed into. A matter whose
  reference already exists is skipped, so pressing it twice adds nothing the
  second time and destroys nothing either.
- *Erasing* has no button anywhere. Both the firm's settings and
  `/admin/demo` name the command — `npm run reset-demo` — and say plainly what
  it does: erases every firm on this instance, cannot be undone.

The platform administration screen is therefore read-only: an inventory of what
each firm holds, in counts, with no control that changes anything.

## Consequences

- Resetting the demonstration requires terminal access. For a product whose
  whole premise is that it runs locally at no cost, that is not a real
  obstacle — and it is deliberately a higher bar than a click.
- The browser tests assert the absence: `tests/e2e/settings.spec.ts` and
  `tests/e2e/admin.spec.ts` both check that no button matching
  `/delete|erase|reset|wipe/i` exists on those pages. A future well-meaning
  addition fails a test rather than shipping.
- Demonstration data accumulates. A firm created by the browser suite stays
  until somebody resets. That is visible in the firm list and is the price of
  the rule.
- `addSampleMatters` cannot use the seed's approach of replacing its fixtures
  wholesale. The seed owns its rows; this function runs after people have been
  using the firm, so it may only add.

## See also

- [ADR-0008 — Locked approvals are stored](ADR-0008-locked-approvals-are-stored.md)
- [ADR-0009 — A dash, not a zero](ADR-0009-a-dash-not-a-zero.md)
