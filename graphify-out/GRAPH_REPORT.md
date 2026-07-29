# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1129 nodes · 2616 edges · 68 communities (58 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e91af4c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- [id]/page.tsx
- firm-scope.ts
- approvals/page.tsx
- new/page.tsx
- scripts
- devDependencies
- allow
- compilerOptions
- login/actions.ts
- app-shell.tsx
- types.ts
- settings.ts
- [step]/page.tsx
- ui.tsx
- platform.ts
- prisma.ts
- run.ts
- app/page.tsx
- settings/page.tsx
- analyst.ts
- parseIsoDate
- onboarding/config.ts
- demo-accounts.ts
- provider.ts
- codemap.mjs
- data/matters.ts
- usage/page.tsx
- reviewer.ts
- docs-check.mjs
- ai-analyst.test.ts
- onboarding.ts
- env.ts
- audit.mjs
- doctor.mjs
- ai/page.tsx
- acceptance-check.mjs
- deny
- app.json
- demo.ts
- not-found-notice.tsx
- loading-screen.tsx
- skills-check.mjs
- settings.json
- approvals.spec.ts
- onboarding.spec.ts
- settings/config.ts
- accessibility.spec.ts
- app/layout.tsx
- analysis.spec.ts
- session-start.sh
- middleware.ts
- eslint.config.mjs
- next.config.ts
- playwright.config.ts
- postcss.config.mjs
- ALL_STATUSES

## God Nodes (most connected - your core abstractions)
1. `allow` - 39 edges
2. `scripts` - 35 edges
3. `Callout()` - 27 edges
4. `recordAuditEvent()` - 27 edges
5. `currentSession` - 27 edges
6. `Badge()` - 22 edges
7. `Card()` - 22 edges
8. `compilerOptions` - 22 edges
9. `activeFirmFor()` - 21 edges
10. `can()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `validateNewFirm()` --references--> `PRACTICE_AREAS`  [EXTRACTED]
  src/lib/platform/new-firm.ts → prisma/seed.ts
- `StepMatterTypes()` --calls--> `practiceAreaLabel()`  [EXTRACTED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/practice-areas.ts
- `StepSummary()` --indirect_call--> `practiceAreaLabel()`  [INFERRED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/practice-areas.ts
- `POST()` --indirect_call--> `buildApprovals()`  [INFERRED]
  src/app/api/onboarding/route.ts → src/lib/onboarding/config.ts

## Import Cycles
- None detected.

## Communities (68 total, 10 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (75): ADR-0006, CHANNELS, POST(), POST(), POST(), ACTIONS, POST(), stringList() (+67 more)

### Community 1 - "[id]/page.tsx"
Cohesion: 0.07
Nodes (56): ActivityPage(), metadata, one(), PageProps, DocumentsPage(), metadata, one(), PageProps (+48 more)

### Community 2 - "firm-scope.ts"
Cohesion: 0.06
Nodes (41): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+33 more)

### Community 3 - "approvals/page.tsx"
Cohesion: 0.08
Nodes (46): POST(), POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard() (+38 more)

### Community 4 - "new/page.tsx"
Cohesion: 0.06
Nodes (47): ADR-0002, POST(), metadata, NewMatterPage(), PageProps, ACCEPT, Chosen, UploadPanel() (+39 more)

### Community 5 - "scripts"
Cohesion: 0.05
Nodes (41): description, engines, node, name, private, scripts, acceptance:check, build (+33 more)

### Community 6 - "devDependencies"
Cohesion: 0.05
Nodes (39): axe-core, @axe-core/playwright, dotenv, eslint, eslint-config-next, jsdom, devDependencies, axe-core (+31 more)

### Community 7 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 9 - "login/actions.ts"
Cohesion: 0.11
Nodes (25): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget() (+17 more)

### Community 10 - "app-shell.tsx"
Cohesion: 0.10
Nodes (18): metadata, metadata, LoginPage(), metadata, safeNext(), ADMIN_NAV, ADMIN_PLANNED, AppShell() (+10 more)

### Community 11 - "types.ts"
Cohesion: 0.08
Nodes (31): AnalysisStatus(), AnalysisWarnings(), ContradictionCard(), KeyFactRow(), QuestionList(), REVIEW_TONE, ReviewPanel(), sourceKindLabel() (+23 more)

### Community 12 - "settings.ts"
Cohesion: 0.12
Nodes (23): back(), POST(), back(), POST(), stringList(), AppLayout(), allFirmMembers(), MembershipChange (+15 more)

### Community 13 - "[step]/page.tsx"
Cohesion: 0.09
Nodes (21): Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), CheckboxOption(), LockIcon(), ProgressBar() (+13 more)

### Community 14 - "ui.tsx"
Cohesion: 0.16
Nodes (19): AdminDemoPage(), metadata, AdminFirmsPage(), metadata, one(), PageProps, metadata, Field() (+11 more)

### Community 15 - "platform.ts"
Cohesion: 0.18
Nodes (16): POST(), FirmSwitcher(), ROLE_LABELS, CreatedFirm, createFirm(), CreateFirmOutcome, looksLikeRealAddress(), NewFirmInput (+8 more)

### Community 16 - "prisma.ts"
Cohesion: 0.12
Nodes (7): DraftFilters, NewDraft, NewDocument, GuardedPrismaClient, FirmScope, SearchResult, globalForPrisma

### Community 17 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+6 more)

### Community 18 - "app/page.tsx"
Cohesion: 0.16
Nodes (15): AdminSystemPage(), HomePage(), PHASE_LABEL, PHASE_TONE, currentPhase(), Phase, PHASES, PhaseStatus (+7 more)

### Community 19 - "settings/page.tsx"
Cohesion: 0.18
Nodes (14): ADR-0016, metadata, one(), PageProps, SettingsPage(), AccentChoice(), LockedRules(), MemberList() (+6 more)

### Community 20 - "analyst.ts"
Cohesion: 0.19
Nodes (16): analyseMatter(), AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildWarnings(), DATE_SUBJECTS (+8 more)

### Community 21 - "parseIsoDate"
Cohesion: 0.31
Nodes (14): buildTimeline(), dateContradictions(), humanise(), intakeEcho(), judgeSupport(), toKeyFact(), build(), formatWritten() (+6 more)

### Community 22 - "onboarding/config.ts"
Cohesion: 0.27
Nodes (14): LOCKED_APPROVAL_OPTIONS, resolveKey(), aiFeatureIdsFrom(), aiFeatureKeysFor(), buildApprovals(), buildConfiguration(), FirmConfigurationPayload, mapKeys() (+6 more)

### Community 23 - "demo-accounts.ts"
Cohesion: 0.22
Nodes (10): DECISIONS_REQUIRING_NOTE, isLockedApproval(), DEMO_ACCOUNTS, DemoAccount, visibleDemoAccounts(), GUIDE_STEPS, guideAccounts(), guideAccountsExist() (+2 more)

### Community 24 - "provider.ts"
Cohesion: 0.30
Nodes (7): AIProvider, MockAIProvider, UnavailableAIProvider, AnalysisReviewInput, AnalysisReviewResult, MatterAnalysisInput, MatterAnalysisResult

### Community 25 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 26 - "data/matters.ts"
Cohesion: 0.17
Nodes (11): POST(), addDocument(), createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter (+3 more)

### Community 27 - "usage/page.tsx"
Cohesion: 0.31
Nodes (10): formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage(), formatCost(), listUsageRecords(), UsageByMatter (+2 more)

### Community 28 - "reviewer.ts"
Cohesion: 0.21
Nodes (11): analystInternals, buildSummary(), CONCLUSION_PATTERNS, reviewAnalysis(), trim(), ReviewCheck, ReviewIssue, CONFLICTED (+3 more)

### Community 29 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 30 - "ai-analyst.test.ts"
Cohesion: 0.24
Nodes (10): STANDING_WARNINGS, SUPPORT_LEVELS, DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, ALL_FEATURES, demo() (+2 more)

### Community 31 - "onboarding.ts"
Cohesion: 0.24
Nodes (10): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), EMPTY_ANSWERS, ensureConfiguration(), matterTypeOptions() (+2 more)

### Community 32 - "env.ts"
Cohesion: 0.23
Nodes (9): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum() (+1 more)

### Community 33 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 34 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 35 - "ai/page.tsx"
Cohesion: 0.22
Nodes (6): AiWorkspacePage(), featureLabel(), metadata, listRecentAnalyses(), firmConfiguration(), AI_FEATURE_OPTIONS

### Community 36 - "acceptance-check.mjs"
Cohesion: 0.20
Nodes (8): byFile, cache, document, phases, problems, ROOT, sections, SOURCE

### Community 37 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 38 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 39 - "demo.ts"
Cohesion: 0.29
Nodes (7): POST(), addSampleMatters(), demonstrationInventory(), EMPTY_RESULT, SampleDataResult, sampleMattersFor(), ADR-0016

### Community 40 - "not-found-notice.tsx"
Cohesion: 0.32
Nodes (3): metadata, metadata, NotFoundNotice()

### Community 42 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 43 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 45 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 47 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

### Community 48 - "settings/config.ts"
Cohesion: 0.26
Nodes (11): ADR-0015, CONFIGURABLE_APPROVAL_OPTIONS, ACCENT_COLOURS, accentColour(), AccentColourKey, DEFAULT_BRANDING, firmDisplayName(), isSettingsSection() (+3 more)

### Community 49 - "accessibility.spec.ts"
Cohesion: 0.60
Nodes (4): audit(), expectNoViolations(), Page, signIn()

## Knowledge Gaps
- **381 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `PageProps` (+376 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **Why does `dependencies` connect `firm-scope.ts` to `scripts`?**
  _High betweenness centrality (0.100) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _381 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0685946041262564 - nodes in this community are weakly interconnected._
- **Should `[id]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06760316066725197 - nodes in this community are weakly interconnected._
- **Should `firm-scope.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05952380952380952 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07894736842105263 - nodes in this community are weakly interconnected._