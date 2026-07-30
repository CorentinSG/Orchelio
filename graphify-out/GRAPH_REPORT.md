# Graph Report - .  (2026-07-30)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1203 nodes · 2775 edges · 78 communities (66 shown, 12 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d3d50885`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- approvals/page.tsx
- fields.ts
- login/page.tsx
- scripts
- devDependencies
- allow
- firms/page.tsx
- compilerOptions
- ui.tsx
- [step]/page.tsx
- matters/page.tsx
- ai/page.tsx
- [id]/page.tsx
- app-shell.tsx
- run.ts
- confidentiality-check.mjs
- settings.ts
- settings/config.ts
- types.ts
- activity/page.tsx
- settings/page.tsx
- analyst.ts
- onboarding/config.ts
- dashboard/page.tsx
- confidentiality.test.ts
- fixtures.ts
- parseIsoDate
- dependencies
- provider.ts
- codemap.mjs
- reviewer.ts
- firm-scope.ts
- docs-check.mjs
- doctor.mjs
- ai-analyst.test.ts
- onboarding.ts
- scope.ts
- env.ts
- audit.mjs
- cache.ts
- acceptance-check.mjs
- documents/page.tsx
- prisma.ts
- deny
- app.json
- system-status.ts
- rate-limit.ts
- data/matters.ts
- approvals.spec.ts
- demo.ts
- skills-check.mjs
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
3. `Callout()` - 28 edges
4. `recordAuditEvent()` - 27 edges
5. `currentSession` - 27 edges
6. `Badge()` - 23 edges
7. `Card()` - 23 edges
8. `can()` - 22 edges
9. `compilerOptions` - 22 edges
10. `activeFirmFor()` - 21 edges

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

## Communities (78 total, 12 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (79): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, POST(), stringList() (+71 more)

### Community 1 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (56): POST(), POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, aiFeatureLabel() (+48 more)

### Community 2 - "fields.ts"
Cohesion: 0.06
Nodes (44): ADR-0002, POST(), POST(), ACCEPT, Chosen, UploadPanel(), ALLOWED_DOCUMENT_EXTENSIONS, BY_PRACTICE_AREA (+36 more)

### Community 3 - "login/page.tsx"
Cohesion: 0.06
Nodes (25): ADR-0011, metadata, metadata, SignInState, INITIAL, LoginForm(), LoginPage(), metadata (+17 more)

### Community 4 - "scripts"
Cohesion: 0.05
Nodes (42): description, engines, node, name, private, scripts, acceptance:check, build (+34 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 6 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 7 - "firms/page.tsx"
Cohesion: 0.10
Nodes (29): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, POST() (+21 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 9 - "ui.tsx"
Cohesion: 0.13
Nodes (21): metadata, metadata, metadata, HomePage(), PHASE_LABEL, PHASE_TONE, CLASS_TONE, MODEL_LABELS (+13 more)

### Community 10 - "[step]/page.tsx"
Cohesion: 0.10
Nodes (19): Answers, metadata, PageProps, CheckboxOption(), Field(), LockIcon(), ProgressBar(), StepActions() (+11 more)

### Community 11 - "matters/page.tsx"
Cohesion: 0.16
Nodes (20): IntakePage(), metadata, MattersPage(), metadata, one(), PageProps, metadata, TasksPage() (+12 more)

### Community 12 - "ai/page.tsx"
Cohesion: 0.16
Nodes (16): AiWorkspacePage(), featureLabel(), metadata, formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage() (+8 more)

### Community 13 - "[id]/page.tsx"
Cohesion: 0.13
Nodes (19): metadata, PageProps, AnalysisStatus(), AnalysisWarnings(), ContradictionCard(), QuestionList(), REVIEW_TONE, ReviewPanel() (+11 more)

### Community 14 - "app-shell.tsx"
Cohesion: 0.11
Nodes (18): StepMatterTypes(), StepSummary(), ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem (+10 more)

### Community 15 - "run.ts"
Cohesion: 0.13
Nodes (16): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+8 more)

### Community 16 - "confidentiality-check.mjs"
Cohesion: 0.09
Nodes (19): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, EGRESS_ALLOWED, EGRESS_PATTERNS, egressPattern (+11 more)

### Community 17 - "settings.ts"
Cohesion: 0.15
Nodes (19): back(), POST(), back(), POST(), stringList(), isSelfDecision(), judgeSeparation(), SeparationReadiness (+11 more)

### Community 18 - "settings/config.ts"
Cohesion: 0.18
Nodes (17): ADR-0015, ADR-0018, CONFIGURABLE_APPROVAL_OPTIONS, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING (+9 more)

### Community 19 - "types.ts"
Cohesion: 0.11
Nodes (18): KeyFactRow(), AnalysisDocument, CONFIDENCE_BY_SUPPORT, Contradiction, FactSource, KeyFact, MissingDocument, Question (+10 more)

### Community 20 - "activity/page.tsx"
Cohesion: 0.20
Nodes (15): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+7 more)

### Community 21 - "settings/page.tsx"
Cohesion: 0.18
Nodes (15): AppLayout(), metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules(), MemberList() (+7 more)

### Community 22 - "analyst.ts"
Cohesion: 0.19
Nodes (17): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildWarnings(), DATE_SUBJECTS (+9 more)

### Community 23 - "onboarding/config.ts"
Cohesion: 0.24
Nodes (16): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys() (+8 more)

### Community 24 - "dashboard/page.tsx"
Cohesion: 0.17
Nodes (11): metadata, metadata, NewMatterPage(), PageProps, recordViewEvent(), requireWorkspace(), requireWorkspacePermission(), parseJsonObject() (+3 more)

### Community 25 - "confidentiality.test.ts"
Cohesion: 0.21
Nodes (15): ConfidentialityReport(), describe(), CLASS_DEFINITIONS, ClassDefinition, classify(), clientMaterialModels(), CONFIDENTIALITY_CLASSES, ConfidentialityClass (+7 more)

### Community 26 - "fixtures.ts"
Cohesion: 0.24
Nodes (7): LOCKED_APPROVALS, FEATURES, createTwoFirmFixture(), FirmFixture, seedFirm(), TwoFirmFixture, NEW_FIRM

### Community 27 - "parseIsoDate"
Cohesion: 0.33
Nodes (13): buildTimeline(), dateContradictions(), humanise(), intakeEcho(), labelOf(), build(), formatWritten(), isoDateWithin() (+5 more)

### Community 28 - "dependencies"
Cohesion: 0.14
Nodes (14): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+6 more)

### Community 29 - "provider.ts"
Cohesion: 0.30
Nodes (7): AIProvider, MockAIProvider, UnavailableAIProvider, AnalysisReviewInput, AnalysisReviewResult, MatterAnalysisInput, MatterAnalysisResult

### Community 30 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 31 - "reviewer.ts"
Cohesion: 0.21
Nodes (11): analystInternals, buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), ReviewCheck, ReviewIssue, CONFLICTED (+3 more)

### Community 32 - "firm-scope.ts"
Cohesion: 0.29
Nodes (10): assertFirmScoped(), DATA_OPERATIONS, dataIsFirmScoped(), FIRM_SCOPED_MODELS, FirmScopeError, isRecord(), PLATFORM_MODELS, QueryArgs (+2 more)

### Community 33 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 34 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 35 - "ai-analyst.test.ts"
Cohesion: 0.24
Nodes (10): STANDING_WARNINGS, SUPPORT_LEVELS, DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, ALL_FEATURES, demo() (+2 more)

### Community 36 - "onboarding.ts"
Cohesion: 0.24
Nodes (10): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), EMPTY_ANSWERS, ensureConfiguration(), matterTypeOptions() (+2 more)

### Community 37 - "scope.ts"
Cohesion: 0.20
Nodes (5): DraftFilters, listDrafts(), NewDraft, FirmScope, SearchResult

### Community 38 - "env.ts"
Cohesion: 0.23
Nodes (9): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum() (+1 more)

### Community 39 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 40 - "cache.ts"
Cohesion: 0.29
Nodes (8): CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache(), platformCatalogue(), UncacheableModelError

### Community 41 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 42 - "documents/page.tsx"
Cohesion: 0.36
Nodes (9): DocumentsPage(), metadata, one(), PageProps, fileSize(), listDocuments(), listMatters(), categoriesFor() (+1 more)

### Community 43 - "prisma.ts"
Cohesion: 0.20
Nodes (3): NewDocument, GuardedPrismaClient, globalForPrisma

### Community 44 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 45 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 46 - "system-status.ts"
Cohesion: 0.28
Nodes (8): AdminSystemPage(), DatabaseStatus, describeFailure(), getDatabaseStatus(), getSystemStatus(), listFirms(), MigrationRow, SystemStatus

### Community 47 - "rate-limit.ts"
Cohesion: 0.33
Nodes (7): consumeAttempt(), RateLimitResult, resetAllAttempts(), resetAttempts(), Window, windowFor(), windows

### Community 48 - "data/matters.ts"
Cohesion: 0.25
Nodes (7): createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 49 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 50 - "demo.ts"
Cohesion: 0.29
Nodes (7): ADR-0016, POST(), addSampleMatters(), demonstrationInventory(), EMPTY_RESULT, SampleDataResult, sampleMattersFor()

### Community 51 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 53 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 56 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 57 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **409 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `PageProps` (+404 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `dependencies` to `firm-scope.ts`, `fixtures.ts`, `prisma.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `scripts`?**
  _High betweenness centrality (0.094) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _409 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06659870880054367 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07319347319347319 - nodes in this community are weakly interconnected._
- **Should `fields.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05731523378582202 - nodes in this community are weakly interconnected._
- **Should `login/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06285714285714286 - nodes in this community are weakly interconnected._