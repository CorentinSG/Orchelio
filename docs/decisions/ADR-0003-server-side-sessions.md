---
adr: 3
title: Server-side sessions, with only the token hash stored
status: accepted
phase: 2
tags: [decision, authentication, security]
---

# ADR-0003 — Server-side sessions, with only the token hash stored

## Context

The demonstration needs sign-in to show roles and access control. A signed
stateless cookie would have been the smaller thing to build, but it cannot be
revoked: signing out would clear the browser's copy and leave the credential
valid until it expired.

## Decision

Sessions are server-side records. The cookie carries 256 bits of randomness; the
database stores only its SHA-256 hash. Every request revalidates against the
database.

Passwords use scrypt from the Node.js standard library — memory-hard, no
dependency — with a per-password salt, constant-time comparison, and
self-describing cost parameters so the cost can be raised later without
invalidating existing hashes.

## Consequences

- Sign-out is real, and a revoked session stops working immediately rather than
  at the cookie's own expiry.
- A database leak yields no usable session, and there is no signing secret to
  manage or rotate.
- An unknown email address still runs a verification against a dummy hash and
  receives an identical message, so the form cannot be used to enumerate
  accounts. The dummy hash is asserted unusable in
  `tests/unit/password.test.ts` — otherwise it would be a master password.
- `src/lib/auth/session.ts` is the seam a real identity provider replaces:
  Auth.js, Clerk, Entra ID or SSO reimplement `currentSession()` and nothing
  above it changes.
- **Stated limitation:** the demonstration passwords are published in this
  repository, there is no multi-factor authentication, no reset and no lockout.
  This demonstrates roles; it is not a production authentication system.

## See also

- [Architecture §3bis — Authentication and access control](../ARCHITECTURE.md)
- [Production readiness §3](../PRODUCTION_READINESS.md)
