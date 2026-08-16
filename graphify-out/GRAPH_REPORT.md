# Graph Report - .  (2026-08-16)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1342 nodes · 3187 edges · 81 communities (65 shown, 16 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ea5fce75`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- approvals/page.tsx
- run.ts
- ai/page.tsx
- scripts
- devDependencies
- local-provider.ts
- allow
- compilerOptions
- analyst.ts
- types.ts
- [step]/page.tsx
- login/actions.ts
- firms/page.tsx
- onboarding/config.ts
- confidentiality-check.mjs
- Callout
- matters/page.tsx
- local-provider.test.ts
- settings.ts
- settings/config.ts
- start/page.tsx
- new/page.tsx
- firms.ts
- confidentiality-ui.tsx
- mistral-provider.test.ts
- activity/page.tsx
- settings/page.tsx
- demo-accounts.ts
- statistics.ts
- ui.tsx
- app/page.tsx
- provider.ts
- widgets.ts
- app-shell.tsx
- fixtures.ts
- reviewer.ts
- dependencies
- codemap.mjs
- [id]/page.tsx
- firm-scope.ts
- docs-check.mjs
- doctor.mjs
- format/dates.ts
- audit.mjs
- cache.ts
- acceptance-check.mjs
- deny
- app.json
- approvals.spec.ts
- settings.spec.ts
- loading-screen.tsx
- skills-check.mjs
- (app)/not-found.tsx
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
- 20260806162127_usage_record_carries_class_and_microeuros/migration.sql
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 37 edges
3. `Callout()` - 29 edges
4. `recordAuditEvent()` - 25 edges
5. `currentSession` - 25 edges
6. `Card()` - 24 edges
7. `Badge()` - 23 edges
8. `can()` - 23 edges
9. `analyseMatter()` - 23 edges
10. `formatDate()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `acceptableSummary()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/local-provider.test.ts → src/lib/ai/analyst.ts
- `acceptableSummary()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/mistral-provider.test.ts → src/lib/ai/analyst.ts
- `matterInput()` --references--> `DEMO_MATTERS`  [EXTRACTED]
  tests/integration/local-model.test.ts → src/lib/demo/matters.ts
- `moreau()` --references--> `DEMO_MATTERS`  [EXTRACTED]
  tests/unit/local-provider.test.ts → src/lib/demo/matters.ts

## Import Cycles
- None detected.

## Communities (81 total, 16 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (71): ADR-0006, CHANNELS, POST(), POST(), POST(), POST(), ACTIONS, metadata (+63 more)

### Community 1 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (58): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+50 more)

### Community 2 - "run.ts"
Cohesion: 0.05
Nodes (31): ADR-0008, POST(), POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, summariseForApproval() (+23 more)

### Community 3 - "ai/page.tsx"
Cohesion: 0.08
Nodes (36): ADR-0021, AiWorkspacePage(), analysisStateLabel(), featureLabel(), metadata, formatTokens(), metadata, OPERATION_LABELS (+28 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (43): description, engines, node, name, private, scripts, acceptance:check, ai:smoke (+35 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 6 - "local-provider.ts"
Cohesion: 0.11
Nodes (28): ADR-0014, ADR-0023, LocalModelSettings, localUsage(), NOTHING_USED, ADR-0024, ADR-0027, withWarning() (+20 more)

### Community 7 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 9 - "analyst.ts"
Cohesion: 0.15
Nodes (31): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline(), buildWarnings() (+23 more)

### Community 10 - "types.ts"
Cohesion: 0.09
Nodes (29): AnalysisWarnings(), ContradictionCard(), KeyFactRow(), QuestionList(), REVIEW_TONE, ReviewPanel(), sourceKindLabel(), SourceList() (+21 more)

### Community 11 - "[step]/page.tsx"
Cohesion: 0.09
Nodes (22): Answers, metadata, PageProps, StepAiFeatures(), StepMatterTypes(), StepSummary(), CheckboxOption(), Field() (+14 more)

### Community 12 - "login/actions.ts"
Cohesion: 0.11
Nodes (22): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, newCorrelationId() (+14 more)

### Community 13 - "firms/page.tsx"
Cohesion: 0.16
Nodes (21): POST(), AdminFirmsPage(), metadata, onboardingLabel(), one(), PageProps, CreatedFirm, createFirm() (+13 more)

### Community 14 - "onboarding/config.ts"
Cohesion: 0.17
Nodes (24): POST(), stringList(), completeOnboarding(), EMPTY_ANSWERS, ensureConfiguration(), loadDraft(), OnboardingDraft, restartOnboarding() (+16 more)

### Community 15 - "confidentiality-check.mjs"
Cohesion: 0.08
Nodes (23): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, DISPLAY_MODULES, EGRESS_ALLOWED, EGRESS_PATTERNS (+15 more)

### Community 16 - "Callout"
Cohesion: 0.16
Nodes (10): metadata, metadata, LoginPage(), metadata, safeNext(), OrchelioWordmark(), WordmarkProps, DemoBanner() (+2 more)

### Community 17 - "matters/page.tsx"
Cohesion: 0.13
Nodes (19): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_LABELS, STATUS_TONE (+11 more)

### Community 18 - "local-provider.test.ts"
Cohesion: 0.11
Nodes (17): STANDING_WARNINGS, SUPPORT_LEVELS, DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, matterInput(), NOW (+9 more)

### Community 19 - "settings.ts"
Cohesion: 0.13
Nodes (20): back(), POST(), AppLayout(), isSelfDecision(), judgeSeparation(), SeparationReadiness, SeparationVerdict, allFirmMembers() (+12 more)

### Community 20 - "settings/config.ts"
Cohesion: 0.15
Nodes (20): ADR-0015, ADR-0018, back(), POST(), stringList(), AppShell(), CONFIGURABLE_APPROVAL_OPTIONS, ACCENT_COLOURS (+12 more)

### Community 21 - "start/page.tsx"
Cohesion: 0.13
Nodes (16): metadata, PageProps, StartPage(), ACCEPT, Chosen, StartPanel(), allMatterTypes, allPracticeAreas (+8 more)

### Community 22 - "new/page.tsx"
Cohesion: 0.14
Nodes (18): ADR-0002, POST(), metadata, NewMatterPage(), PageProps, GENERIC_MATTER_STATUSES, BY_PRACTICE_AREA, editableFieldsFor() (+10 more)

### Community 23 - "firms.ts"
Cohesion: 0.15
Nodes (14): POST(), DocumentsPage(), metadata, one(), PageProps, IntakePage(), metadata, TasksPage() (+6 more)

### Community 24 - "confidentiality-ui.tsx"
Cohesion: 0.20
Nodes (17): CLASS_TONE, ConfidentialityReport(), describe(), MODEL_LABELS, CLASS_DEFINITIONS, ClassDefinition, classify(), clientMaterialModels() (+9 more)

### Community 25 - "mistral-provider.test.ts"
Cohesion: 0.12
Nodes (12): env, ROOT, estimateMicroEuros(), microEurosToCents(), MISTRAL_MODEL_BY_CLASS, MISTRAL_PRICES, TASK_CLASSES, ADR-0027 (+4 more)

### Community 26 - "activity/page.tsx"
Cohesion: 0.16
Nodes (16): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+8 more)

### Community 27 - "settings/page.tsx"
Cohesion: 0.16
Nodes (16): OnboardingStepPage(), metadata, one(), PageProps, SettingsPage(), ADR-0016, AccentChoice(), LockedRules() (+8 more)

### Community 28 - "demo-accounts.ts"
Cohesion: 0.16
Nodes (12): safeRedirectTarget(), signInAction(), SignInState, INITIAL, LoginForm(), DEMO_ACCOUNTS, DemoAccount, GUIDE_STEPS (+4 more)

### Community 29 - "statistics.ts"
Cohesion: 0.18
Nodes (14): ACCEPT, Chosen, UploadPanel(), DISCRIMINATION_TYPES, practiceAreaCounts(), BY_PRACTICE_AREA, categoriesFor(), DocumentCategory (+6 more)

### Community 30 - "ui.tsx"
Cohesion: 0.19
Nodes (13): metadata, ADR-0016, metadata, metadata, Badge(), badgeTone, calloutTone, Card() (+5 more)

### Community 31 - "app/page.tsx"
Cohesion: 0.18
Nodes (14): HomePage(), PHASE_LABEL, PHASE_TONE, currentPhase(), Phase, PHASES, PhaseStatus, DatabaseStatus (+6 more)

### Community 32 - "provider.ts"
Cohesion: 0.22
Nodes (9): LocalAIProvider, MistralAIProvider, AIProvider, MockAIProvider, UnavailableAIProvider, TaskClass, AnalysisReviewInput, ReviewerRun (+1 more)

### Community 33 - "widgets.ts"
Cohesion: 0.16
Nodes (14): ADR-0009, DashboardPage(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, widgetsFor() (+6 more)

### Community 34 - "app-shell.tsx"
Cohesion: 0.14
Nodes (13): AdminDemoPage(), signOutAction(), ADMIN_NAV, ADMIN_PLANNED, FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem (+5 more)

### Community 35 - "fixtures.ts"
Cohesion: 0.24
Nodes (7): LOCKED_APPROVALS, FEATURES, createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture, NEW_FIRM

### Community 36 - "reviewer.ts"
Cohesion: 0.17
Nodes (13): analystInternals, buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), AnalysisReviewResult, MatterAnalysisResult, ReviewCheck (+5 more)

### Community 37 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 38 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 39 - "[id]/page.tsx"
Cohesion: 0.21
Nodes (11): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), requestScoped, requestNow (+3 more)

### Community 40 - "firm-scope.ts"
Cohesion: 0.29
Nodes (10): assertFirmScoped(), DATA_OPERATIONS, dataIsFirmScoped(), FIRM_SCOPED_MODELS, FirmScopeError, isRecord(), PLATFORM_MODELS, QueryArgs (+2 more)

### Community 41 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 42 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 43 - "format/dates.ts"
Cohesion: 0.35
Nodes (10): calendarDayIn(), daysBetween(), firmTimezone(), formatMoment(), KNOWN_ZONES, timezoneLabel(), timezoneNotice(), toDate() (+2 more)

### Community 44 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 45 - "cache.ts"
Cohesion: 0.29
Nodes (8): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError

### Community 46 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 47 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 48 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 49 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 52 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 53 - "(app)/not-found.tsx"
Cohesion: 0.29
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 55 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 59 - "accessibility.spec.ts"
Cohesion: 0.50
Nodes (3): audit(), expectNoViolations(), Page

## Knowledge Gaps
- **455 isolated node(s):** `eslintConfig`, `PORT`, `config`, `badgeTone`, `calloutTone` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `firm-scope.ts`, `run.ts`, `fixtures.ts`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07244212098581031 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06881287726358148 - nodes in this community are weakly interconnected._
- **Should `run.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05450733752620545 - nodes in this community are weakly interconnected._
- **Should `ai/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08418367346938775 - nodes in this community are weakly interconnected._