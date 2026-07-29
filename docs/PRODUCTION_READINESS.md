---
title: Production readiness
tags: [reference, security]
---

# Orchelio — Production readiness

**Orchelio Demo is a demonstration environment. It has not undergone a production security audit
and must not be used with real legal matters or confidential client data.**

This document lists the work required before Orchelio could responsibly hold a real client file.
It is written to be honest rather than reassuring: an unfinished item is marked unfinished.

Status legend: ⛔ not started · 🟡 partially addressed · ✅ done

---

## 1. Security

| Item | Status | Notes |
| ---- | ------ | ----- |
| Independent security audit and penetration test | ⛔ | Must precede any real use. |
| Threat model for a multi-tenant legal platform | ⛔ | Tenant crossing is the primary risk. |
| Server-side authorisation on every route and action | 🟡 | Enforced on every page and route handler that exists (`src/lib/auth/guards.ts`), including the settings and platform-administration screens, and asserted by hand-built POSTs in the browser suite. It has not been reviewed by anyone but its author. |
| Input validation on every write path | 🟡 | Every route handler re-validates its own form: sign-in, onboarding, matters, documents, approvals, communications, settings and firm creation. Validation is hand-written per route rather than schema-driven, so a new field is a new place to remember. |
| Upload restrictions: extension allow-list, size cap, content sniffing | 🟡 | Allow-list and size cap defined in `src/lib/constants.ts` and enforced on upload. No content sniffing and no malware scanning — and no file is ever stored, only its metadata. |
| Generic error messages that leak nothing | ✅ | `src/app/error.tsx`, `src/app/403/page.tsx`, `src/lib/system-status.ts`. A refusal never confirms a record exists. |
| Account enumeration resistance | ✅ | Identical message and comparable timing for an unknown address and a wrong password. |
| Secrets never reachable from the browser | ✅ | Enforced by `src/lib/env.ts` and `server-only`. |
| Password storage | ✅ | scrypt, per-password salt, constant-time comparison, self-describing cost parameters. |
| Session management, expiry, revocation | ✅ | Server-side sessions; only the token hash is stored; revalidated on every request. |
| CSRF protection on state-changing requests | ✅ | Two mechanisms, because there are two kinds of write. Server Actions are protected by Next's own origin check. The route handlers that answer consequential forms (`/api/onboarding`, `/api/firms/switch`) compare `Origin` against the request's `Host` themselves, and the session cookie is `SameSite=Lax`, which is the primary defence. Any new route handler must call `isSameOrigin` — see `src/lib/http/form-post.ts`. |
| Rate limiting and abuse protection | 🟡 | Sign-in throttling is in-memory and per-process: it resets on restart and is not shared across instances. Needs a shared store and per-IP limits. |
| Dependency advisories | 🟡 | `npm audit` reports advisories in transitive dependencies of Next.js itself (`sharp`, `postcss`). They cannot be resolved without downgrading Next.js to an unsupported release. Re-check on each Next.js update. |

## 2. Multi-tenant isolation

| Item | Status | Notes |
| ---- | ------ | ----- |
| `firmId` on every business resource | ✅ | Every firm-scoped model carries it, indexed. |
| Membership checked before any workspace page renders | ✅ | `requireFirmAccess` / `requirePermission`, with the refusal logged. |
| Scoped data-access functions only | ✅ | `src/lib/data` — the firm is a required argument, so omitting it is a compile error. |
| Query-level enforcement | ✅ | The Prisma client refuses any unscoped query on a firm-scoped model (`src/lib/data/firm-scope.ts`). Checks that a firm is *named*, not that it is named correctly — it defends against omission, not sabotage. |
| Active-firm selection cannot be forged | ✅ | The cookie can only select among existing memberships; a mismatch is ignored, and a forged form submission is refused and logged. |
| Automated cross-tenant access tests | ✅ | Integration tests against a real database with two firms holding deliberately similar records, plus browser tests. A third firm created through the interface is asserted to hold nothing belonging to the other two (`tests/integration/platform.test.ts`). |
| Database-enforced isolation (row-level security, separate schemas or databases) | ⛔ | **The most important remaining gap.** All three enforcement layers run inside the application, so they protect against a programming mistake — not against a compromised application process or a mistaken database administrator. |
| Separate document storage per firm | ⛔ | |
| Separate search index per firm | ⛔ | |
| Separate encryption keys per firm | ⛔ | |
| Separate credentials per firm | ⛔ | |

## 3. Authentication and identity

| Item | Status | Notes |
| ---- | ------ | ----- |
| Professional authentication (Auth.js, Clerk, Entra ID, Google Workspace, SSO) | ⛔ | The demo sign-in is for demonstration only, and its passwords are published in this repository. `src/lib/auth/session.ts` is the seam to replace. |
| Multi-factor authentication | ⛔ | Should be mandatory for attorneys and administrators. |
| Session expiry and revocation | ✅ | Eight-hour expiry, server-side revocation on sign-out. |
| Password policy, reset and lockout | ⛔ | None of the three exist. |
| User provisioning and invitation | ⛔ | A firm administrator can change a member's role or suspend them, but cannot invite anybody: an invitation is an email, and Orchelio has no transport. Creating a firm through the platform screen invents its first administrator with the published demonstration password; outside the demonstration build it refuses and requires an existing account. |
| Self-service firm creation | 🟡 | A platform administrator can create a firm through the interface. There is no billing, no quota, no approval step and no rate limit on it. |
| Least-privilege review of every role | 🟡 | The matrix is defined and unit-tested against the specification's exclusions; it has not been reviewed by a practising lawyer. |

## 4. Data protection

| Item | Status | Notes |
| ---- | ------ | ----- |
| Encryption at rest | ⛔ | |
| Encryption in transit (TLS everywhere) | ⛔ | Deployment concern. |
| Secret management (not `.env` files on disk) | ⛔ | |
| Backups, and *tested* restores | ⛔ | An untested backup is not a backup. |
| Retention and deletion policy | ⛔ | |
| Client data export | ⛔ | |
| Verified deletion on request | ⛔ | |

## 5. Operations

| Item | Status | Notes |
| ---- | ------ | ----- |
| Monitoring and alerting | ⛔ | |
| Structured application logging | 🟡 | Server-side logging exists; not structured or shipped. |
| Immutable audit log (append-only storage, not just application discipline) | 🟡 | `src/lib/audit.ts` exposes only a write path and nothing in the codebase updates or deletes an event — but a database administrator could. Needs write-once storage or an INSERT-only role. |
| Incident response plan | ⛔ | |
| Business continuity and disaster recovery plan | ⛔ | |
| Load testing | ⛔ | |
| Database migration and rollback procedure | 🟡 | Prisma migrations exist; no rollback drill. |

## 6. Artificial intelligence

| Item | Status | Notes |
| ---- | ------ | ----- |
| Prompt-injection testing (documents are untrusted input) | ⛔ | Mandatory before any real document reaches a model. The rule is stated in both prompts under `prompts/` and tested nowhere, because nothing is sent anywhere yet. |
| Output validation against the expected schema | 🟡 | The simulated provider fills the types directly, so nothing is parsed. A real provider must be given the schema as a tool definition and its result validated before storage. |
| Human approval before any consequential action | 🟡 | Delivered for the four actions this build raises. The effect is applied only by `decideApproval`, and locked rules ignore the firm's configuration entirely (see ADR-0014). Fourteen of the eighteen offered rules raise nothing yet — the approval centre says which. |
| Separation of duties: the requester may not decide | ⛔ | Nothing prevents the person who asked from being the person who approves. Acceptable for a demonstration with five accounts; not for a real file. |
| Provenance shown on every AI statement | ✅ | Every fact carries its sources and a support band; every analysis carries "AI-generated — a person must read this", and that no document was opened. The reviewer fails an analysis that has lost those cautions. |
| Model and prompt version recorded with each analysis | ✅ | `provider`, `model` and `promptVersion` on every `AIAnalysis` and `AIReview` row. |
| Real cost tracking and per-firm caps | ⛔ | Phase 8 simulates this. |
| Vendor agreement covering confidentiality and training exclusion | ⛔ | |

## 7. Legal and professional

| Item | Status | Notes |
| ---- | ------ | ----- |
| Privacy policy | ⛔ | |
| Terms of service | ⛔ | |
| Data processing agreements with every sub-processor | ⛔ | |
| Professional responsibility review (confidentiality, competence, supervision of AI output, unauthorised practice of law) | ⛔ | Jurisdiction by jurisdiction. |
| Ethics review of the AI features | ⛔ | |
| Professional liability insurance covering the tool | ⛔ | |
| Conflict-of-interest handling | ⛔ | The demo does not implement conflict checking. |

## 8. People

| Item | Status | Notes |
| ---- | ------ | ----- |
| User training, including what the AI must not be trusted to do | ⛔ | |
| Administrator runbook | ⛔ | |
| Support and escalation path | ⛔ | |

---

## 9. Accessibility

| Item | Status | Notes |
| ---- | ------ | ----- |
| Automated audit on every principal page | ✅ | axe-core against WCAG 2.1 A and AA plus best-practice, in **both** themes, in `tests/e2e/accessibility.spec.ts`. Runs in CI. No violation on any page. |
| Keyboard operation | 🟡 | The skip link moves focus, focus is visible on every element it lands on, and sign-in completes by keyboard alone — all asserted. Not every screen has been walked end to end by hand. |
| Contrast | ✅ | Every text token measured against every surface in both palettes. `--color-ink-subtle` was 3.18:1 and is now above 4.5:1 everywhere. |
| Landmarks, headings and announcements | ✅ | One `<main>` and one `<h1>` per page, the demonstration banner is a named region rather than an alert, refusals use `role="alert"`, the open tab carries `aria-current`. |
| Tested with a real screen reader | ⛔ | **Not done.** Automated rules detect roughly a third of WCAG, and not the hard third. |
| Tested by a keyboard-only user or a user with a disability | ⛔ | **Not done.** This is the gap that matters most in this section. |
| Formal WCAG 2.1 AA conformance statement | ⛔ | Would require the two rows above first. Orchelio claims no conformance level. |
| Reduced motion, text resizing, zoom to 200% | 🟡 | `prefers-reduced-motion` is respected; resizing and zoom have not been tested. |

## Also not done, and worth naming

| Item | Status | Notes |
| ---- | ------ | ----- |
| Workflow editing by a firm | ⛔ | A firm's workflows follow from its practice area. Changing what one contains is an edit to the seed, for every firm at once. |
| Any outbound integration | ⛔ | Deliberate and structural: Orchelio has no transport. Adding one reopens every question in sections 1, 4 and 7. |
| Invitation or self-service user creation | ⛔ | An invitation is an email. See section 3. |
| Internationalisation | ⛔ | The interface is English only. The configuration carries a `language` field that nothing reads. |

## The short version

Orchelio Demo demonstrates a product idea, and all nine of its build phases are delivered. It has
sign-in, roles, server-side access control and firm isolation enforced in three layers and proved
by tests; every acceptance criterion is mapped to named tests that are checked rather than
asserted; and every principal page passes an automated accessibility audit in both themes. Those
parts are built the way a real system would build them.

But the passwords are published, there is no multi-factor authentication, isolation is enforced by
the application rather than by the database, no real AI call is made, nobody who uses a screen
reader has tried it, and none of it has been audited by anybody but its author.

Treat every screen as a demonstration of intent, and keep real client information out of it.
