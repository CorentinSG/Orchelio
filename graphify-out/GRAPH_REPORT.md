# Graph Report - .  (2026-08-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1330 nodes · 3146 edges · 81 communities (65 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2363831c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- approvals/page.tsx
- run.ts
- fields.ts
- scripts
- analyst.ts
- devDependencies
- ai/page.tsx
- allow
- compilerOptions
- local-provider.ts
- [id]/page.tsx
- [step]/page.tsx
- ui.tsx
- onboarding/config.ts
- confidentiality-check.mjs
- settings.ts
- firms/page.tsx
- dashboard/page.tsx
- firms.ts
- matters/page.tsx
- demo-accounts.ts
- env.ts
- local-provider.test.ts
- settings/page.tsx
- settings/config.ts
- app-config.ts
- start/page.tsx
- app-shell.tsx
- provider.ts
- fixtures.ts
- reviewer.ts
- dependencies
- seed.ts
- confidentiality.test.ts
- codemap.mjs
- format/dates.ts
- firm-scope.ts
- docs-check.mjs
- doctor.mjs
- audit.mjs
- mistral-provider.test.ts
- cache.ts
- acceptance-check.mjs
- app/page.tsx
- deny
- app.json
- rate-limit.ts
- approvals.spec.ts
- settings.spec.ts
- loading-screen.tsx
- skills-check.mjs
- (app)/not-found.tsx
- catalogues.ts
- approvals.test.ts
- settings.json
- onboarding.spec.ts
- ai-smoke.mjs
- accessibility.spec.ts
- analysis.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs
- 20260730163455_separate_approver/migration.sql
- 20260730180000_superseded_approvals/migration.sql
- 20260806162127_usage_record_carries_class_and_microeuros/migration.sql
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 37 edges
3. `Callout()` - 29 edges
4. `recordAuditEvent()` - 26 edges
5. `currentSession` - 26 edges
6. `Card()` - 24 edges
7. `can()` - 24 edges
8. `Badge()` - 23 edges
9. `actorFor()` - 23 edges
10. `ServerEnv` - 23 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `envFor()` --calls--> `parseServerEnv()`  [EXTRACTED]
  tests/unit/provider-notice.test.ts → src/lib/env.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `AdminDemoPage()` --calls--> `listFirmsForAdministration()`  [EXTRACTED]
  src/app/(app)/admin/demo/page.tsx → src/lib/data/platform.ts

## Import Cycles
- None detected.

## Communities (81 total, 16 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (74): ADR-0006, CHANNELS, POST(), POST(), POST(), POST(), ACTIONS, OnboardingPage() (+66 more)

### Community 1 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (56): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+48 more)

### Community 2 - "run.ts"
Cohesion: 0.05
Nodes (31): ADR-0008, POST(), POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, summariseForApproval() (+23 more)

### Community 3 - "fields.ts"
Cohesion: 0.07
Nodes (41): ADR-0002, ACCEPT, Chosen, UploadPanel(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS (+33 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (43): description, engines, node, name, private, scripts, acceptance:check, ai:smoke (+35 more)

### Community 5 - "analyst.ts"
Cohesion: 0.11
Nodes (37): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline(), buildWarnings() (+29 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 7 - "ai/page.tsx"
Cohesion: 0.09
Nodes (33): ADR-0021, ADR-0024, ADR-0027, AdminSystemPage(), AiWorkspacePage(), featureLabel(), metadata, DashboardPage() (+25 more)

### Community 8 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 9 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 10 - "local-provider.ts"
Cohesion: 0.13
Nodes (24): ADR-0014, LocalModelSettings, localUsage(), NOTHING_USED, ADR-0024, withWarning(), MistralSettings, NOTHING_USED (+16 more)

### Community 11 - "[id]/page.tsx"
Cohesion: 0.10
Nodes (31): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+23 more)

### Community 12 - "[step]/page.tsx"
Cohesion: 0.09
Nodes (21): Answers, metadata, PageProps, CheckboxOption(), Field(), LockIcon(), ProgressBar(), StepActions() (+13 more)

### Community 13 - "ui.tsx"
Cohesion: 0.13
Nodes (19): metadata, AdminDemoPage(), metadata, metadata, metadata, OrchelioWordmark(), CLASS_TONE, ConfidentialityReport() (+11 more)

### Community 14 - "onboarding/config.ts"
Cohesion: 0.17
Nodes (25): POST(), stringList(), completeOnboarding(), EMPTY_ANSWERS, ensureConfiguration(), loadDraft(), OnboardingDraft, restartOnboarding() (+17 more)

### Community 15 - "confidentiality-check.mjs"
Cohesion: 0.07
Nodes (25): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, DISPLAY_MODULES, EGRESS_ALLOWED, EGRESS_PATTERNS (+17 more)

### Community 16 - "settings.ts"
Cohesion: 0.11
Nodes (24): back(), POST(), back(), POST(), stringList(), AppLayout(), isSelfDecision(), judgeSeparation() (+16 more)

### Community 17 - "firms/page.tsx"
Cohesion: 0.17
Nodes (20): POST(), AdminFirmsPage(), metadata, one(), PageProps, CreatedFirm, createFirm(), CreateFirmOutcome (+12 more)

### Community 18 - "dashboard/page.tsx"
Cohesion: 0.12
Nodes (19): ActivityPage(), metadata, one(), PageProps, metadata, ActivityDetail(), activityLabel(), ActivityStatusBadge() (+11 more)

### Community 19 - "firms.ts"
Cohesion: 0.13
Nodes (16): POST(), DocumentsPage(), metadata, one(), PageProps, IntakePage(), metadata, metadata (+8 more)

### Community 20 - "matters/page.tsx"
Cohesion: 0.16
Nodes (17): metadata, NewMatterPage(), PageProps, MattersPage(), metadata, one(), PageProps, MatterLink() (+9 more)

### Community 21 - "demo-accounts.ts"
Cohesion: 0.14
Nodes (14): safeRedirectTarget(), signInAction(), SignInState, INITIAL, LoginForm(), DECISIONS_REQUIRING_NOTE, isLockedApproval(), DEMO_ACCOUNTS (+6 more)

### Community 22 - "env.ts"
Cohesion: 0.17
Nodes (14): assertLoopback(), IPV6_LOOPBACK, isLoopback(), isLoopbackHost(), NotLoopbackError, AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS (+6 more)

### Community 23 - "local-provider.test.ts"
Cohesion: 0.13
Nodes (12): SUPPORT_LEVELS, DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, NOW, ALL_FEATURES, demo() (+4 more)

### Community 24 - "settings/page.tsx"
Cohesion: 0.16
Nodes (16): ADR-0016, POST(), metadata, PageProps, AccentChoice(), LockedRules(), MemberList(), MemberRow (+8 more)

### Community 25 - "settings/config.ts"
Cohesion: 0.20
Nodes (16): ADR-0015, ADR-0018, CONFIGURABLE_APPROVAL_OPTIONS, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING (+8 more)

### Community 26 - "app-config.ts"
Cohesion: 0.17
Nodes (8): metadata, viewport, LoginPage(), metadata, safeNext(), WordmarkProps, DemoBanner(), visibleDemoAccounts()

### Community 27 - "start/page.tsx"
Cohesion: 0.17
Nodes (11): metadata, PageProps, StartPage(), ACCEPT, Chosen, StartPanel(), blockingReason(), GuidedInput (+3 more)

### Community 28 - "app-shell.tsx"
Cohesion: 0.14
Nodes (13): signOutAction(), ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem (+5 more)

### Community 29 - "provider.ts"
Cohesion: 0.26
Nodes (8): LocalAIProvider, MistralAIProvider, AIProvider, MockAIProvider, UnavailableAIProvider, TaskClass, AnalysisReviewInput, ReviewerRun

### Community 30 - "fixtures.ts"
Cohesion: 0.24
Nodes (7): LOCKED_APPROVALS, FEATURES, createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture, NEW_FIRM

### Community 31 - "reviewer.ts"
Cohesion: 0.17
Nodes (13): analystInternals, STANDING_WARNINGS, assertsAnOutcome(), buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), ReviewCheck (+5 more)

### Community 32 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 33 - "seed.ts"
Cohesion: 0.23
Nodes (11): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, encode() (+3 more)

### Community 34 - "confidentiality.test.ts"
Cohesion: 0.27
Nodes (12): CLASS_DEFINITIONS, ClassDefinition, classify(), clientMaterialModels(), CONFIDENTIALITY_CLASSES, ConfidentialityClass, Enforcement, isClientMaterial() (+4 more)

### Community 35 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 36 - "format/dates.ts"
Cohesion: 0.35
Nodes (11): UnconfirmedDate(), calendarDayIn(), daysBetween(), firmTimezone(), formatDate(), formatMoment(), KNOWN_ZONES, timezoneLabel() (+3 more)

### Community 37 - "firm-scope.ts"
Cohesion: 0.29
Nodes (10): assertFirmScoped(), DATA_OPERATIONS, dataIsFirmScoped(), FIRM_SCOPED_MODELS, FirmScopeError, isRecord(), PLATFORM_MODELS, QueryArgs (+2 more)

### Community 38 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 39 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 40 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 41 - "mistral-provider.test.ts"
Cohesion: 0.24
Nodes (6): estimateMicroEuros(), MISTRAL_MODEL_BY_CLASS, MISTRAL_PRICES, TASK_CLASSES, ALL_FEATURES, NOW

### Community 42 - "cache.ts"
Cohesion: 0.29
Nodes (8): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError

### Community 43 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 44 - "app/page.tsx"
Cohesion: 0.29
Nodes (8): HomePage(), PHASE_LABEL, PHASE_TONE, StatusDot(), currentPhase(), Phase, PHASES, PhaseStatus

### Community 45 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 46 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 47 - "rate-limit.ts"
Cohesion: 0.33
Nodes (7): consumeAttempt(), RateLimitResult, resetAllAttempts(), resetAttempts(), Window, windowFor(), windows

### Community 48 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 51 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 52 - "(app)/not-found.tsx"
Cohesion: 0.29
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 53 - "catalogues.ts"
Cohesion: 0.38
Nodes (6): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), matterTypeOptions()

### Community 55 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 60 - "accessibility.spec.ts"
Cohesion: 0.50
Nodes (3): audit(), expectNoViolations(), Page

## Knowledge Gaps
- **441 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `viewport` (+436 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `run.ts`, `firm-scope.ts`, `fixtures.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _441 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06721611721611721 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06947996589940324 - nodes in this community are weakly interconnected._
- **Should `run.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054426705370101594 - nodes in this community are weakly interconnected._
- **Should `fields.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06547619047619048 - nodes in this community are weakly interconnected._