---
title: Architecture
tags: [reference, architecture]
---

# Orchelio — Architecture

This document describes how Orchelio is put together and how to extend it. It is written to stay
useful as the product grows through its nine phases; sections describing work that has not landed
yet are marked accordingly.

---

## 1. The central idea

Orchelio is **one application, one codebase, many firms**.

A firm does not receive a copy of the software. It receives a *configuration*: a record that says
which practice areas it works in, which matter types it handles, which workflow steps it uses,
which AI features are enabled, which actions require a human approval, and what vocabulary its
interface uses.

Every screen reads that configuration and assembles itself from pre-built modules.

```
                    ┌──────────────────────────────┐
                    │      Orchelio codebase       │
                    │  (screens, workflows, AI,    │
                    │   approvals, audit, costs)   │
                    └───────────────┬──────────────┘
                                    │ reads
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
    ┌─────────▼────────┐  ┌─────────▼────────┐  ┌─────────▼────────┐
    │  Firm A config   │  │  Firm B config   │  │  Firm C config   │
    │  immigration     │  │  employment      │  │  (created via    │
    │  + its own data  │  │  + its own data  │  │   onboarding)    │
    └──────────────────┘  └──────────────────┘  └──────────────────┘
```

Consequences that the code must respect:

- The onboarding questionnaire **writes configuration**. It never generates code, never duplicates
  the application and never requires a developer.
- Adding a firm is a runtime operation, not a deployment.
- Adding a practice area means adding a *template* — data — not a fork.

---

## 2. Layers

```
  Browser
    │
    │  HTML rendered on the server; no database credentials, no API keys
    ▼
  src/app/**            Pages and layouts (Next.js App Router, React Server Components)
    │
    ▼
  src/components/**     Presentation only. No database access, no secrets.
    │
    ▼
  src/lib/**            Configuration, access rules, data access, AI provider (Phase 6)
    │
    ▼
  Prisma Client         Generated from prisma/schema.prisma
    │
    ▼
  SQLite (demo) / PostgreSQL (later)
```

Two rules keep the layers honest:

1. **`src/lib/prisma.ts` and `src/lib/system-status.ts` import `server-only`.** If either is ever
   pulled into a client component, the build fails rather than shipping database access to the
   browser.
2. **Only `src/lib/env.ts` reads `process.env`** for server configuration. `src/lib/app-config.ts`
   holds the public identity values and reads only `NEXT_PUBLIC_*`. Nothing else touches the
   environment, so the list of required variables stays discoverable and secrets cannot drift into
   client code.

---

## 3. Naming and identity

The product name appears in a single module, `src/lib/app-config.ts`, and everything else imports
from it: page metadata, the sidebar, the login page, the loading screen, the error screen, the
footer signature and the demonstration warnings.

A unit test (`tests/unit/app-identity.test.ts`) fails the build if the name drifts or if a generic
name such as "Legal AI Platform" ever appears in those surfaces.

---

## 3bis. Authentication and access control

> Status: delivered in Phase 2.

### The seam

Every screen asks for its caller through a guard in `src/lib/auth/guards.ts`. Nothing reads a
cookie directly, and nothing trusts an identifier taken from a URL. Replacing the demonstration
sign-in with Auth.js, Clerk, Microsoft Entra ID, Google Workspace or SSO means reimplementing
`currentSession()` in `src/lib/auth/session.ts` — no page changes.

### Sessions

Server-side and revocable. The cookie carries 256 bits of randomness; the database stores only its
SHA-256 hash, so a database leak yields no usable session and there is no signing secret to
manage. Every request revalidates against the database, so a revoked session stops working
immediately rather than at the cookie's own expiry. The cookie is `httpOnly`, `SameSite=Lax`, and
`Secure` outside development.

### Passwords

scrypt from the Node.js standard library, with a per-password salt and self-describing cost
parameters, so the cost can be raised later without invalidating existing hashes. Comparison is
constant-time. An unknown email address still runs a verification against a dummy hash, so
response timing does not reveal which accounts exist — and the failure message is identical either
way, so the form cannot be used to enumerate accounts.

### Where enforcement lives

**In the page or action that does the work.** There is a `src/middleware.ts`, and it is
deliberately *not* the security boundary: it only checks whether a session cookie is present, so
that a signed-out visitor is returned to where they were going after signing in. A boundary that
depends on a URL matcher staying in sync with the routes is not a boundary — add a route, forget
the matcher, and the protection silently disappears. Deleting the middleware would cost polish and
no safety.

### Roles

Four firm roles — Firm Administrator, Attorney, Paralegal, Read-only Reviewer — plus the platform
role held on the user, not on a membership. Screens ask `can(actor, permission)`, never
"is this an attorney?", so adding a role later does not mean hunting down scattered role checks.

The exclusions from the specification are asserted directly in
`tests/unit/permissions.test.ts`: a paralegal cannot approve an analysis, confirm a deadline,
close a matter or draft a communication; a read-only reviewer holds nothing but `.view`
permissions; and a platform administrator cannot read matter or document content.

### Refusals are events

Every refusal — no membership, missing permission, not a platform administrator — is written to
the activity log before the user is redirected. An attempt to reach another firm's data is exactly
what a firm would want to see in its log. The message shown is identical in every case, so a
refusal never confirms that a record exists.

---

## 4. Multi-tenancy

> Status: enforced and tested as of Phase 3.

### 4.1 The rule

Every business resource carries a `firmId`. Every read is scoped by it. There is no exception.

```ts
// Correct — the firm is part of the question.
getMatter({ matterId, firmId });

// Forbidden — this can return another firm's matter.
getMatter(matterId);
```

This applies to memberships, configurations, client profiles, matters, intake responses,
documents, firm workflows, workflow runs and steps, analyses, reviews, approvals, tasks, draft
communications, usage records and audit events.

Copying a URL from one firm's session into another firm's session produces a refusal, not a
result, and the refusal itself is an audit event.

### 4.2 Three layers, not one

A convention is not a control. The rule is enforced three times over, because the cost of one
missed `where` clause is a firm reading another firm's client file.

**Layer 1 — the type system.** Every function in `src/lib/data` takes a `FirmScope` as its first
argument. Forgetting the firm is not a subtle bug; it is a compile error.

**Layer 2 — the database client.** `src/lib/data/firm-scope.ts` wraps Prisma so that every
operation on a firm-scoped model is inspected before it runs. One that does not name a firm throws
`FirmScopeError` instead of returning rows. The guard is applied once, to the application's single
client, and no unguarded client is exported from anywhere — opting out would have to be a visible
change to `src/lib/prisma.ts`.

The subtlety worth knowing is how boolean combinators are treated, because getting it backwards is
itself a leak:

| Combinator | Rule | Why |
| ---------- | ---- | --- |
| `AND` | one branch naming the firm is enough | every condition must hold |
| `OR` | **every** branch must name the firm | any branch may match on its own — `OR: [{ firmId }, { status: "active" }]` returns every active matter in the database |
| `NOT` | never counts | a negated firm is the opposite of a scope |

**Layer 3 — the guards.** `requireFirmAccess` and `requirePermission` check the caller's
membership before a page renders, and log the refusal when there is none.

Stated limitation: layer 2 checks that a firm is *named*, not that it is named *correctly*. A
deliberately perverse query would still pass. It defends against omission — the realistic
mistake — not against sabotage.

### 4.3 The active firm

A user may belong to several firms. Which one is open is remembered in a cookie, and that cookie is
**a preference, not a credential**: `resolveActiveFirm` can only select among the firms the user's
memberships already permit. Editing it to another firm's identifier selects nothing and silently
falls back. The same check runs when the switcher is submitted, and a mismatch is refused and
logged.

Switching is a plain form POST answered with an HTTP 303, not a Server Action. That is deliberate
and the reason is measured: the render returned inside a Server Action's response did not reliably
reflect the cookie the action had just written, so roughly half the time the browser displayed the
*previous* firm's dashboard. The server state was always correct — a reload fixed it — but showing
a user the wrong firm's screen is the one failure this product cannot have. A 303 makes the browser
store the cookie and then issue a fresh GET. Boring, and correct every time.

### 4.3bis The one module allowed to look across firms

Platform administration is cross-tenant by nature: a firm list, an instance
count, the creation of a firm that does not exist yet. Rather than let those
queries appear wherever a screen needs one, they live in
`src/lib/data/platform.ts` — so what can see across tenants is **one file to
audit** rather than a habit spread through administration pages.

Two rules hold inside it.

Nothing it returns names a matter, a client or a document. A platform
administrator operates the platform; that does not include reading a firm's
client files, and the way to keep that true is for the query never to ask.
`tests/integration/platform.test.ts` serialises its output and asserts that no
client name, matter title or document filename appears.

Instance totals are **summed from each firm's own `_count`**, not read with a
cross-firm query. The scoping guard refuses `prisma.matter.count()` with no
firm, and the obvious way to satisfy it — a filter matching every firm — would
be a query that *looks* scoped and is not. A bypass a reader cannot see is worse
than an awkward count, so the count is awkward.

### 4.4 Demo isolation vs production isolation

The demonstration uses a **shared database with a `firmId` column**. That is a legitimate
multi-tenant pattern and it is enough to demonstrate the product, but it is the weakest of the
available options: everything above runs inside the application, so it protects against a
programming mistake, not against a compromised application process or a mistaken database
administrator.

Before production, isolation must be strengthened. Options, from lightest to strongest:

| Level | Mechanism | Notes |
| ----- | --------- | ----- |
| 1 | `firmId` column + scoped data-access functions + the client-level guard | Where the demo stops. |
| 2 | Row-level security in PostgreSQL | Enforced by the database, not by the application. |
| 3 | One schema per firm | Stronger blast-radius containment. |
| 4 | One database per firm | Separate credentials, separate backups. |
| 5 | Separate document storage, search index and encryption keys per firm | Required for privileged material. |

See [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).

---

## 4bis. Configuration, and why one question has two answers

> Status: delivered in Phase 4.

The onboarding questionnaire writes a `FirmConfiguration`. That record — not the code — is what
makes one firm's Orchelio different from another's. It decides the matter types, the workflow, the
AI features, the approval rules, the dashboard and the vocabulary.

### Practice-area vocabulary

The specification promises that a firm's configuration determines "the vocabulary used". Orchelio
implements that literally: a catalogue entry may carry a per-practice-area key.

| The question asked | Immigration firm stores | Employment firm stores |
| ------------------ | ----------------------- | ---------------------- |
| Initial consultation | `consultation_preparation` | `employment_case_assessment` |
| Document collection | `document_collection` | `evidence_collection` |
| Create a factual timeline | `timeline` | `employment_timeline` |

Two firms answer the same question identically and receive different configurations, because the
same step means something different in each practice area. This is also what makes the two
configurations published in the specification reproducible from one questionnaire — see
`docs/ROADMAP.md`, Phase 4, for the inconsistency this resolves.

The mapping is one-to-one within a practice area, which is what lets a saved draft re-tick the
right boxes. Keep it that way.

### Locked rules live in the data

Nine approval rules cannot be switched off. They are rendered with a padlock, submitted by
nothing, and written in by the server whatever the browser sent — so tampering with the form
achieves nothing. They are also *stored* with the configuration rather than assumed, so the
guarantee is auditable in the database rather than asserted in a comment.

### Dashboard composition

`src/lib/dashboard/widgets.ts` declares which widgets belong to which practice area and which AI
feature each depends on. A firm that switched off "identify missing documents" does not see a card
counting missing documents — an empty card at a firm that never asked the question is not
information, it is noise that reads like reassurance. For the same reason a widget whose data
arrives in a later phase shows a dash, not a zero: a zero is a claim.

---

## 4ter. Forms that change something

Orchelio submits its consequential forms — switching firm, saving an onboarding step, confirming a
configuration — as plain POSTs to route handlers that answer with an HTTP 303, not as Server
Actions. `src/lib/http/form-post.ts` holds the two helpers and the full reasoning.

The short version: a Server Action re-renders the redirect target inside its own response, and
twice during this build that render did not reflect what the action had just done — the firm
switcher showed the previous firm about half the time, and confirming the configuration navigated
nowhere at all. In both cases the server was right and the browser was wrong, which is the worst
combination, because nothing looks broken. A 303 has no such ambiguity.

Two consequences worth knowing:

- Those forms work with JavaScript disabled.
- The cross-site check compares `Origin` against the request's own `Host` header, never against
  `request.url` — Next reconstructs that URL and it does not always carry the host the browser
  used. Redirect targets are relative for the same reason: an absolute redirect built from
  `request.url` once sent the browser to a different host and silently dropped the session cookie.

---

## 5. The AI layer

> Status: delivered in Phase 6. `src/lib/ai/` holds the types, the interface, the simulation and
> the runner; every screen reads the interface and none of them knows which implementation answered.

```ts
interface AIProvider {
  readonly name: AiProviderName;
  readonly model: string;
  readonly promptVersion: string;
  /** True when no real model is involved. Screens say so when it is. */
  readonly simulated: boolean;

  analyseMatter(input: MatterAnalysisInput): Promise<MatterAnalysisResult>;
  reviewAnalysis(input: AnalysisReviewInput): Promise<AnalysisReviewResult>;
}
```

Two roles, one interface:

- **Claude Analyst** extracts facts, builds a timeline, lists missing documents, flags
  contradictions and prepares questions. It never states a legal conclusion.
- **Claude Reviewer** independently checks the Analyst's output for unsupported statements, missed
  contradictions, premature legal conclusions and insufficient information. It never approves a
  legal conclusion; it requires human review.

Implementations:

| Implementation | Status | Behaviour |
| -------------- | ------ | --------- |
| `MockAIProvider` | Delivered | Deterministic rules over each matter's fields, intake answers and document *names*. No network call. |
| `AnthropicAIProvider` | Prepared, not implemented | Would call the Anthropic API, server-side only. Selecting it throws with the reason. |

`MockAIProvider` derives its output rather than looking it up — see
[ADR-0012](decisions/ADR-0012-the-simulation-derives-rather-than-looks-up.md) for why, and for
what that forced the confidence model to admit. **It never opens a document**: there is no upload
and no OCR, so every fact sourced to a document comes from that document's name and kind, and
every analysis carries that as a standing warning.

An analysis has no field for a conclusion, a recommendation, an eligibility finding or advice —
absent from the type, not merely left empty. See
[ADR-0013](decisions/ADR-0013-a-conclusion-has-nowhere-to-live.md).

Selection is by environment variable only:

```
AI_PROVIDER=mock        # today
AI_PROVIDER=anthropic   # later, and only with ANTHROPIC_API_KEY set server-side
```

`src/lib/env.ts` already enforces the safety rule: selecting `anthropic` without a key throws at
startup instead of silently falling back to the mock. That matters — a silent fallback would let
a firm believe it was getting a real analysis when it was not.

Three constraints hold regardless of provider:

1. **The key never reaches the browser.** It is not prefixed `NEXT_PUBLIC_`; all calls run on the
   server.
2. **Uploaded documents are evidence, not instructions.** Prompts must instruct the model to
   ignore any instruction found inside a document (prompt-injection defence).
3. **No output is ever final.** Every AI result carries "AI-generated — Human review required"
   until an attorney approves it.

---

## 6. Human approvals

> Status: Phase 7.

Some approval rules are configurable by the firm. Others are **locked** and cannot be switched off
from any screen:

- no automatic filing;
- no legal advice sent automatically;
- no permanent deletion;
- no final deadline without human confirmation;
- no real external transmission;
- no final conclusion on eligibility or entitlement;
- no automatic conflict clearance;
- no settlement proposal sent automatically;
- no communication with opposing counsel without approval.

Locked rules render with a padlock in the settings screen and are enforced server-side, not in the
browser.

---

## 7. Data model

> Status: complete as of Phase 2. The screens that use most of it arrive later, but the model is
> defined once, up front, so those phases add behaviour rather than reshaping the database.

`User`, `Session`, `Firm`, `FirmMembership`, `FirmConfiguration`, `PracticeArea`, `MatterType`,
`WorkflowTemplate`, `FirmWorkflow`, `WorkflowRun`, `WorkflowStep`, `ClientProfile`, `Matter`,
`IntakeResponse`, `Document`, `AIAnalysis`, `AIReview`, `ApprovalRequest`, `Task`,
`DraftCommunication`, `UsageRecord`, `AuditEvent`.

`Session` is an addition to the minimum list in the specification: server-side sessions are what
make sign-out and revocation real rather than cosmetic.

Conventions applied throughout:

- UUID primary keys, so identifiers are not guessable and merging databases is safe.
- `createdAt` / `updatedAt` on every model; `firmId` and `createdById` wherever meaningful.
- Table names in `snake_case` via `@@map`, so a future PostgreSQL migration is uneventful.
- **Enum-like columns are plain strings.** SQLite has no native enums; the allowed values live in
  `src/lib/constants.ts` and are the single source of truth. On PostgreSQL these become real
  database enums with no application change.
- **Structured payloads are JSON text.** Prisma does not support the `Json` type on SQLite, so
  firm configuration, matter fields and AI results are stored as text and parsed by
  `src/lib/json-field.ts`, which degrades to a documented default rather than throwing inside a
  page render. On PostgreSQL these become `jsonb` columns.
- The audit log is **append-only at the application level**: `src/lib/audit.ts` exposes a record
  function and no update or delete path exists anywhere. That is discipline, not a guarantee —
  production needs write-once storage or an INSERT-only database role.

### Two deliberate choices worth knowing

**`Matter.fields` is a JSON column, not a set of columns.** Immigration matters carry a status
expiration date and an I-94 classification; employment matters carry a termination date and an
hourly rate. Which fields are visible comes from the firm's configuration, so they cannot be a
fixed schema without one table per practice area — which is exactly the fork Orchelio exists to
avoid.

**`UsageRecord.isRealCharge` defaults to false.** "Simulated" is a property of the data, not a
label painted on a screen, so a real charge can never be mistaken for a simulated one later.

---

## 8. Procedures

### 8.1 Adding a practice area

1. Add an entry to `PRACTICE_AREAS` in `src/lib/practice-areas.ts` with `status: "planned"`.
2. Add its matter types, document categories and intake fields as template data (Phase 4/5).
3. Add its workflow templates (Phase 4).
4. Add its Analyst and Reviewer prompts under `prompts/<area>/` (Phase 6).
5. Flip `status` to `"available"`.

No screen is rewritten. No route is added. Everything is data.

### 8.2 Adding a workflow

1. Add a `WorkflowTemplate` row with its ordered steps, required approvals, AI features and
   permitted roles (Phase 4).
2. It becomes selectable in onboarding step 4 and in Firm Settings → Workflows.

Orchelio deliberately does **not** ship a full no-code workflow editor in the first version.

### 8.3 Creating a firm

Entirely through the interface, in two halves by two different people.

1. **A platform administrator** opens Platform administration → Firms, and gives the firm's name,
   its main practice area and the name and address of its first administrator. That creates the
   firm, its configuration — carrying all nine locked approval rules from the first second — and
   the administrator's membership. The firm is left in `onboarding`: it exists, and it is not yet
   a usable workspace, and the screen says so.
2. **The firm's own administrator** signs in and answers the seven questions. Confirming enables
   the workflow templates for the practice area, marks the configuration complete and makes the
   firm active.

Afterwards, that administrator can add the fictional sample matters from Firm settings →
Demonstration, and change any answer except the main practice area from the other tabs.

No code change and no deployment. Only practice areas with a full template can be chosen: a firm
created into an empty one could not finish its questionnaire, which is a dead end two screens
later rather than a refusal at the point of the mistake.

`tests/e2e/admin.spec.ts` performs exactly this, end to end, as the phase's acceptance test.

### 8.4 Adding the Anthropic API

1. `npm install @anthropic-ai/sdk`.
2. Create `src/lib/ai/anthropic-provider.ts` implementing `AIProvider`. Server-side only.
3. Send [`prompts/analyst.v1.md`](../prompts/analyst.v1.md) and
   [`prompts/reviewer.v1.md`](../prompts/reviewer.v1.md), already written. Record the version on
   every row, as the mock does, so a past output can still be explained.
4. Set `ANTHROPIC_API_KEY` in `.env` (never in any `NEXT_PUBLIC_*` variable).
5. Replace the `throw` in `aiProvider()` — it exists so that asking for a provider that is not
   implemented fails loudly instead of quietly behaving like the mock.
6. Set `AI_PROVIDER=anthropic`.
7. Add prompt-injection tests before enabling it against anything that matters. The rule that a
   document is evidence and never an instruction is stated in both prompts and tested nowhere,
   because nothing is sent anywhere yet.
8. Run `tests/unit/ai-reviewer.test.ts` against the new provider's output. Those checks are what
   stop an analysis overstating what a file supports, and they are written to be
   implementation-independent.

No page and no query changes: the interface is the seam.

### 8.5 Moving to PostgreSQL

1. `prisma/schema.prisma`: `provider = "sqlite"` → `provider = "postgresql"`.
2. `src/lib/prisma.ts`: `@prisma/adapter-better-sqlite3` → `@prisma/adapter-pg`.
3. `DATABASE_URL` → the PostgreSQL connection string.
4. Regenerate the migrations.
5. Then consider row-level security (section 4.2).

---

## 9. Design system

Tokens live in `src/app/globals.css` under `@theme`, exposed as Tailwind utilities
(`bg-surface`, `text-ink`, `border-line`, `text-brand`, …).

Principles:

- Sober and professional. No decorative gradients, no animation that does not communicate state.
- Light and dark are both first-class: the theme follows the operating system and can be pinned
  with `data-theme` on `<html>`.
- Keyboard focus is always visible; `prefers-reduced-motion` is respected.
- Provenance is always visible: **AI-generated — Human review required**, **Attorney approved**,
  **Not verified**. A user must never have to guess where a statement came from.
