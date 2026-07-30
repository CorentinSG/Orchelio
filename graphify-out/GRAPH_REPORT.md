# Graph Report - .  (2026-07-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1184 nodes · 2707 edges · 69 communities (59 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fc0a6c6d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- session.ts
- analyst.ts
- [id]/page.tsx
- approvals/page.tsx
- fields.ts
- constants.ts
- devDependencies
- allow
- firm-scope.ts
- scripts
- compilerOptions
- login/actions.ts
- [step]/page.tsx
- settings/page.tsx
- ui.tsx
- confidentiality-check.mjs
- firms/page.tsx
- onboarding.ts
- app-config.ts
- run.ts
- ai/page.tsx
- prisma.ts
- settings/config.ts
- onboarding/config.ts
- dependencies
- codemap.mjs
- docs-check.mjs
- app/page.tsx
- app-shell.tsx
- env.ts
- audit.mjs
- doctor.mjs
- practice-areas.ts
- login/page.tsx
- acceptance-check.mjs
- deny
- app.json
- data/documents.ts
- data/matters.ts
- guide.ts
- not-found-notice.tsx
- loading-screen.tsx
- package.json
- skills-check.mjs
- system-status.ts
- settings.json
- approvals.spec.ts
- onboarding.spec.ts
- accessibility.spec.ts
- analysis.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs
- migration.sql
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 36 edges
3. `Callout()` - 28 edges
4. `recordAuditEvent()` - 27 edges
5. `currentSession` - 27 edges
6. `Badge()` - 23 edges
7. `Card()` - 23 edges
8. `can()` - 22 edges
9. `compilerOptions` - 22 edges
10. `activeFirmFor()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json

## Import Cycles
- None detected.

## Communities (69 total, 10 thin omitted)

### Community 0 - "session.ts"
Cohesion: 0.08
Nodes (71): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, POST(), stringList() (+63 more)

### Community 1 - "analyst.ts"
Cohesion: 0.05
Nodes (73): analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline() (+65 more)

### Community 2 - "[id]/page.tsx"
Cohesion: 0.05
Nodes (66): ActivityPage(), metadata, one(), PageProps, DocumentsPage(), metadata, one(), PageProps (+58 more)

### Community 3 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (51): POST(), POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard() (+43 more)

### Community 4 - "fields.ts"
Cohesion: 0.06
Nodes (44): ADR-0002, POST(), ACCEPT, Chosen, UploadPanel(), ALLOWED_DOCUMENT_EXTENSIONS, BY_PRACTICE_AREA, DashboardWidget (+36 more)

### Community 5 - "constants.ts"
Cohesion: 0.06
Nodes (32): AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_MIME_TYPES, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES, AuditAction, AuditStatus (+24 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 7 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 8 - "firm-scope.ts"
Cohesion: 0.10
Nodes (30): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError (+22 more)

### Community 9 - "scripts"
Cohesion: 0.06
Nodes (36): scripts, acceptance:check, build, check, codemap, confidentiality:check, db:generate, db:migrate (+28 more)

### Community 10 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 11 - "login/actions.ts"
Cohesion: 0.12
Nodes (23): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget() (+15 more)

### Community 12 - "[step]/page.tsx"
Cohesion: 0.10
Nodes (18): Answers, metadata, PageProps, CheckboxOption(), LockIcon(), ProgressBar(), StepActions(), WorkflowPreview() (+10 more)

### Community 13 - "settings/page.tsx"
Cohesion: 0.13
Nodes (20): ADR-0016, POST(), metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules() (+12 more)

### Community 14 - "ui.tsx"
Cohesion: 0.17
Nodes (18): metadata, metadata, STATUS_TONE, CLASS_TONE, ConfidentialityReport(), describe(), MODEL_LABELS, Badge() (+10 more)

### Community 15 - "confidentiality-check.mjs"
Cohesion: 0.09
Nodes (19): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, EGRESS_ALLOWED, EGRESS_PATTERNS, egressPattern (+11 more)

### Community 16 - "firms/page.tsx"
Cohesion: 0.18
Nodes (18): POST(), AdminDemoPage(), AdminFirmsPage(), metadata, one(), PageProps, CreatedFirm, createFirm() (+10 more)

### Community 17 - "onboarding.ts"
Cohesion: 0.15
Nodes (17): metadata, PageProps, Field(), GENERIC_MATTER_STATUSES, allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas() (+9 more)

### Community 18 - "app-config.ts"
Cohesion: 0.14
Nodes (7): metadata, metadata, metadata, viewport, OrchelioWordmark(), WordmarkProps, DemoBanner()

### Community 19 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+6 more)

### Community 20 - "ai/page.tsx"
Cohesion: 0.19
Nodes (16): AiWorkspacePage(), featureLabel(), metadata, formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage() (+8 more)

### Community 21 - "prisma.ts"
Cohesion: 0.13
Nodes (7): DraftFilters, listDrafts(), NewDraft, GuardedPrismaClient, FirmScope, SearchResult, globalForPrisma

### Community 22 - "settings/config.ts"
Cohesion: 0.18
Nodes (17): ADR-0015, ADR-0018, CONFIGURABLE_APPROVAL_OPTIONS, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING (+9 more)

### Community 23 - "onboarding/config.ts"
Cohesion: 0.24
Nodes (16): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys() (+8 more)

### Community 24 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 25 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 26 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 27 - "app/page.tsx"
Cohesion: 0.21
Nodes (10): AdminSystemPage(), HomePage(), PHASE_LABEL, PHASE_TONE, StatusDot(), currentPhase(), Phase, PHASES (+2 more)

### Community 28 - "app-shell.tsx"
Cohesion: 0.17
Nodes (10): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+2 more)

### Community 29 - "env.ts"
Cohesion: 0.23
Nodes (9): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum() (+1 more)

### Community 30 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 31 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 32 - "practice-areas.ts"
Cohesion: 0.25
Nodes (8): StepMatterTypes(), StepSummary(), FirmSwitcher(), ROLE_LABELS, PRACTICE_AREAS, PracticeArea, PracticeAreaKey, practiceAreaLabel()

### Community 33 - "login/page.tsx"
Cohesion: 0.27
Nodes (7): INITIAL, LoginForm(), LoginPage(), metadata, safeNext(), DemoAccount, visibleDemoAccounts()

### Community 34 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 35 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 36 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 37 - "data/documents.ts"
Cohesion: 0.22
Nodes (4): POST(), addDocument(), NewDocument, touchMatter()

### Community 38 - "data/matters.ts"
Cohesion: 0.25
Nodes (7): createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 39 - "guide.ts"
Cohesion: 0.36
Nodes (6): DEMO_ACCOUNTS, GUIDE_STEPS, guideAccounts(), guideAccountsExist(), GuideStep, ROOT

### Community 40 - "not-found-notice.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 42 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 43 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 44 - "system-status.ts"
Cohesion: 0.33
Nodes (6): DatabaseStatus, describeFailure(), getDatabaseStatus(), listFirms(), MigrationRow, SystemStatus

### Community 45 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 47 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 49 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 50 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **407 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `PageProps` (+402 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `firm-scope.ts`, `constants.ts`, `prisma.ts`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.099) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _407 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `session.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07519512659432705 - nodes in this community are weakly interconnected._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05172413793103448 - nodes in this community are weakly interconnected._
- **Should `[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.054385964912280704 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06696428571428571 - nodes in this community are weakly interconnected._