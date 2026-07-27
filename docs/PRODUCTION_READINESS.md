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
| Server-side authorisation on every route and action | 🟡 | Enforced on every page that exists (`src/lib/auth/guards.ts`); the boundary must be re-verified as matters, documents and AI screens are added. |
| Input validation on every write path | 🟡 | The sign-in action validates and normalises; matter and document writes arrive in Phase 5. |
| Upload restrictions: extension allow-list, size cap, content sniffing | 🟡 | Allow-list and size cap defined in `src/lib/constants.ts`; enforcement lands with uploads in Phase 5. Real malware scanning is additional. |
| Generic error messages that leak nothing | ✅ | `src/app/error.tsx`, `src/app/403/page.tsx`, `src/lib/system-status.ts`. A refusal never confirms a record exists. |
| Account enumeration resistance | ✅ | Identical message and comparable timing for an unknown address and a wrong password. |
| Secrets never reachable from the browser | ✅ | Enforced by `src/lib/env.ts` and `server-only`. |
| Password storage | ✅ | scrypt, per-password salt, constant-time comparison, self-describing cost parameters. |
| Session management, expiry, revocation | ✅ | Server-side sessions; only the token hash is stored; revalidated on every request. |
| CSRF protection on state-changing requests | ✅ | All writes go through Server Actions, which Next.js protects with an origin check. Re-verify if any raw route handler is added. |
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
| Automated cross-tenant access tests | ✅ | 40 integration tests against a real database with two firms holding deliberately similar records, plus 7 browser tests. |
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
| Prompt-injection testing (documents are untrusted input) | ⛔ | Mandatory before any real document reaches a model. |
| Output validation against the expected schema | ⛔ | Phase 6. |
| Human approval before any consequential action | ⛔ | Phase 7. Locked rules must be server-enforced. |
| Provenance shown on every AI statement | ⛔ | Phase 6: "AI-generated — Human review required". |
| Model and prompt version recorded with each analysis | ⛔ | Needed to explain a past output. |
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

## The short version

Orchelio Demo demonstrates a product idea. It now has sign-in, roles, server-side access control
and firm isolation enforced in three layers and proved by tests, and those are built the way a
real system would build them — but the passwords are published, there is no multi-factor
authentication, isolation is enforced by the application rather than by the database, no real AI
call is made, and none of it has been audited.

Treat every screen as a demonstration of intent, and keep real client information out of it.
