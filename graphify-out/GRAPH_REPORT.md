# Graph Report - .  (2026-07-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1239 nodes · 2880 edges · 81 communities (69 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `2d96d0c5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- analyst.ts
- approvals/page.tsx
- fields.ts
- scripts
- devDependencies
- allow
- compilerOptions
- [step]/page.tsx
- ui.tsx
- login/actions.ts
- settings.ts
- app-config.ts
- confidentiality-check.mjs
- run.ts
- [id]/page.tsx
- activity/page.tsx
- ai/page.tsx
- app/page.tsx
- settings/config.ts
- platform.ts
- demo/page.tsx
- onboarding/config.ts
- app-shell.tsx
- fixtures.ts
- settings/page.tsx
- confidentiality.test.ts
- dependencies
- firm-scope.ts
- codemap.mjs
- start-panel.tsx
- docs-check.mjs
- doctor.mjs
- dashboard/page.tsx
- matters/page.tsx
- onboarding.ts
- scope.ts
- audit.mjs
- formatDate
- data/matters.ts
- firms.ts
- cache.ts
- env.ts
- format/dates.ts
- acceptance-check.mjs
- prisma.ts
- deny
- app.json
- approvals.spec.ts
- demo.ts
- seed.ts
- firms/page.tsx
- not-found-notice.tsx
- loading-screen.tsx
- skills-check.mjs
- approvals.test.ts
- settings.json
- onboarding.spec.ts
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
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `AdminDemoPage()` --calls--> `listFirmsForAdministration()`  [EXTRACTED]
  src/app/(app)/admin/demo/page.tsx → src/lib/data/platform.ts

## Import Cycles
- None detected.

## Communities (81 total, 12 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (80): ADR-0006, CHANNELS, POST(), POST(), POST(), POST(), ACTIONS, POST() (+72 more)

### Community 1 - "analyst.ts"
Cohesion: 0.05
Nodes (75): analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline() (+67 more)

### Community 2 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (55): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+47 more)

### Community 3 - "fields.ts"
Cohesion: 0.07
Nodes (42): ADR-0002, ACCEPT, Chosen, UploadPanel(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS (+34 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (42): description, engines, node, name, private, scripts, acceptance:check, build (+34 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 6 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 7 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 8 - "[step]/page.tsx"
Cohesion: 0.08
Nodes (21): Answers, metadata, PageProps, CheckboxOption(), Field(), LockIcon(), ProgressBar(), StepActions() (+13 more)

### Community 9 - "ui.tsx"
Cohesion: 0.14
Nodes (19): metadata, metadata, PageProps, metadata, PageProps, metadata, CLASS_TONE, ConfidentialityReport() (+11 more)

### Community 10 - "login/actions.ts"
Cohesion: 0.14
Nodes (19): safeRedirectTarget(), signInAction(), SignInState, INITIAL, LoginForm(), newCorrelationId(), encode(), hashPassword() (+11 more)

### Community 11 - "settings.ts"
Cohesion: 0.13
Nodes (21): back(), POST(), back(), POST(), stringList(), isSelfDecision(), judgeSeparation(), SeparationReadiness (+13 more)

### Community 12 - "app-config.ts"
Cohesion: 0.14
Nodes (10): metadata, metadata, metadata, viewport, LoginPage(), metadata, safeNext(), OrchelioWordmark() (+2 more)

### Community 13 - "confidentiality-check.mjs"
Cohesion: 0.09
Nodes (19): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, EGRESS_ALLOWED, EGRESS_PATTERNS, egressPattern (+11 more)

### Community 14 - "run.ts"
Cohesion: 0.13
Nodes (15): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+7 more)

### Community 15 - "[id]/page.tsx"
Cohesion: 0.14
Nodes (19): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+11 more)

### Community 16 - "activity/page.tsx"
Cohesion: 0.15
Nodes (17): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+9 more)

### Community 17 - "ai/page.tsx"
Cohesion: 0.17
Nodes (16): AiWorkspacePage(), featureLabel(), metadata, formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage() (+8 more)

### Community 18 - "app/page.tsx"
Cohesion: 0.15
Nodes (16): AdminSystemPage(), HomePage(), PHASE_LABEL, PHASE_TONE, StatusDot(), currentPhase(), Phase, PHASES (+8 more)

### Community 19 - "settings/config.ts"
Cohesion: 0.20
Nodes (16): ADR-0015, ADR-0018, CONFIGURABLE_APPROVAL_OPTIONS, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING (+8 more)

### Community 20 - "platform.ts"
Cohesion: 0.23
Nodes (13): POST(), CreatedFirm, createFirm(), CreateFirmOutcome, looksLikeRealAddress(), NewFirmInput, NewFirmValidation, slugify() (+5 more)

### Community 21 - "demo/page.tsx"
Cohesion: 0.20
Nodes (11): AdminDemoPage(), metadata, DECISIONS_REQUIRING_NOTE, isLockedApproval(), DEMO_ACCOUNTS, visibleDemoAccounts(), GUIDE_STEPS, guideAccounts() (+3 more)

### Community 22 - "onboarding/config.ts"
Cohesion: 0.25
Nodes (15): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys() (+7 more)

### Community 23 - "app-shell.tsx"
Cohesion: 0.14
Nodes (13): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+5 more)

### Community 24 - "fixtures.ts"
Cohesion: 0.24
Nodes (7): LOCKED_APPROVALS, FEATURES, createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture, NEW_FIRM

### Community 25 - "settings/page.tsx"
Cohesion: 0.21
Nodes (12): metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules(), MemberList(), MemberRow (+4 more)

### Community 26 - "confidentiality.test.ts"
Cohesion: 0.26
Nodes (13): CLASS_DEFINITIONS, ClassDefinition, classify(), clientMaterialModels(), CONFIDENTIALITY_CLASSES, ConfidentialityClass, Enforcement, isClientMaterial() (+5 more)

### Community 27 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 28 - "firm-scope.ts"
Cohesion: 0.26
Nodes (11): assertFirmScoped(), DATA_OPERATIONS, dataIsFirmScoped(), FIRM_SCOPED_MODELS, FirmScopeError, GuardedPrismaClient, isRecord(), PLATFORM_MODELS (+3 more)

### Community 29 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 30 - "start-panel.tsx"
Cohesion: 0.18
Nodes (9): StartPage(), ACCEPT, Chosen, StartPanel(), blockingReason(), GuidedInput, GuidedReadiness, GuidedStep (+1 more)

### Community 31 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 32 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 33 - "dashboard/page.tsx"
Cohesion: 0.24
Nodes (6): metadata, requestScoped, requestNow, parseJsonObject(), parseStringArray(), toJsonColumn()

### Community 34 - "matters/page.tsx"
Cohesion: 0.30
Nodes (10): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_TONE, StatusBadge() (+2 more)

### Community 35 - "onboarding.ts"
Cohesion: 0.24
Nodes (10): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), EMPTY_ANSWERS, ensureConfiguration(), matterTypeOptions() (+2 more)

### Community 36 - "scope.ts"
Cohesion: 0.20
Nodes (5): DraftFilters, listDrafts(), NewDraft, FirmScope, SearchResult

### Community 37 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 38 - "formatDate"
Cohesion: 0.27
Nodes (10): POST(), DocumentsPage(), one(), IntakePage(), metadata, TasksPage(), fileSize(), listIntakes() (+2 more)

### Community 39 - "data/matters.ts"
Cohesion: 0.20
Nodes (9): POST(), createMatter(), getMatter(), listMatters(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter (+1 more)

### Community 40 - "firms.ts"
Cohesion: 0.20
Nodes (6): metadata, NewMatterPage(), PageProps, requireWorkspace(), requireWorkspacePermission(), GENERIC_MATTER_STATUSES

### Community 41 - "cache.ts"
Cohesion: 0.29
Nodes (8): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError

### Community 42 - "env.ts"
Cohesion: 0.25
Nodes (8): AI_PROVIDERS, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum(), ServerEnv

### Community 43 - "format/dates.ts"
Cohesion: 0.38
Nodes (9): calendarDayIn(), daysBetween(), firmTimezone(), formatMoment(), KNOWN_ZONES, timezoneLabel(), timezoneNotice(), toDate() (+1 more)

### Community 44 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 45 - "prisma.ts"
Cohesion: 0.20
Nodes (3): listDocuments(), NewDocument, globalForPrisma

### Community 46 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 47 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 48 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 49 - "demo.ts"
Cohesion: 0.29
Nodes (7): ADR-0016, POST(), addSampleMatters(), demonstrationInventory(), EMPTY_RESULT, SampleDataResult, sampleMattersFor()

### Community 50 - "seed.ts"
Cohesion: 0.32
Nodes (7): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES

### Community 51 - "firms/page.tsx"
Cohesion: 0.43
Nodes (7): AdminFirmsPage(), metadata, one(), PageProps, listFirmsForAdministration(), PlatformCounts, creatablePracticeAreas()

### Community 52 - "not-found-notice.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 54 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 57 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 60 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 61 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **417 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `viewport` (+412 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `fixtures.ts`, `firm-scope.ts`, `prisma.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.106) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _417 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06502866502866503 - nodes in this community are weakly interconnected._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.050187265917602995 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07111501316944688 - nodes in this community are weakly interconnected._
- **Should `fields.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06612244897959184 - nodes in this community are weakly interconnected._