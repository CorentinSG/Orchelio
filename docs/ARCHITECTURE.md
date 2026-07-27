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

## 4. Multi-tenancy

> Status: the `Firm` table exists as of Phase 1. The enforcement rules and their tests land in
> Phase 3. **Do not read the current build as proof of isolation.**

### 4.1 The rule

Every business resource carries a `firmId`. Every read is scoped by it. There is no exception.

```ts
// Correct — the firm is part of the question.
getMatter({ matterId, firmId });

// Forbidden — this can return another firm's matter.
getMatter(matterId);
```

This applies to users, memberships, client profiles, matters, documents, workflows, analyses,
reviews, approvals, tasks, communications, usage records, audit events, settings and templates.

Copying a URL from one firm's session into another firm's session must produce a refusal, not a
result, and the refusal itself is an audit event.

### 4.2 Demo isolation vs production isolation

The demonstration uses a **shared database with a `firmId` column**. That is a legitimate
multi-tenant pattern and it is enough to demonstrate the product, but it is the weakest of the
available options: a single missing `where` clause crosses a tenant boundary.

Before production, isolation must be strengthened. Options, from lightest to strongest:

| Level | Mechanism | Notes |
| ----- | --------- | ----- |
| 1 | `firmId` column + scoped data-access functions | Where the demo stops. |
| 2 | Row-level security in PostgreSQL | Enforced by the database, not by the application. |
| 3 | One schema per firm | Stronger blast-radius containment. |
| 4 | One database per firm | Separate credentials, separate backups. |
| 5 | Separate document storage, search index and encryption keys per firm | Required for privileged material. |

See [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md).

---

## 5. The AI layer

> Status: Phase 6. The interface below is the contract the rest of the product will be written
> against; no implementation exists yet.

```ts
interface AIProvider {
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
| `MockAIProvider` | Phase 6 | Pre-written results for the fictional matters. No network call. |
| `AnthropicAIProvider` | Prepared, not activated | Calls the Anthropic API, server-side only. |

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

Phase 1 defines one model, `Firm`, deliberately. The full model — `User`, `FirmMembership`,
`FirmConfiguration`, `PracticeArea`, `MatterType`, `Matter`, `ClientProfile`, `IntakeResponse`,
`Document`, `WorkflowTemplate`, `FirmWorkflow`, `WorkflowRun`, `WorkflowStep`, `AIAnalysis`,
`AIReview`, `ApprovalRequest`, `Task`, `DraftCommunication`, `UsageRecord`, `AuditEvent` — arrives
in Phase 2.

Conventions applied from the start:

- UUID primary keys, so identifiers are not guessable and merging databases is safe.
- `createdAt` / `updatedAt` on every model; `firmId` and `createdById` wherever meaningful.
- Table names in `snake_case` via `@@map`, so a future PostgreSQL migration is uneventful.
- The audit log is **append-only at the application level**: no update path, no delete path.

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

Via the interface: Platform Administration → Firms → New firm → the onboarding questionnaire.
The firm receives an identifier, a workspace, a configuration, a dashboard, workflows, roles,
settings and — optionally — sample data. No code change, no deployment. (Phase 4/8.)

### 8.4 Adding the Anthropic API

1. `npm install @anthropic-ai/sdk`.
2. Create `src/lib/ai/anthropic-provider.ts` implementing `AIProvider`. Server-side only.
3. Write the prompts under `prompts/`.
4. Set `ANTHROPIC_API_KEY` in `.env` (never in any `NEXT_PUBLIC_*` variable).
5. Set `AI_PROVIDER=anthropic`.
6. Add prompt-injection tests before enabling it against anything that matters.

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
