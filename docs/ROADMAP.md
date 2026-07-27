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

## Phase 3 — Multi-firm

- Firm memberships and the firm switcher.
- `firmId` on every business resource, and scoped data-access functions
  (`getMatter({ matterId, firmId })`).
- Isolation tests: cross-firm matter access, copied URLs, search results, document downloads,
  analyses, statistics, costs and logs.

**Acceptance:** an Immigration user cannot open an Employment matter by any route, and the refusal
is recorded.

---

## Phase 4 — Onboarding

- Seven-step questionnaire with a progress bar: firm details, practice areas, matter types,
  workflow steps, AI features, human approvals, summary.
- Locked approval rules shown with a padlock.
- Saved configuration, generated workflows, dashboard adapted to the primary practice area.
- "Save as draft" and the ability to restart onboarding.

**Acceptance:** the two demonstration configurations in the specification are reproduced exactly by
answering the questionnaire.

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
