# Graph Report - .  (2026-07-28)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 977 nodes · 2154 edges · 64 communities (54 shown, 10 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.7)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `160c70a8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- analyst.ts
- dashboard/page.tsx
- constants.ts
- fields.ts
- firm-scope.ts
- allow
- compilerOptions
- devDependencies
- scripts
- env.ts
- [id]/page.tsx
- run.ts
- brand.tsx
- config.ts
- activity/page.tsx
- [step]/page.tsx
- ui.tsx
- login/actions.ts
- app-shell.tsx
- codemap.mjs
- intake/page.tsx
- matters/page.tsx
- onboarding.ts
- docs-check.mjs
- practice-areas.ts
- login/page.tsx
- audit.mjs
- dependencies
- doctor.mjs
- new/page.tsx
- scope.ts
- catalogue.ts
- deny
- app.json
- seed.ts
- data/documents.ts
- ai/page.tsx
- documents/page.tsx
- matters.ts
- prisma.ts
- loading-screen.tsx
- package.json
- skills-check.mjs
- communications.ts
- settings.json
- password.ts
- approvals.spec.ts
- onboarding.spec.ts
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
3. `currentSession` - 24 edges
4. `recordAuditEvent()` - 23 edges
5. `compilerOptions` - 22 edges
6. `Callout()` - 21 edges
7. `activeFirmFor()` - 19 edges
8. `actorFor()` - 18 edges
9. `POST()` - 17 edges
10. `Card()` - 17 edges

## Surprising Connections (you probably didn't know these)
- `damage()` --calls--> `analyseMatter()`  [EXTRACTED]
  tests/unit/ai-reviewer.test.ts → src/lib/ai/analyst.ts
- `StepSummary()` --indirect_call--> `practiceAreaLabel()`  [INFERRED]
  src/app/(app)/onboarding/[step]/page.tsx → src/lib/practice-areas.ts
- `LoginForm()` --indirect_call--> `signInAction()`  [INFERRED]
  src/app/login/login-form.tsx → src/app/login/actions.ts
- `withFirmScopeGuard()` --references--> `@prisma/client`  [EXTRACTED]
  src/lib/data/firm-scope.ts → package.json
- `AdminFirmsPage()` --calls--> `requirePlatformAdmin()`  [EXTRACTED]
  src/app/(app)/admin/firms/page.tsx → src/lib/auth/guards.ts

## Import Cycles
- None detected.

## Communities (64 total, 10 thin omitted)

### Community 0 - "analyst.ts"
Cohesion: 0.05
Nodes (73): DEMO_MATTERS, DemoDocument, DemoMatter, DemoTask, analyseMatter(), analystInternals, AVAILABILITY_CLAIMS, availabilityContradictions() (+65 more)

### Community 1 - "dashboard/page.tsx"
Cohesion: 0.09
Nodes (56): ADR-0006, CHANNELS, POST(), POST(), ACTIONS, POST(), stringList(), metadata (+48 more)

### Community 2 - "constants.ts"
Cohesion: 0.05
Nodes (69): POST(), POST(), ApprovalsPage(), lockedLabel(), metadata, one(), PageProps, ApprovalCard() (+61 more)

### Community 3 - "fields.ts"
Cohesion: 0.06
Nodes (45): ADR-0002, POST(), DashboardPage(), NewMatterPage(), ACCEPT, Chosen, UploadPanel(), ALLOWED_DOCUMENT_EXTENSIONS (+37 more)

### Community 4 - "firm-scope.ts"
Cohesion: 0.09
Nodes (28): @prisma/client, @prisma/client, CACHEABLE_MODEL_NAMES, CACHEABLE_MODELS, catalogueCache, catalogueCacheSize(), CatalogueEntry, clearCatalogueCache() (+20 more)

### Community 5 - "allow"
Cohesion: 0.05
Nodes (38): allow, Bash(git add:*), Bash(git branch:*), Bash(git diff:*), Bash(git log:*), Bash(git show:*), Bash(git status:*), Bash(graphify explain:*) (+30 more)

### Community 6 - "compilerOptions"
Cohesion: 0.06
Nodes (35): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+27 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (35): dotenv, eslint, eslint-config-next, jsdom, devDependencies, dotenv, eslint, eslint-config-next (+27 more)

### Community 8 - "scripts"
Cohesion: 0.06
Nodes (33): scripts, build, check, codemap, db:generate, db:migrate, db:reset, db:studio (+25 more)

### Community 9 - "env.ts"
Cohesion: 0.11
Nodes (21): HomePage(), AI_PROVIDERS, AiProviderName, APP_ENVIRONMENTS, AppEnvironment, EnvironmentError, EnvSource, parseServerEnv() (+13 more)

### Community 10 - "[id]/page.tsx"
Cohesion: 0.14
Nodes (22): aiFeatureLabel(), MatterPage(), metadata, PageProps, TABS, activityLabel(), AnalysisStatus(), AnalysisWarnings() (+14 more)

### Community 11 - "run.ts"
Cohesion: 0.14
Nodes (14): ADR-0008, POST(), buildInput(), recordUsage(), runAnalysis(), RunOutcome, SIMULATED_USAGE, summariseForApproval() (+6 more)

### Community 12 - "brand.tsx"
Cohesion: 0.14
Nodes (6): metadata, metadata, viewport, metadata, OrchelioWordmark(), WordmarkProps

### Community 13 - "config.ts"
Cohesion: 0.21
Nodes (16): StepSummary(), AI_FEATURE_OPTIONS, LOCKED_APPROVAL_OPTIONS, resolveKey(), WORKFLOW_STEP_OPTIONS, aiFeatureIdsFrom(), aiFeatureKeysFor(), buildConfiguration() (+8 more)

### Community 14 - "activity/page.tsx"
Cohesion: 0.21
Nodes (14): ActivityPage(), metadata, one(), PageProps, ActivityDetail(), ActivityStatusBadge(), safeParse(), STATUS_TONE (+6 more)

### Community 15 - "[step]/page.tsx"
Cohesion: 0.15
Nodes (9): Answers, metadata, PageProps, CheckboxOption(), LockIcon(), ProgressBar(), StepActions(), WorkflowPreview() (+1 more)

### Community 16 - "ui.tsx"
Cohesion: 0.24
Nodes (12): metadata, PHASE_LABEL, PHASE_TONE, Badge(), badgeTone, Callout(), calloutTone, Card() (+4 more)

### Community 17 - "login/actions.ts"
Cohesion: 0.26
Nodes (11): safeRedirectTarget(), signInAction(), newCorrelationId(), consumeAttempt(), RateLimitResult, resetAllAttempts(), resetAttempts(), Window (+3 more)

### Community 18 - "app-shell.tsx"
Cohesion: 0.16
Nodes (10): ADMIN_NAV, ADMIN_PLANNED, AppShell(), FIRM_NAV, FIRM_PLANNED, NavItem, PlannedItem, PLATFORM_NAV (+2 more)

### Community 19 - "codemap.mjs"
Cohesion: 0.15
Nodes (8): files, grouped, lines, ROOT, SKIP_DIRECTORIES, SOURCE_EXTENSIONS, SOURCE_ROOTS, target

### Community 20 - "intake/page.tsx"
Cohesion: 0.27
Nodes (10): IntakePage(), metadata, metadata, TasksPage(), formatDate(), requireMatterAccess(), requestScoped, requestNow (+2 more)

### Community 21 - "matters/page.tsx"
Cohesion: 0.24
Nodes (11): MattersPage(), metadata, one(), PageProps, MatterLink(), relativeDays(), STATUS_TONE, StatusBadge() (+3 more)

### Community 22 - "onboarding.ts"
Cohesion: 0.23
Nodes (11): allMatterTypes, allPracticeAreas, allWorkflowTemplates, matterTypesForPracticeAreas(), workflowTemplatesFor(), completeOnboarding(), EMPTY_ANSWERS, ensureConfiguration() (+3 more)

### Community 23 - "docs-check.mjs"
Cohesion: 0.17
Nodes (9): allFiles, docFiles, DOCS, ENTRY, graph, linkCount, problems, ROOT (+1 more)

### Community 24 - "practice-areas.ts"
Cohesion: 0.24
Nodes (9): AdminFirmsPage(), StepMatterTypes(), FirmSwitcher(), ROLE_LABELS, isPracticeAreaAvailable(), PRACTICE_AREAS, PracticeArea, PracticeAreaKey (+1 more)

### Community 25 - "login/page.tsx"
Cohesion: 0.26
Nodes (8): SignInState, INITIAL, LoginForm(), LoginPage(), metadata, safeNext(), DemoAccount, visibleDemoAccounts()

### Community 26 - "audit.mjs"
Cohesion: 0.18
Nodes (8): findings, orSites, PRISMA_OUTSIDE_DATA_LAYER, prismaUsers, ROOT, seen, stale, UNSCOPED_DATA_EXPORTS

### Community 27 - "dependencies"
Cohesion: 0.18
Nodes (11): next, dependencies, next, @prisma/adapter-better-sqlite3, react, react-dom, server-only, @prisma/adapter-better-sqlite3 (+3 more)

### Community 28 - "doctor.mjs"
Cohesion: 0.20
Nodes (9): databaseFile, graphReport, [major], results, ROOT, run(), sourceFilesChangedSince(), symbol (+1 more)

### Community 29 - "new/page.tsx"
Cohesion: 0.29
Nodes (7): metadata, PageProps, Field(), GENERIC_MATTER_STATUSES, parseJsonObject(), parseStringArray(), toJsonColumn()

### Community 31 - "catalogue.ts"
Cohesion: 0.20
Nodes (9): AiFeatureOption, ApprovalOption, CONFIGURABLE_APPROVAL_OPTIONS, CURRENCIES, JURISDICTIONS, LANGUAGES, ScopedKey, TIMEZONES (+1 more)

### Community 32 - "deny"
Cohesion: 0.22
Nodes (9): permissions, ask, deny, Bash(git commit:*), Bash(git push:*), Bash(npm run db:reset), Bash(npm run reset-demo), Bash(npx prisma migrate dev:*) (+1 more)

### Community 33 - "app.json"
Cohesion: 0.22
Nodes (8): alwaysUpdateLinks, attachmentFolderPath, newLinkFormat, readableLineLength, showLineNumber, showUnsupportedFiles, strictLineBreaks, useMarkdownLinks

### Community 34 - "seed.ts"
Cohesion: 0.28
Nodes (8): DEMO_FIRMS, main(), MATTER_TYPES, MEMBERSHIPS, PRACTICE_AREAS, Step, WORKFLOW_TEMPLATES, DEMO_ACCOUNTS

### Community 35 - "data/documents.ts"
Cohesion: 0.22
Nodes (4): POST(), addDocument(), NewDocument, touchMatter()

### Community 36 - "ai/page.tsx"
Cohesion: 0.31
Nodes (8): AiWorkspacePage(), featureLabel(), metadata, ReviewStatus, reviewStatusLabel(), requireWorkspace(), requireWorkspacePermission(), listRecentAnalyses()

### Community 37 - "documents/page.tsx"
Cohesion: 0.36
Nodes (8): DocumentsPage(), metadata, one(), PageProps, fileSize(), listDocuments(), listMatters(), categoryLabel()

### Community 38 - "matters.ts"
Cohesion: 0.25
Nodes (7): createMatter(), getMatter(), matterCountsByStatus(), matterDetail(), MatterFilters, NewMatter, nextReference()

### Community 39 - "prisma.ts"
Cohesion: 0.25
Nodes (4): GuardedPrismaClient, formatCost(), UsageSummary, globalForPrisma

### Community 41 - "package.json"
Cohesion: 0.29
Nodes (6): description, engines, node, name, private, version

### Community 42 - "skills-check.mjs"
Cohesion: 0.29
Nodes (5): names, packageScripts, problems, ROOT, SKILLS

### Community 43 - "communications.ts"
Cohesion: 0.29
Nodes (4): POST(), createDraft(), DraftFilters, NewDraft

### Community 44 - "settings.json"
Cohesion: 0.33
Nodes (5): env, NEXT_TELEMETRY_DISABLED, hooks, SessionStart, $schema

### Community 45 - "password.ts"
Cohesion: 0.67
Nodes (4): encode(), hashPassword(), scryptAsync, verifyPassword()

### Community 46 - "approvals.spec.ts"
Cohesion: 0.47
Nodes (3): openMatter(), runAnalysis(), tabs()

### Community 48 - "onboarding.spec.ts"
Cohesion: 0.60
Nodes (5): check(), continueStep(), Page, signIn(), uncheckAll()

## Knowledge Gaps
- **349 isolated node(s):** `eslintConfig`, `PORT`, `config`, `metadata`, `metadata` (+344 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `withFirmScopeGuard()` connect `firm-scope.ts` to `prisma.ts`?**
  _High betweenness centrality (0.135) - this node is a cross-community bridge._
- **Why does `@prisma/client` connect `firm-scope.ts` to `dependencies`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `firm-scope.ts`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `PORT`, `config` to the rest of the system?**
  _349 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `analyst.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.051201671891327065 - nodes in this community are weakly interconnected._
- **Should `dashboard/page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0921409214092141 - nodes in this community are weakly interconnected._
- **Should `constants.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05092592592592592 - nodes in this community are weakly interconnected._