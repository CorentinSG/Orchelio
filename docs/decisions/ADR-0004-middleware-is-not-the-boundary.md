---
adr: 4
title: Middleware is not the security boundary
status: accepted
phase: 2
tags: [decision, security, next-js]
---

# ADR-0004 — Middleware is not the security boundary

## Context

Next.js middleware is the obvious place to put an access check: one file, one
matcher, every protected route covered. It is also the wrong place.

A middleware protects the URLs its matcher happens to list. Add a route, forget
the matcher, and the protection disappears silently — the new page simply works
for everyone. A boundary that depends on two lists staying in sync is not a
boundary.

## Decision

Access control runs **inside the page or action that does the work**, through
the guards in `src/lib/auth/guards.ts`.

`src/middleware.ts` exists and is deliberately not a control. It checks only
whether a session cookie is *present* — which proves nothing, since the cookie
may be expired, revoked or invented — so that a signed-out visitor who asks for
`/dashboard` is returned there after signing in. A layout cannot do this,
because it does not know the requested path.

The file says so at the top, in the hope that nobody promotes it later.

## Consequences

- Deleting the middleware would cost a little polish and no safety at all.
- Every protected page carries one line of its own guard. That is the cost, and
  it is the right cost: the check is visible where the work happens.
- Browser tests assert that a signed-out request for a protected page never
  receives workspace content — not merely that it redirects.
- Every refusal is recorded before the redirect, so an attempt to reach another
  firm's data appears in that firm's activity log.

## See also

- [Architecture §3bis — Where enforcement lives](../ARCHITECTURE.md)
- [ADR-0005 — Firm scoping is enforced in three layers](ADR-0005-firm-scoping-in-three-layers.md)
