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
| Server-side authorisation on every route and action | 🟡 | Layering exists; enforcement is Phase 2–3. |
| Input validation on every write path | ⛔ | Phase 5. |
| Upload restrictions: extension allow-list, size cap, content sniffing | ⛔ | Phase 5. Real malware scanning is additional. |
| Generic error messages that leak nothing | ✅ | `src/app/error.tsx`, `src/lib/system-status.ts`. |
| Secrets never reachable from the browser | ✅ | Enforced by `src/lib/env.ts` and `server-only`. |
| CSRF protection on state-changing requests | ⛔ | Phase 2, alongside sessions. |
| Rate limiting and abuse protection | ⛔ | |
| Dependency advisories | 🟡 | `npm audit` reports advisories in transitive dependencies of Next.js itself (`sharp`, `postcss`). They cannot be resolved without downgrading Next.js to an unsupported release. Re-check on each Next.js update. |

## 2. Multi-tenant isolation

| Item | Status | Notes |
| ---- | ------ | ----- |
| `firmId` on every business resource | 🟡 | `Firm` exists; the rest arrives Phase 2–3. |
| Scoped data-access functions only | ⛔ | Phase 3. |
| Automated cross-tenant access tests | ⛔ | Phase 3. |
| Database-enforced isolation (row-level security, separate schemas or databases) | ⛔ | The demo relies on application-level scoping alone — the weakest option. |
| Separate document storage per firm | ⛔ | |
| Separate search index per firm | ⛔ | |
| Separate encryption keys per firm | ⛔ | |
| Separate credentials per firm | ⛔ | |

## 3. Authentication and identity

| Item | Status | Notes |
| ---- | ------ | ----- |
| Professional authentication (Auth.js, Clerk, Entra ID, Google Workspace, SSO) | ⛔ | The demo sign-in is for demonstration only. |
| Multi-factor authentication | ⛔ | Should be mandatory for attorneys and administrators. |
| Session management, expiry, revocation | ⛔ | |
| Password policy, or no passwords at all | ⛔ | |
| Least-privilege review of every role | ⛔ | |

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
| Immutable audit log (append-only storage, not just application discipline) | ⛔ | Phase 7 delivers application-level append-only. |
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

Orchelio Demo demonstrates a product idea. It is not a secure system, it does not enforce tenant
isolation yet, it has no authentication, it makes no real AI calls, and it has never been audited.
Treat every screen as a demonstration of intent, and keep real client information out of it.
