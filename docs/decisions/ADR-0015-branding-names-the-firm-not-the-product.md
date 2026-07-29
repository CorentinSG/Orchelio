# ADR-0015 — Branding names the firm, not the product

**Status:** accepted · **Phase:** 8

## Context

`FirmConfiguration.branding` was written in Phase 2 with the comment "display
name, logo and theme overrides". Phase 8 had to decide what that actually
means, and the range is wide. At one end, a firm sets a shorter display name
for its own sidebar. At the other, Orchelio is white-labelled: the firm's logo,
the firm's colours, the firm's name on every screen, and no visible sign of
whose software it is.

The specification asks for "branding" without saying which. Two other rules
already in force point in opposite directions if read carelessly:

- the product is named Orchelio everywhere, and a unit test fails if a generic
  name appears in a user-visible surface;
- a firm's Orchelio is meant to be *its own* — the whole product is the claim
  that one codebase serves firms that see different things.

There is also a practical problem hiding inside the pleasant-sounding version.
A colour a firm chooses ends up in a `style` attribute, and an arbitrary colour
can fail contrast against the text placed on it — in one theme while passing in
the other, which is the version nobody catches.

## Decision

**A firm brands itself inside Orchelio. It does not brand Orchelio.**

Concretely, a firm may set:

- a **display name**, used where its own name appears — the sidebar, its
  workspace. Bounded at 80 characters and defaulting to the firm's real name;
- an **accent colour**, chosen from a fixed palette of five.

A firm may not change the product name, remove or reword the demonstration
banner, replace the wordmark, or restyle the interface. The branding tab says
this on the page, in those words, rather than leaving a reader to discover the
limit by trying.

The accent is a **palette, not a colour picker**. Each entry carries a light and
a dark value chosen so that text stays legible on both; `parseBranding` turns
anything outside the palette into the default rather than passing it through to
a `style` attribute. `tests/unit/settings-config.test.ts` sends it
`"red; background: url(javascript:alert(1))"` and asserts it comes back as
`default`.

## Consequences

- The product looks less configurable than a white-label would. That is the
  correct appearance: Orchelio is not white-label software, and a screen
  presenting itself as the firm's own would be claiming something untrue about
  who wrote it.
- A firm cannot express its exact brand colour. Five options is a real
  limitation and is stated on the page.
- The wordmark and the firm mark are visibly different things: the product's
  name is drawn from `src/lib/app-config.ts` as it always was, and the firm's
  accent appears next to the *firm's* name, one line below. A reader can always
  tell which is which.
- `parseBranding` is the boundary where a free-form JSON column stops being
  arbitrary. Anything reading `branding` goes through it.

## See also

- [ADR-0001 — One place for the product name](ADR-0001-one-place-for-the-product-name.md)
- [ADR-0002 — Strings not enums, text not JSON](ADR-0002-strings-not-enums-text-not-json.md)
