---
title: Roadmap
tags: [reference, planning]
---

# Orchelio — Roadmap

Orchelio is built in nine phases. Each phase ends with: tests run, errors fixed, a summary of what
changed, the main files listed, a commit, and instructions for testing it.

The application shows this progress on its home page, read from `src/lib/roadmap.ts`. Update that
file when a phase status changes, so the product and the documentation cannot disagree.

---

## Phase 1 — Initialisation ✅ Delivered


**Goal:** a real, running foundation — not a static mock-up.

Delivered:

- Next.js 16 (App Router) + React 19 + TypeScript in strict mode.
- Tailwind CSS 4 with the Orchelio design tokens, light and dark themes.
- Prisma 7 + SQLite, first migration, `Firm` model, seed for the two demonstration firms.
- Environment layer with validation (`src/lib/env.ts`) and the public identity module
  (`src/lib/app-config.ts`).
- Home page rendering live platform status from the database, plus loading, error and 404 screens.
- Vitest (16 unit and component tests) and Playwright (5 browser tests).
- `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/PRODUCTION_READINESS.md`,
  `docs/PLAN_PHASE_1.md`, `.env.example`.

Not in this phase: sign-in, firm workspaces, onboarding, matters, documents, AI, approvals,
audit log, cost screens.

---

## Phase 2 — Data and authentication ✅ Delivered

Delivered:

- Complete data model — 22 models, one migration, indexes on every `firmId`.
- Extended seed: 8 practice areas, 20 matter types, 4 workflow templates, 2 firms with their
  configurations, 5 demonstration users and their memberships. Idempotent.
- Local sign-in at `/login`: server-side sessions (random token, only its hash stored), scrypt
  password hashing, constant-time comparison, identical failure message for an unknown address and
  a wrong password, and in-memory attempt throttling.
- Four firm roles plus the platform role, and a permission matrix enforced on the server.
- Guards (`requireSession`, `requireFirmAccess`, `requirePermission`, `requirePlatformAdmin`) that
  record every refusal to the activity log.
- Firm dashboard and platform firm list, both reading real data.
- 50 unit tests and 19 browser tests.

**Acceptance met:** each demonstration account lands in its own workspace; a firm user is refused
platform administration; a signed-out request for a protected page never receives workspace
content.

Not in this phase: the onboarding questionnaire, matters, documents, AI, approvals, the activity
log screen, the cost screens.

---

## Phase 3 — Multi-firm ✅ Delivered

Delivered:

- **Scoping guard.** The Prisma client itself refuses any query against a firm-scoped model that
  does not name a firm (`src/lib/data/firm-scope.ts`). `AND` and `OR` are treated oppositely:
  one scoped branch satisfies an `AND`, but every branch of an `OR` must be scoped, because
  `OR: [{ firmId }, { status }]` would return the whole database.
- **Data-access layer** (`src/lib/data`): matters, documents, analyses, usage, activity, search
  and statistics — each function takes the firm as a required first argument.
- **Firm switcher** for users who belong to more than one firm, plus the `reviewer@demo.local`
  account that belongs to both demonstration firms.
- **Active firm resolution**: the cookie is a preference, not a credential. An identifier that
  does not match a membership is ignored.
- **40 integration tests** against a real migrated database with two firms holding deliberately
  similar records, and **7 browser tests** covering the switcher and cross-firm access.

**Acceptance met:** an immigration user cannot open an employment matter by any route — through
the data layer, through a copied identifier, through search, through a forged cookie or through a
tampered form — and every refusal is recorded.

Two defects were found by the tests and fixed:

1. Switching firms left the browser showing the **previous** firm's dashboard about half the time.
   The server was always right; the render returned inside the Server Action's response was not.
   Switching is now a plain form POST answered with an HTTP 303, which has no such ambiguity.
2. Redirects built from `request.url` pointed at a different host than the browser was using
   (`localhost` instead of `127.0.0.1`), which silently dropped the session cookie. Redirects are
   now relative, and the cross-site check compares `Origin` against the real `Host` header.

---

## Phase 4 — Onboarding ✅ Delivered

Delivered:

- Seven-step questionnaire with a progress bar: firm details, practice areas, matter types,
  workflow steps, AI features, human approvals, summary.
- Every answer saved as it is given, so "Save as draft" is not a separate feature — leaving
  halfway through and coming back is simply what the questionnaire does.
- Locked approval rules shown with a padlock, submitted by nothing, and written in by the server
  regardless of what was sent.
- **Practice-area vocabulary**: the same question produces a different configuration depending on
  the firm's main area. "Document collection" becomes `document_collection` at an immigration firm
  and `evidence_collection` at an employment firm; "Create a factual timeline" becomes `timeline`
  or `employment_timeline`. This is what makes the two published configurations reproducible from
  one questionnaire, and it is the mechanism behind the specification's promise that Orchelio
  adapts a firm's vocabulary.
- Dashboard assembled from the configuration: an immigration firm sees status expiration dates and
  missing identity documents; an employment firm sees termination letters and missing wage records.
  A widget that depends on an AI feature the firm switched off is omitted rather than shown empty.
- Restart the questionnaire without discarding an answer.

**Acceptance met:** answering the questionnaire reproduces both configurations printed in the
specification, asserted literally in `tests/unit/onboarding-config.test.ts`, and the same answers
given at the two demonstration firms produce two different dashboards.

### An inconsistency in the specification, and how it was resolved

The specification's step 4 offers fourteen generic workflow steps, but its example configurations
contain keys that are not among them — `consultation_preparation` and `document_collection` for
immigration, `employment_case_assessment` and `evidence_collection` for employment. Taken
literally, no set of answers produces the published output.

Reading §2, which promises that the configuration determines "the vocabulary used", resolves it:
these are the *same* four steps, named in each practice area's own language. Orchelio implements
that as a per-area key mapping, which reproduces both examples exactly and delivers a feature the
specification asked for. The alternative — declaring the criterion unreachable — would have been
easier and less useful.

One further deviation, stated rather than hidden: the published `approvals` objects list a subset
of the rules. Orchelio stores every locked rule as well, so the guarantee is auditable in the data
rather than merely asserted in a comment. Every key in each published example is present and
required.

### A defect found and fixed

Confirming the configuration navigated nowhere, silently: the server completed the work and
redirected, and the browser stayed on the summary page. The cause was `revalidatePath("/", "layout")`
inside an action that then redirects across routes — the client router discards the navigation.
The onboarding submissions are now plain form POSTs answered with an HTTP 303, the same mechanism
adopted for the firm switcher in Phase 3, and both now share `src/lib/http/form-post.ts`.

---

## Phase 5 — Matters and documents

- Matter list with filters, and the matter record with its tabs.
- Practice-area-specific fields (immigration status fields; employment representation, pay and
  termination fields).
- Simulated document upload: drag and drop, extension allow-list, size limit, classification,
  attachment to a matter. No real OCR.

**Acceptance:** the six fictional matters exist, with their documents, under the right firm.

---

## Phase 6 — Simulated AI

- The `AIProvider` interface and `MockAIProvider`.
- Claude Analyst: summary, key facts with sources and simulated confidence, timeline, missing
  documents, contradictions, attorney questions, client questions, warnings.
- Claude Reviewer: independent review with issue categories, and mandatory human review.
- Simulated progress states, and honest error states.
- `prompts/` written for the future Anthropic provider.

**Acceptance:** the Daniel Moreau matter surfaces its date contradiction; the Amira Hassan matter
returns "More information required" and no conclusion.

---

## Phase 7 — Approvals and audit

- Approval centre listing every pending action with firm, matter, action, user, date, risk and
  summary.
- Decisions: Approve, Approve with edits, Request new analysis, Reject — with a mandatory note on
  the last three.
- Append-only audit log with filters, recording every decision, access and refusal.

**Acceptance:** no sensitive action can complete without an explicit human decision, and every
decision appears in the log.

---

## Phase 8 — Usage and administration

- Simulated AI usage and costs per firm, with the "Simulated cost — No API charge was incurred."
  notice.
- Platform administration: firm list, firm creation, demo management, technical status.
- Firm settings: profile, matter types, AI features, approval rules, roles, branding, demo
  controls.
- Guided demo: the twenty-one step walkthrough.

**Acceptance:** a third firm can be created entirely through the interface, with no code change.

---

## Phase 9 — Tests and documentation

- Unit, integration and end-to-end coverage of the acceptance criteria.
- Accessibility pass: keyboard, contrast, screen-reader labels, focus order.
- Final documentation: limitations, pre-production work, demonstration procedure, and the
  procedures for adding a practice area, a workflow, a firm and the Anthropic API.

---

## Explicitly out of scope

Real email sending, payments, electronic signature, court filing, court connections, Clio
integration, advanced OCR, automated legal research, direct legal advice, an autonomous client
chatbot, real billing, Stripe, production hosting, a mobile application, a complex workflow
editor, full conflict management, definitive deadline calculation, importing real matters,
definitive damages calculation, automated negotiation, and automated communication with opposing
counsel.

Simulated interfaces for some of these may be shown, always labelled as simulated.
