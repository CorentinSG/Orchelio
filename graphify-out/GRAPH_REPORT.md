# Graph Report - .  (2026-08-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1342 nodes · 3160 edges · 83 communities (68 shown, 15 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.68)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5a59d05c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- approvals/page.tsx
- firm-scope.ts
- env.ts
- fields.ts
- scripts
- analyst.ts
- devDependencies
- allow
- compilerOptions
- mistral-provider.ts
- [step]/page.tsx
- [id]/page.tsx
- confidentiality-check.mjs
- local-provider.ts
- app-config.ts
- dashboard/page.tsx
- app/page.tsx
- run.ts
- settings.ts
- demo-accounts.ts
- platform.ts
- activity/page.tsx
- provider.ts
- settings/config.ts
- onboarding.ts
- ai-analyst.test.ts
- matters/page.tsx
- app-shell.tsx
- onboarding/config.ts
- firms.ts
- parseIsoDate
- seed.ts
- codemap.mjs
- Callout
- settings/page.tsx
- start-panel.tsx
- format/dates.ts
- docs-check.mjs
- doctor.mjs
- firms/page.tsx
- scope.ts
- audit.mjs
- acceptance-check.mjs
- deny
- app.json
- reviewer.ts
- approvals.spec.ts
- demo.ts
- not-found-notice.tsx
- data/matters.ts
- settings.spec.ts
- loading-screen.tsx
- skills-check.mjs
- data/documents.ts
- settings.json
- ai-smoke.mjs
- separation.ts
- onboarding.spec.ts
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
- 20260806162127_usage_record_carries_class_and_microeuros/migration.sql
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 37 edges
3. `Callout()` - 29 edges
4. `recordAuditEvent()` - 28 edges
5. `currentSession` - 27 edges
6. `Card()` - 24 edges
7. `can()` - 24 edges
8. `Badge()` - 23 edges
9. `actorFor()` - 23 edges
10. `ServerEnv` - 23 edges

## Surprising Connections (you probably didn't know these)
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `envFor()` --calls--> `parseServerEnv()`  [EXTRACTED]
  tests/unit/provider-notice.test.ts → src/lib/env.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts

## Import Cycles
- None detected.

## Communities (83 total, 15 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.06
Nodes (86): ADR-0006, CHANNELS, POST(), POST(), POST(), POST(), ACTIONS, POST() (+78 more)

### Community 1 - "approvals/page.tsx"
Cohesion: 0.07
Nodes (55): POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard(), ApprovalCardData (+47 more)

### Community 2 - "firm-scope.ts"
Cohesion: 0.05
Nodes (41): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+33 more)

### Community 3 - "env.ts"
Cohesion: 0.06
Nodes (47): ADR-0021, DashboardPage(), aiFeatureLabel(), MatterPage(), TABS, StepAiFeatures(), one(), SettingsPage() (+39 more)

### Community 4 - "fields.ts"
Cohesion: 0.07
Nodes (41): ADR-0002, ACCEPT, Chosen, UploadPanel(), BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS (+33 more)

### Community 5 - "scripts"
Cohesion: 0.05
Nodes (43): description, engines, node, name, private, scripts, acceptance:check, ai:smoke (+35 more)

### Community 6 - "analyst.ts"
Cohesion: 0.08
Nodes (40): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildWarnings(), DATE_SUBJECTS (+32 more)

### Community 7 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 8 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 9 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 10 - "mistral-provider.ts"
Cohesion: 0.10
Nodes (24): ADR-0014, localUsage(), MistralSettings, NOTHING_USED, ADR-0024, ADR-0025, ADR-0027, estimateMicroEuros() (+16 more)

### Community 11 - "[step]/page.tsx"
Cohesion: 0.08
Nodes (23): Answers, metadata, PageProps, CheckboxOption(), Field(), LockIcon(), ProgressBar(), StepActions() (+15 more)

### Community 12 - "[id]/page.tsx"
Cohesion: 0.12
Nodes (27): metadata, PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse(), STATUS_TONE, AnalysisStatus() (+19 more)

### Community 13 - "confidentiality-check.mjs"
Cohesion: 0.07
Nodes (26): classification, classified, classifiedBlock, CLIENT_MATERIAL, counts, DISPLAY_MODULES, EGRESS_ALLOWED, EGRESS_PATTERNS (+18 more)

### Community 14 - "local-provider.ts"
Cohesion: 0.12
Nodes (16): LocalModelSettings, NOTHING_USED, ADR-0023, ADR-0024, ADR-0027, withWarning(), withWarning(), factsMessage() (+8 more)

### Community 15 - "app-config.ts"
Cohesion: 0.13
Nodes (10): metadata, metadata, metadata, viewport, LoginPage(), metadata, safeNext(), OrchelioWordmark() (+2 more)

### Community 16 - "dashboard/page.tsx"
Cohesion: 0.15
Nodes (16): AiWorkspacePage(), featureLabel(), metadata, metadata, metadata, OPERATION_LABELS, reviewStatusLabel(), requireMatterAccess() (+8 more)

### Community 17 - "app/page.tsx"
Cohesion: 0.15
Nodes (17): AdminSystemPage(), metadata, HomePage(), PHASE_LABEL, PHASE_TONE, StatusDot(), currentPhase(), Phase (+9 more)

### Community 18 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, summariseForApproval(), beginAnalysis() (+6 more)

### Community 19 - "settings.ts"
Cohesion: 0.14
Nodes (19): back(), POST(), back(), POST(), stringList(), AppLayout(), allFirmMembers(), countDeciders() (+11 more)

### Community 20 - "demo-accounts.ts"
Cohesion: 0.15
Nodes (13): SignInState, INITIAL, LoginForm(), DECISIONS_REQUIRING_NOTE, isLockedApproval(), DEMO_ACCOUNTS, DemoAccount, visibleDemoAccounts() (+5 more)

### Community 21 - "platform.ts"
Cohesion: 0.23
Nodes (13): POST(), CreatedFirm, createFirm(), CreateFirmOutcome, looksLikeRealAddress(), NewFirmInput, NewFirmValidation, slugify() (+5 more)

### Community 22 - "activity/page.tsx"
Cohesion: 0.17
Nodes (14): ActivityPage(), metadata, one(), PageProps, metadata, requestScoped, requestNow, activityActions() (+6 more)

### Community 23 - "provider.ts"
Cohesion: 0.22
Nodes (10): LocalAIProvider, MistralAIProvider, AIProvider, MockAIProvider, ADR-0027, UnavailableAIProvider, TaskClass, AnalysisReviewInput (+2 more)

### Community 24 - "settings/config.ts"
Cohesion: 0.21
Nodes (15): ADR-0015, ADR-0018, ACCENT_COLOURS, accentColour(), AccentColourKey, configurableApprovalKeys(), DEFAULT_BRANDING, firmDisplayName() (+7 more)

### Community 25 - "onboarding.ts"
Cohesion: 0.18
Nodes (15): POST(), stringList(), allMatterTypes, allPracticeAreas, allWorkflowTemplates, workflowTemplatesFor(), completeOnboarding(), EMPTY_ANSWERS (+7 more)

### Community 26 - "ai-analyst.test.ts"
Cohesion: 0.16
Nodes (12): STANDING_WARNINGS, SUPPORT_LEVELS, supportCaveat(), DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, NOW (+4 more)

### Community 27 - "matters/page.tsx"
Cohesion: 0.23
Nodes (13): metadata, NewMatterPage(), PageProps, MattersPage(), metadata, one(), PageProps, MatterLink() (+5 more)

### Community 28 - "app-shell.tsx"
Cohesion: 0.14
Nodes (13): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+5 more)

### Community 29 - "onboarding/config.ts"
Cohesion: 0.27
Nodes (14): resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys(), OnboardingAnswers (+6 more)

### Community 30 - "firms.ts"
Cohesion: 0.17
Nodes (10): POST(), DocumentsPage(), metadata, one(), PageProps, IntakePage(), TasksPage(), fileSize() (+2 more)

### Community 31 - "parseIsoDate"
Cohesion: 0.33
Nodes (13): buildTimeline(), dateContradictions(), humanise(), intakeEcho(), labelOf(), build(), formatWritten(), isoDateWithin() (+5 more)

### Community 32 - "seed.ts"
Cohesion: 0.23
Nodes (11): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, encode() (+3 more)

### Community 33 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 34 - "Callout"
Cohesion: 0.23
Nodes (9): metadata, metadata, PageProps, Callout(), listIntakes(), matterTypesForPracticeAreas(), parseJsonObject(), parseStringArray() (+1 more)

### Community 35 - "settings/page.tsx"
Cohesion: 0.24
Nodes (10): metadata, PageProps, AccentChoice(), LockedRules(), MemberList(), MemberRow, ReadOnlyNotice(), SaveBar() (+2 more)

### Community 36 - "start-panel.tsx"
Cohesion: 0.18
Nodes (9): StartPage(), ACCEPT, Chosen, StartPanel(), blockingReason(), GuidedInput, GuidedReadiness, GuidedStep (+1 more)

### Community 37 - "format/dates.ts"
Cohesion: 0.35
Nodes (11): UnconfirmedDate(), calendarDayIn(), daysBetween(), firmTimezone(), formatDate(), formatMoment(), KNOWN_ZONES, timezoneLabel() (+3 more)

### Community 38 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 39 - "doctor.mjs"
Cohesion: 0.18
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 40 - "firms/page.tsx"
Cohesion: 0.26
Nodes (10): AdminDemoPage(), metadata, AdminFirmsPage(), metadata, one(), PageProps, CommandLine(), listFirmsForAdministration() (+2 more)

### Community 41 - "scope.ts"
Cohesion: 0.20
Nodes (5): DraftFilters, listDrafts(), NewDraft, FirmScope, SearchResult

### Community 42 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 43 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 44 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 45 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 46 - "reviewer.ts"
Cohesion: 0.31
Nodes (8): analystInternals, assertsAnOutcome(), buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), ReviewCheck, ReviewIssue

### Community 47 - "approvals.spec.ts"
Cohesion: 0.31
Nodes (4): analyseTwice(), openMatter(), runAnalysis(), tabs()

### Community 48 - "demo.ts"
Cohesion: 0.29
Nodes (7): ADR-0016, POST(), addSampleMatters(), demonstrationInventory(), EMPTY_RESULT, SampleDataResult, sampleMattersFor()

### Community 49 - "not-found-notice.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 50 - "data/matters.ts"
Cohesion: 0.25
Nodes (6): getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 53 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 55 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 56 - "ai-smoke.mjs"
Cohesion: 0.33
Nodes (3): env, ADR-0027, ROOT

### Community 57 - "separation.ts"
Cohesion: 0.60
Nodes (4): isSelfDecision(), judgeSeparation(), SeparationReadiness, SeparationVerdict

### Community 60 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 61 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **455 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `viewport` (+450 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **Why does `dependencies` connect `firm-scope.ts` to `scripts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _455 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.057399230878792194 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07111501316944688 - nodes in this community are weakly interconnected._
- **Should `firm-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.054098360655737705 - nodes in this community are weakly interconnected._
- **Should `env.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0647307924984876 - nodes in this community are weakly interconnected._