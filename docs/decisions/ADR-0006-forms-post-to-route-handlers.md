---
adr: 6
title: Consequential forms POST to a route handler, not a Server Action
status: accepted
phase: 3
tags: [decision, next-js, correctness]
---

# ADR-0006 — Consequential forms POST to a route handler, not a Server Action

## Context

Server Actions are the idiomatic way to submit a form in the Next.js App Router,
and Orchelio used them for switching firm and for the onboarding questionnaire.

Twice, the same class of failure appeared, and both times it was found by a test
that passed on retry rather than by anyone noticing:

**Switching firm showed the previous firm.** About half the time, clicking a
firm in the switcher left the browser displaying the dashboard of the firm the
user had just left. Instrumenting the scenario rather than guessing showed the
cookie was written correctly and a reload rendered the right firm — the render
returned *inside the action's own response* was the stale one.

**Confirming the onboarding configuration navigated nowhere.** The server
completed the work and issued the redirect — the response header said
`x-action-redirect: /dashboard?configured=1` — and the client router discarded
it. The cause was `revalidatePath("/", "layout")` inside an action that then
redirects across routes.

In both cases the server was right and the browser was wrong. That is the worst
combination available: nothing looks broken, so nobody investigates. And in a
product whose entire promise is that firms do not mix, showing a user the wrong
firm's dashboard is not a cosmetic staleness bug.

## Decision

Consequential forms — switching firm, saving an onboarding step, confirming a
configuration — are plain form POSTs to route handlers that answer with an HTTP
303. The shared helpers are in `src/lib/http/form-post.ts`.

A 303 has no ambiguity: the browser applies the response, then issues a fresh
GET which renders from the state the response established.

Two rules follow, both paid for:

- **Never `revalidatePath("/", "layout")` in an action that redirects across
  routes.** Invalidate the narrowest set of routes whose content actually
  changed.
- **Never build a redirect URL from `request.url`.** Next reconstructs it and
  the host can differ from the one the browser used — `localhost` where the
  browser said `127.0.0.1` — which silently drops host-scoped cookies and lands
  the user signed out. Use a relative `Location`, and compare `Origin` against
  the request's own `Host` header.

## Consequences

- Twelve consecutive runs of the switcher scenario were correct, then three full
  browser suites with retries disabled.
- These forms work with JavaScript disabled.
- There is no cache to invalidate on these paths, because a real navigation
  refetches.
- Orchelio departs from the framework's idiom here. The reasoning lives in
  `src/lib/http/form-post.ts` so the next person does not "fix" it back.
- Server Actions remain fine for submissions that do not redirect across routes.

## See also

- [Architecture §4ter — Forms that change something](../ARCHITECTURE.md)
- [ADR-0007 — One question, two answers](ADR-0007-practice-area-vocabulary.md)
