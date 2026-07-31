# Graph Report - .  (2026-07-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1286 nodes · 3029 edges · 92 communities (80 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `614836f5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- approvals/page.tsx
- fields.ts
- scripts
- devDependencies
- allow
- compilerOptions
- analyst.ts
- [step]/page.tsx
- workspace.ts
- start/route.ts
- settings/page.tsx
- local-provider.ts
- constants.ts
- confidentiality-check.mjs
- documents/route.ts
- types.ts
- Callout
- confidentiality-ui.tsx
- run.ts
- dashboard/page.tsx
- [id]/page.tsx
- firms.ts
- app-config.ts
- settings/config.ts
- platform.ts
- settings.ts
- guide/page.tsx
- upload-panel.tsx
- ai-analyst.test.ts
- firms/page.tsx
- fixtures.ts
- onboarding/config.ts
- ui.tsx
- reviewer.ts
- dependencies
- seed.ts
- matters/page.tsx
- usage/page.tsx
- ai/page.tsx
- codemap.mjs
- login/page.tsx
- onboarding.ts
- firm-scope.ts
- docs-check.mjs
- doctor.mjs
- app-shell.tsx
- env.ts
- audit.mjs
- app/page.tsx
- cache.ts
- format/dates.ts
- acceptance-check.mjs
- prisma.ts
- provider.ts
- deny
- app.json
- rate-limit.ts
- approvals.spec.ts
- communications.ts
- not-found-notice.tsx
- guided.ts
- login/actions.ts
- loopback.ts
- skills-check.mjs
- onboarding/route.ts
- approvals.test.ts
- settings.json
- onboarding.spec.ts
- accessibility.spec.ts
- app/layout.tsx
- analysis.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs
- 20260730163455_separate_approver/migration.sql
- 20260730180000_superseded_approvals/migration.sql
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 36 edges
3. `Callout()` - 29 edges
4. `recordAuditEvent()` - 28 edges
5. `currentSession` - 27 edges
6. `Card()` - 24 edges
7. `can()` - 24 edges
8. `Badge()` - 23 edges
9. `actorFor()` - 23 edges
10. `compilerOptions` - 22 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `envFor()` --calls--> `parseServerEnv()`  [EXTRACTED]
  tests/unit/provider-notice.test.ts → src/lib/env.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts

## Import Cycles
- None detected.

## Communities (92 total, 12 thin omitted)

### Community 0 - "approvals/page.tsx"
Cohesion: 0.06
Nodes (60): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+52 more)

### Community 1 - "fields.ts"
Cohesion: 0.07
Nodes (40): ADR-0002, POST(), NewMatterPage(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS (+32 more)

### Community 2 - "scripts"
Cohesion: 0.05
Nodes (42): description, engines, node, name, private, scripts, acceptance:check, build (+34 more)

### Community 3 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 4 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 5 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 6 - "analyst.ts"
Cohesion: 0.15
Nodes (30): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline(), buildWarnings() (+22 more)

### Community 7 - "[step]/page.tsx"
Cohesion: 0.09
Nodes (21): Answers, metadata, PageProps, CheckboxOption(), LockIcon(), ProgressBar(), StepActions(), WorkflowPreview() (+13 more)

### Community 8 - "workspace.ts"
Cohesion: 0.13
Nodes (17): OnboardingPage(), activeFirmFor(), resolveActiveFirm(), FirmContext, requireFirmAccess(), requireFirmScope(), requirePermission(), requirePlatformAdmin() (+9 more)

### Community 9 - "start/route.ts"
Cohesion: 0.31
Nodes (14): ADR-0006, CHANNELS, POST(), ACTIONS, AuditInput, recordAuditEvent(), serialise(), scopeFor() (+6 more)

### Community 10 - "settings/page.tsx"
Cohesion: 0.12
Nodes (21): ADR-0016, POST(), metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules() (+13 more)

### Community 11 - "local-provider.ts"
Cohesion: 0.12
Nodes (16): ADR-0023, factsMessage(), judgeSummary(), LocalAIProvider, LocalModelSettings, NOTHING_USED, orchelioWroteTheSummary(), readContent() (+8 more)

### Community 12 - "constants.ts"
Cohesion: 0.08
Nodes (22): ACCEPT, Chosen, AI_STATUSES, AiStatus, ALLOWED_DOCUMENT_EXTENSIONS, APPROVAL_DECISIONS, ApprovalDecision, AUDIT_STATUSES (+14 more)

### Community 13 - "confidentiality-check.mjs"
Cohesion: 0.09
Nodes (20): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, EGRESS_ALLOWED, EGRESS_PATTERNS, egressPattern (+12 more)

### Community 14 - "documents/route.ts"
Cohesion: 0.11
Nodes (15): POST(), POST(), ALLOWED_DOCUMENT_MIME_TYPES, addDocument(), listDocuments(), NewDocument, setDocumentVerified(), createMatter() (+7 more)

### Community 15 - "types.ts"
Cohesion: 0.10
Nodes (18): AnalysisDocument, AnalystRun, CONFIDENCE_BY_SUPPORT, Contradiction, FactSource, KeyFact, MatterAnalysisInput, MissingDocument (+10 more)

### Community 16 - "Callout"
Cohesion: 0.13
Nodes (18): metadata, metadata, PageProps, metadata, PageProps, Field(), StartPanel(), Callout() (+10 more)

### Community 17 - "confidentiality-ui.tsx"
Cohesion: 0.19
Nodes (18): CLASS_TONE, ConfidentialityReport(), describe(), MODEL_LABELS, CommandLine(), CLASS_DEFINITIONS, ClassDefinition, classify() (+10 more)

### Community 18 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, summariseForApproval(), RunUsage (+6 more)

### Community 19 - "dashboard/page.tsx"
Cohesion: 0.18
Nodes (13): metadata, AppLayout(), recordViewEvent(), Actor, FirmRole, isFirmRole(), PERMISSIONS, permissionsFor() (+5 more)

### Community 20 - "[id]/page.tsx"
Cohesion: 0.16
Nodes (18): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+10 more)

### Community 21 - "firms.ts"
Cohesion: 0.17
Nodes (13): POST(), DocumentsPage(), metadata, one(), PageProps, IntakePage(), metadata, TasksPage() (+5 more)

### Community 22 - "app-config.ts"
Cohesion: 0.16
Nodes (5): ADR-0011, metadata, OrchelioWordmark(), WordmarkProps, LoadingScreen()

### Community 23 - "settings/config.ts"
Cohesion: 0.20
Nodes (16): ADR-0015, ADR-0018, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING, firmDisplayName() (+8 more)

### Community 24 - "platform.ts"
Cohesion: 0.23
Nodes (13): POST(), CreatedFirm, createFirm(), CreateFirmOutcome, looksLikeRealAddress(), NewFirmInput, NewFirmValidation, slugify() (+5 more)

### Community 25 - "settings.ts"
Cohesion: 0.24
Nodes (15): back(), POST(), back(), POST(), stringList(), countDeciders(), MembershipChange, otherActiveAdministrators() (+7 more)

### Community 26 - "guide/page.tsx"
Cohesion: 0.18
Nodes (11): metadata, CONFIGURABLE_APPROVALS, DECISIONS_REQUIRING_NOTE, isLockedApproval(), DEMO_ACCOUNTS, visibleDemoAccounts(), GUIDE_STEPS, guideAccounts() (+3 more)

### Community 27 - "upload-panel.tsx"
Cohesion: 0.33
Nodes (4): ACCEPT, Chosen, UploadPanel(), DocumentCategory

### Community 28 - "ai-analyst.test.ts"
Cohesion: 0.16
Nodes (12): STANDING_WARNINGS, SUPPORT_LEVELS, supportCaveat(), DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, NOW (+4 more)

### Community 29 - "firms/page.tsx"
Cohesion: 0.20
Nodes (13): AdminDemoPage(), metadata, AdminFirmsPage(), metadata, one(), PageProps, FirmSwitcher(), DataRow() (+5 more)

### Community 30 - "fixtures.ts"
Cohesion: 0.24
Nodes (7): LOCKED_APPROVALS, FEATURES, createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture, NEW_FIRM

### Community 31 - "onboarding/config.ts"
Cohesion: 0.27
Nodes (14): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys() (+6 more)

### Community 32 - "ui.tsx"
Cohesion: 0.14
Nodes (18): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+10 more)

### Community 33 - "reviewer.ts"
Cohesion: 0.17
Nodes (13): analystInternals, assertsAnOutcome(), buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), MatterAnalysisResult, ReviewCheck (+5 more)

### Community 34 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 35 - "seed.ts"
Cohesion: 0.23
Nodes (11): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, encode() (+3 more)

### Community 36 - "matters/page.tsx"
Cohesion: 0.20
Nodes (14): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_TONE, StatusBadge() (+6 more)

### Community 37 - "usage/page.tsx"
Cohesion: 0.23
Nodes (11): formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage(), runLabel(), formatCost(), listUsageRecords() (+3 more)

### Community 38 - "ai/page.tsx"
Cohesion: 0.26
Nodes (11): ADR-0021, AiWorkspacePage(), featureLabel(), metadata, DashboardPage(), StepAiFeatures(), ProviderNotice, ReviewStatus (+3 more)

### Community 39 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 40 - "login/page.tsx"
Cohesion: 0.21
Nodes (8): SignInState, INITIAL, LoginForm(), LoginPage(), metadata, safeNext(), DemoBanner(), DemoAccount

### Community 41 - "onboarding.ts"
Cohesion: 0.22
Nodes (11): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), EMPTY_ANSWERS, ensureConfiguration(), matterTypeOptions() (+3 more)

### Community 42 - "firm-scope.ts"
Cohesion: 0.29
Nodes (10): assertFirmScoped(), DATA_OPERATIONS, dataIsFirmScoped(), FIRM_SCOPED_MODELS, FirmScopeError, isRecord(), PLATFORM_MODELS, QueryArgs (+2 more)

### Community 43 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 44 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 45 - "app-shell.tsx"
Cohesion: 0.17
Nodes (10): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+2 more)

### Community 46 - "env.ts"
Cohesion: 0.26
Nodes (8): AI_PROVIDERS, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum(), envFor()

### Community 47 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 48 - "app/page.tsx"
Cohesion: 0.24
Nodes (9): HomePage(), PHASE_LABEL, PHASE_TONE, StatusDot(), currentPhase(), Phase, PHASES, PhaseStatus (+1 more)

### Community 49 - "cache.ts"
Cohesion: 0.29
Nodes (8): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError

### Community 50 - "format/dates.ts"
Cohesion: 0.38
Nodes (9): calendarDayIn(), daysBetween(), firmTimezone(), formatMoment(), KNOWN_ZONES, timezoneLabel(), timezoneNotice(), toDate() (+1 more)

### Community 51 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 52 - "prisma.ts"
Cohesion: 0.19
Nodes (10): AdminSystemPage(), metadata, GuardedPrismaClient, globalForPrisma, DatabaseStatus, describeFailure(), getDatabaseStatus(), getSystemStatus() (+2 more)

### Community 53 - "provider.ts"
Cohesion: 0.40
Nodes (6): AIProvider, MockAIProvider, UnavailableAIProvider, AnalysisReviewInput, ReviewerRun, AiProviderName

### Community 54 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 55 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 56 - "rate-limit.ts"
Cohesion: 0.33
Nodes (7): consumeAttempt(), RateLimitResult, resetAllAttempts(), resetAttempts(), Window, windowFor(), windows

### Community 57 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 58 - "communications.ts"
Cohesion: 0.25
Nodes (5): POST(), createDraft(), DraftFilters, listDrafts(), NewDraft

### Community 59 - "not-found-notice.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 60 - "guided.ts"
Cohesion: 0.32
Nodes (6): StartPage(), blockingReason(), GuidedInput, GuidedReadiness, GuidedStep, ABLE

### Community 61 - "login/actions.ts"
Cohesion: 0.43
Nodes (7): safeRedirectTarget(), signInAction(), signOutAction(), newCorrelationId(), createSession(), destroySession(), hashToken()

### Community 62 - "loopback.ts"
Cohesion: 0.46
Nodes (5): assertLoopback(), IPV6_LOOPBACK, isLoopback(), isLoopbackHost(), NotLoopbackError

### Community 63 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 64 - "onboarding/route.ts"
Cohesion: 0.57
Nodes (6): POST(), stringList(), completeOnboarding(), loadDraft(), restartOnboarding(), saveStep()

### Community 67 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 70 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 71 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **425 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `viewport` (+420 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `firm-scope.ts`, `prisma.ts`, `fixtures.ts`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.114) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _425 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06306306306306306 - nodes in this community are weakly interconnected._
- **Should `fields.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07342995169082125 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._