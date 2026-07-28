# ADR-0011 — Loading boundaries are placed per segment, not at the root

**Status:** accepted · **Phase:** 5

## Context

The specification asks for a branded loading screen, so Phase 1 added
`src/app/loading.tsx`. In the App Router a `loading.tsx` is a Suspense
boundary, and a boundary above a page changes when the response begins: Next
sends the headers as soon as it can render the fallback, before the page's own
code has run.

Phase 5 introduced the first page that answers `notFound()` — a matter record,
which must refuse an identifier belonging to another firm. The refusal rendered
correctly and said "Page not found", but the response carried status **200**.

## What was measured

The same request, run with and without the root `loading.tsx`, for two kinds of
identifier: one that exists in another firm, and one that exists nowhere.

| Configuration | Another firm's matter | A matter that does not exist |
| ------------- | --------------------- | ---------------------------- |
| root `loading.tsx` | 200 | 200 |
| no root `loading.tsx` | 404 | 404 |

Three repetitions each, all identical.

Two things follow. First, isolation never depended on this: the two cases
answered the same way in both configurations, so the status code was not an
oracle telling an attacker that a matter exists somewhere. Second, the status
code was nonetheless wrong — "Page not found" served as a success is the kind
of thing that looks right in a browser and is wrong to everything else.

## Decision

The root `loading.tsx` is removed. The screen itself stays, as
`src/components/loading-screen.tsx`, and is re-exported as a `loading.tsx` in
the segments where a wait is plausible and no page needs to answer 404:

- `/dashboard`
- `/onboarding`
- `/admin/firms`
- `/login`

Deliberately **not** under `/matters`, because `/matters/[id]` must be able to
refuse with a 404.

## Consequences

- A refusal now answers 404 in its status as well as its words.
- Navigation between workspace pages keeps the previous page on screen until
  the next is ready, rather than flashing a full-page loading screen. On this
  application — every page dynamic, every query against a local SQLite file —
  that is the better behaviour anyway.
- Adding a `loading.tsx` above a page that calls `notFound()` would silently
  reintroduce the 200. `tests/e2e/matters.spec.ts` asserts the 404, so it would
  fail rather than pass quietly.

## Alternatives considered

**Keep the root boundary and accept 200.** Rejected: the status is part of the
answer, and a monitoring check or a script reading only the status would
conclude the page was fine.

**Drop the loading screen entirely.** Rejected: the specification asks for it,
and it is genuinely useful on a cold first load.
