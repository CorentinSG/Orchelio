# Graph Report - .  (2026-07-31)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1247 nodes · 2893 edges · 86 communities (71 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fac72f1b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- approvals/page.tsx
- scripts
- devDependencies
- allow
- compilerOptions
- [step]/page.tsx
- firms/page.tsx
- fields.ts
- login/actions.ts
- ui.tsx
- dashboard/page.tsx
- login/page.tsx
- types.ts
- start/page.tsx
- confidentiality-check.mjs
- app-shell.tsx
- run.ts
- settings.ts
- firms.ts
- activity/page.tsx
- ai/page.tsx
- [id]/page.tsx
- app/page.tsx
- analyst.ts
- settings/config.ts
- onboarding/config.ts
- fixtures.ts
- settings/page.tsx
- parseIsoDate
- confidentiality.test.ts
- dependencies
- matters/page.tsx
- provider.ts
- codemap.mjs
- reviewer.ts
- ai-analyst.test.ts
- firm-scope.ts
- docs-check.mjs
- doctor.mjs
- new/page.tsx
- scope.ts
- audit.mjs
- data/matters.ts
- cache.ts
- env.ts
- acceptance-check.mjs
- format/dates.ts
- deny
- app.json
- approvals.spec.ts
- demo.ts
- not-found-notice.tsx
- loopback.ts
- loading-screen.tsx
- skills-check.mjs
- data/documents.ts
- approvals.test.ts
- settings.json
- separation.ts
- onboarding.spec.ts
- app-config.ts
- accessibility.spec.ts
- prisma.ts
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
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json

## Import Cycles
- None detected.

## Communities (86 total, 15 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.06
Nodes (80): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, POST(), stringList() (+72 more)

### Community 1 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (56): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+48 more)

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

### Community 6 - "[step]/page.tsx"
Cohesion: 0.08
Nodes (22): Answers, metadata, PageProps, CheckboxOption(), Field(), LockIcon(), ProgressBar(), StepActions() (+14 more)

### Community 7 - "firms/page.tsx"
Cohesion: 0.14
Nodes (24): PRACTICE_AREAS, POST(), AdminFirmsPage(), metadata, one(), PageProps, FirmSwitcher(), ROLE_LABELS (+16 more)

### Community 8 - "fields.ts"
Cohesion: 0.12
Nodes (26): ADR-0002, POST(), findMissingDocuments(), touchMatter(), BY_PRACTICE_AREA, categoriesFor(), categoryLabel(), EMPLOYMENT_CATEGORIES (+18 more)

### Community 9 - "login/actions.ts"
Cohesion: 0.13
Nodes (21): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget(), signInAction() (+13 more)

### Community 10 - "ui.tsx"
Cohesion: 0.15
Nodes (17): AdminDemoPage(), metadata, metadata, metadata, CLASS_TONE, ConfidentialityReport(), describe(), MODEL_LABELS (+9 more)

### Community 11 - "dashboard/page.tsx"
Cohesion: 0.12
Nodes (18): metadata, requestScoped, requestNow, BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS (+10 more)

### Community 12 - "login/page.tsx"
Cohesion: 0.13
Nodes (16): SignInState, INITIAL, LoginForm(), LoginPage(), metadata, safeNext(), DECISIONS_REQUIRING_NOTE, isLockedApproval() (+8 more)

### Community 13 - "types.ts"
Cohesion: 0.11
Nodes (22): REVIEW_TONE, sourceKindLabel(), SourceList(), SUPPORT_TONE, AnalysisDocument, CONFIDENCE_BY_SUPPORT, Contradiction, FactSource (+14 more)

### Community 14 - "start/page.tsx"
Cohesion: 0.12
Nodes (17): metadata, PageProps, StartPage(), ACCEPT, Chosen, StartPanel(), allMatterTypes, allPracticeAreas (+9 more)

### Community 15 - "confidentiality-check.mjs"
Cohesion: 0.09
Nodes (19): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, EGRESS_ALLOWED, EGRESS_PATTERNS, egressPattern (+11 more)

### Community 16 - "app-shell.tsx"
Cohesion: 0.12
Nodes (13): metadata, ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem (+5 more)

### Community 17 - "run.ts"
Cohesion: 0.13
Nodes (15): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+7 more)

### Community 18 - "settings.ts"
Cohesion: 0.13
Nodes (20): back(), POST(), back(), POST(), stringList(), AppLayout(), allFirmMembers(), countDeciders() (+12 more)

### Community 19 - "firms.ts"
Cohesion: 0.18
Nodes (13): POST(), DocumentsPage(), metadata, one(), PageProps, IntakePage(), metadata, metadata (+5 more)

### Community 20 - "activity/page.tsx"
Cohesion: 0.15
Nodes (17): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+9 more)

### Community 21 - "ai/page.tsx"
Cohesion: 0.19
Nodes (15): AiWorkspacePage(), featureLabel(), metadata, formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage() (+7 more)

### Community 22 - "[id]/page.tsx"
Cohesion: 0.12
Nodes (16): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+8 more)

### Community 23 - "app/page.tsx"
Cohesion: 0.16
Nodes (15): AdminSystemPage(), HomePage(), PHASE_LABEL, PHASE_TONE, currentPhase(), Phase, PHASES, PhaseStatus (+7 more)

### Community 24 - "analyst.ts"
Cohesion: 0.18
Nodes (17): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildWarnings(), DATE_SUBJECTS (+9 more)

### Community 25 - "settings/config.ts"
Cohesion: 0.21
Nodes (15): ADR-0015, ADR-0018, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING, firmDisplayName() (+7 more)

### Community 26 - "onboarding/config.ts"
Cohesion: 0.25
Nodes (15): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys() (+7 more)

### Community 27 - "fixtures.ts"
Cohesion: 0.24
Nodes (7): LOCKED_APPROVALS, FEATURES, createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture, NEW_FIRM

### Community 28 - "settings/page.tsx"
Cohesion: 0.21
Nodes (12): metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules(), MemberList(), MemberRow (+4 more)

### Community 29 - "parseIsoDate"
Cohesion: 0.33
Nodes (13): buildTimeline(), dateContradictions(), humanise(), intakeEcho(), labelOf(), build(), formatWritten(), isoDateWithin() (+5 more)

### Community 30 - "confidentiality.test.ts"
Cohesion: 0.26
Nodes (13): CLASS_DEFINITIONS, ClassDefinition, classify(), clientMaterialModels(), CONFIDENTIALITY_CLASSES, ConfidentialityClass, Enforcement, isClientMaterial() (+5 more)

### Community 31 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 32 - "matters/page.tsx"
Cohesion: 0.26
Nodes (12): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_TONE, StatusBadge() (+4 more)

### Community 33 - "provider.ts"
Cohesion: 0.30
Nodes (7): AIProvider, MockAIProvider, UnavailableAIProvider, AnalysisReviewInput, AnalysisReviewResult, MatterAnalysisInput, MatterAnalysisResult

### Community 34 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 35 - "reviewer.ts"
Cohesion: 0.21
Nodes (11): analystInternals, buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), ReviewCheck, ReviewIssue, CONFLICTED (+3 more)

### Community 36 - "ai-analyst.test.ts"
Cohesion: 0.22
Nodes (11): STANDING_WARNINGS, SUPPORT_LEVELS, supportCaveat(), DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, ALL_FEATURES (+3 more)

### Community 37 - "firm-scope.ts"
Cohesion: 0.29
Nodes (10): assertFirmScoped(), DATA_OPERATIONS, dataIsFirmScoped(), FIRM_SCOPED_MODELS, FirmScopeError, isRecord(), PLATFORM_MODELS, QueryArgs (+2 more)

### Community 38 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 39 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 40 - "new/page.tsx"
Cohesion: 0.24
Nodes (9): metadata, NewMatterPage(), PageProps, requireWorkspace(), requireWorkspacePermission(), GENERIC_MATTER_STATUSES, parseJsonObject(), parseStringArray() (+1 more)

### Community 41 - "scope.ts"
Cohesion: 0.20
Nodes (5): DraftFilters, listDrafts(), NewDraft, FirmScope, SearchResult

### Community 42 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 43 - "data/matters.ts"
Cohesion: 0.20
Nodes (9): POST(), createMatter(), getMatter(), listMatters(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter (+1 more)

### Community 44 - "cache.ts"
Cohesion: 0.29
Nodes (8): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError

### Community 45 - "env.ts"
Cohesion: 0.24
Nodes (8): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum()

### Community 46 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 47 - "format/dates.ts"
Cohesion: 0.40
Nodes (8): calendarDayIn(), firmTimezone(), formatMoment(), KNOWN_ZONES, timezoneLabel(), timezoneNotice(), toDate(), EVENING_IN_PACIFIC

### Community 48 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 49 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 50 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 51 - "demo.ts"
Cohesion: 0.29
Nodes (7): ADR-0016, POST(), addSampleMatters(), demonstrationInventory(), EMPTY_RESULT, SampleDataResult, sampleMattersFor()

### Community 52 - "not-found-notice.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 53 - "loopback.ts"
Cohesion: 0.46
Nodes (5): assertLoopback(), IPV6_LOOPBACK, isLoopback(), isLoopbackHost(), NotLoopbackError

### Community 55 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 59 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 60 - "separation.ts"
Cohesion: 0.60
Nodes (4): isSelfDecision(), judgeSeparation(), SeparationReadiness, SeparationVerdict

### Community 63 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 65 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **417 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `viewport` (+412 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `prisma.ts`, `fixtures.ts`, `firm-scope.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _417 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06451093951093952 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06947996589940324 - nodes in this community are weakly interconnected._
- **Should `scripts` be split into smaller, more focused modules?**
  _Cohesion score 0.046511627906976744 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05128205128205128 - nodes in this community are weakly interconnected._