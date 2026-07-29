# Graph Report - .  (2026-07-29)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1102 nodes · 2601 edges · 63 communities (53 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `60a83873`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- constants.ts
- analyst.ts
- approvals/page.tsx
- [step]/page.tsx
- firm-scope.ts
- settings.ts
- scripts
- allow
- compilerOptions
- devDependencies
- login/actions.ts
- Callout
- matters/page.tsx
- [id]/page.tsx
- fields.ts
- ui.tsx
- run.ts
- platform.ts
- prisma.ts
- activity/page.tsx
- app/page.tsx
- settings/page.tsx
- demo-accounts.ts
- widgets.ts
- usage/page.tsx
- new/page.tsx
- codemap.mjs
- ai/page.tsx
- docs-check.mjs
- env.ts
- audit.mjs
- doctor.mjs
- data/matters.ts
- deny
- app.json
- data/documents.ts
- documents/page.tsx
- loading-screen.tsx
- skills-check.mjs
- upload-panel.tsx
- settings.json
- approvals.spec.ts
- onboarding.spec.ts
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
2. `scripts` - 33 edges
3. `currentSession` - 28 edges
4. `Callout()` - 27 edges
5. `recordAuditEvent()` - 27 edges
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

## Communities (63 total, 10 thin omitted)

### Community 0 - "constants.ts"
Cohesion: 0.07
Nodes (76): ADR-0006, CHANNELS, POST(), POST(), ADR-0016, POST(), POST(), ACTIONS (+68 more)

### Community 1 - "analyst.ts"
Cohesion: 0.05
Nodes (73): analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions(), buildAttorneyQuestions(), buildClientQuestions(), buildSummary(), buildTimeline() (+65 more)

### Community 2 - "approvals/page.tsx"
Cohesion: 0.08
Nodes (48): POST(), POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard() (+40 more)

### Community 3 - "[step]/page.tsx"
Cohesion: 0.06
Nodes (46): Answers, metadata, PageProps, StepMatterTypes(), StepSummary(), CheckboxOption(), LockIcon(), ProgressBar() (+38 more)

### Community 4 - "firm-scope.ts"
Cohesion: 0.06
Nodes (41): next, dependencies, next, @prisma/adapter-better-sqlite3, @prisma/client, react, react-dom, server-only (+33 more)

### Community 5 - "settings.ts"
Cohesion: 0.06
Nodes (48): ADR-0015, back(), POST(), back(), POST(), stringList(), AppLayout(), one() (+40 more)

### Community 6 - "scripts"
Cohesion: 0.05
Nodes (39): description, engines, node, name, private, scripts, build, check (+31 more)

### Community 7 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 9 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 10 - "login/actions.ts"
Cohesion: 0.13
Nodes (21): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, Step, WORKFLOW_TEMPLATES, safeRedirectTarget(), signInAction() (+13 more)

### Community 11 - "Callout"
Cohesion: 0.14
Nodes (11): metadata, metadata, LoginPage(), metadata, safeNext(), metadata, OrchelioWordmark(), WordmarkProps (+3 more)

### Community 12 - "matters/page.tsx"
Cohesion: 0.15
Nodes (21): IntakePage(), metadata, MattersPage(), metadata, one(), PageProps, metadata, TasksPage() (+13 more)

### Community 13 - "[id]/page.tsx"
Cohesion: 0.13
Nodes (23): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, AnalysisStatus(), AnalysisWarnings(), ContradictionCard() (+15 more)

### Community 14 - "fields.ts"
Cohesion: 0.16
Nodes (21): ADR-0002, NewMatterPage(), BY_PRACTICE_AREA, categoriesFor(), EMPLOYMENT_CATEGORIES, expectedButMissing(), IMMIGRATION_CATEGORIES, isKnownCategory() (+13 more)

### Community 15 - "ui.tsx"
Cohesion: 0.15
Nodes (20): AdminDemoPage(), metadata, ADR-0016, AdminFirmsPage(), metadata, one(), PageProps, AdminSystemPage() (+12 more)

### Community 16 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+6 more)

### Community 17 - "platform.ts"
Cohesion: 0.20
Nodes (15): PRACTICE_AREAS, POST(), CreatedFirm, createFirm(), CreateFirmOutcome, creatablePracticeAreas(), looksLikeRealAddress(), NewFirmInput (+7 more)

### Community 18 - "prisma.ts"
Cohesion: 0.13
Nodes (9): DraftFilters, NewDraft, EMPTY_RESULT, SampleDataResult, ADR-0016, GuardedPrismaClient, FirmScope, SearchResult (+1 more)

### Community 19 - "activity/page.tsx"
Cohesion: 0.20
Nodes (15): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), activityLabel(), ActivityStatusBadge(), safeParse() (+7 more)

### Community 20 - "app/page.tsx"
Cohesion: 0.18
Nodes (15): HomePage(), PHASE_LABEL, PHASE_TONE, practiceAreaLabel(), currentPhase(), Phase, PHASES, PhaseStatus (+7 more)

### Community 21 - "settings/page.tsx"
Cohesion: 0.20
Nodes (14): DemonstrationSection(), metadata, PageProps, ADR-0016, AccentChoice(), LockedRules(), MemberList(), MemberRow (+6 more)

### Community 22 - "demo-accounts.ts"
Cohesion: 0.19
Nodes (10): SignInState, INITIAL, LoginForm(), DEMO_ACCOUNTS, DemoAccount, GUIDE_STEPS, guideAccounts(), guideAccountsExist() (+2 more)

### Community 23 - "widgets.ts"
Cohesion: 0.16
Nodes (13): BY_PRACTICE_AREA, DashboardWidget, EMPLOYMENT_WIDGETS, IMMIGRATION_WIDGETS, SHARED_WIDGETS, ADR-0009, widgetsFor(), WidgetTone (+5 more)

### Community 24 - "usage/page.tsx"
Cohesion: 0.27
Nodes (11): DashboardPage(), formatTokens(), metadata, OPERATION_LABELS, operationLabel(), UsagePage(), formatCost(), listUsageRecords() (+3 more)

### Community 25 - "new/page.tsx"
Cohesion: 0.21
Nodes (10): metadata, PageProps, GENERIC_MATTER_STATUSES, DISCRIMINATION_TYPES, practiceAreaCounts(), parseJsonObject(), parseStringArray(), toJsonColumn() (+2 more)

### Community 26 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 27 - "ai/page.tsx"
Cohesion: 0.18
Nodes (8): AiWorkspacePage(), featureLabel(), metadata, requireWorkspace(), requireWorkspacePermission(), listRecentAnalyses(), firmConfiguration(), AI_FEATURE_OPTIONS

### Community 28 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 29 - "env.ts"
Cohesion: 0.23
Nodes (9): AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv(), readEnum() (+1 more)

### Community 30 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 31 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 32 - "data/matters.ts"
Cohesion: 0.22
Nodes (8): POST(), createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 33 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 34 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 35 - "data/documents.ts"
Cohesion: 0.22
Nodes (4): POST(), addDocument(), NewDocument, touchMatter()

### Community 36 - "documents/page.tsx"
Cohesion: 0.36
Nodes (8): DocumentsPage(), metadata, one(), PageProps, fileSize(), listDocuments(), listMatters(), categoryLabel()

### Community 38 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 39 - "upload-panel.tsx"
Cohesion: 0.29
Nodes (5): ACCEPT, Chosen, UploadPanel(), ALLOWED_DOCUMENT_EXTENSIONS, DocumentCategory

### Community 40 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 42 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 44 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **371 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `PageProps` (+366 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `dependencies` connect `firm-scope.ts` to `scripts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _371 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.0685946041262564 - nodes in this community are weakly interconnected._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05172413793103448 - nodes in this community are weakly interconnected._
- **Should `approvals/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07656341320864991 - nodes in this community are weakly interconnected._
- **Should `[step]/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06312098188194039 - nodes in this community are weakly interconnected._